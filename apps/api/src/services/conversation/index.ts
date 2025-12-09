import { db } from '../../db';
import { conversations, proposals } from '../../db/schema';
import {
  ConversationPhase,
  ExtractedData,
  Message,
  Conversation,
} from '@proposal-gen/shared';
import { createAIProvider } from '../../lib/ai-provider';
import { eq } from 'drizzle-orm';
import {
  SYSTEM_PROMPT,
  PHASE_INTRO_PROMPTS,
  DATA_EXTRACTION_PROMPT,
  getNextQuestionPrompt,
  getPhaseCompletionPrompt,
  PHASE_DESCRIPTIONS,
} from './prompts';
import { ragService } from '../rag';

const PHASE_ORDER: ConversationPhase[] = [
  'client_info',
  'project_details',
  'technical_architecture',
  'scope',
  'methodology',
  'team_resources',
  'detailed_deliverables',
  'timeline',
  'stakeholders',
  'success_metrics',
  'risks',
  'budget',
  'visual_preferences',
  'final_review',
  'complete',
];

export class ConversationService {
  private aiProvider: any;

  constructor() {
    // Use GPT-4o for Q&A (better instruction following, more accurate)
    this.aiProvider = createAIProvider('openai', 'gpt-4o');
  }

  /**
   * Start a new conversation for a proposal
   */
  async startConversation(templateId: string): Promise<{
    conversationId: string;
    message: string;
    currentPhase: ConversationPhase;
    progress: number;
  }> {
    // Create a new proposal
    const [proposal] = await db
      .insert(proposals)
      .values({
        templateId,
        clientName: '',
        clientCompany: '',
        projectTitle: '',
        status: 'draft',
      })
      .returning();

    // Initialize conversation
    const initialPhase: ConversationPhase = 'client_info';
    const initialMessage: Message = {
      role: 'assistant',
      content: PHASE_INTRO_PROMPTS[initialPhase],
      timestamp: new Date(),
    };

    const [conversation] = await db
      .insert(conversations)
      .values({
        proposalId: proposal.id,
        messages: [initialMessage],
        extractedData: {},
        currentPhase: initialPhase,
        isComplete: false,
      })
      .returning();

    return {
      conversationId: conversation.id,
      message: initialMessage.content,
      currentPhase: initialPhase,
      progress: 0,
    };
  }

  /**
   * Process user message and generate response
   */
  async chat(
    conversationId: string,
    userMessage: string
  ): Promise<{
    message: string;
    extractedData: ExtractedData;
    currentPhase: ConversationPhase;
    isComplete: boolean;
    progress: number;
    phaseDescription: string;
  }> {
    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message to history
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const messages = [...(conversation.messages as Message[]), userMsg];

    // Extract data from conversation
    const extractedData = await this.extractData(messages, conversation.extractedData as ExtractedData);

    // Check if current phase is complete
    const isPhaseComplete = await this.isPhaseComplete(
      conversation.currentPhase as ConversationPhase,
      extractedData
    );

    // Determine next phase
    let nextPhase = conversation.currentPhase as ConversationPhase;
    let assistantMessage = '';

    if (isPhaseComplete) {
      const currentIndex = PHASE_ORDER.indexOf(conversation.currentPhase as ConversationPhase);
      if (currentIndex < PHASE_ORDER.length - 1) {
        nextPhase = PHASE_ORDER[currentIndex + 1];
        // Use predefined intro for new phase
        assistantMessage = PHASE_INTRO_PROMPTS[nextPhase];
      } else {
        nextPhase = 'complete';
        assistantMessage = PHASE_INTRO_PROMPTS['complete'];
      }
    } else {
      // Generate next question for current phase
      assistantMessage = await this.generateNextQuestion(
        conversation.currentPhase as ConversationPhase,
        extractedData,
        messages
      );
    }

    // Add assistant message to history
    const assistantMsg: Message = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, assistantMsg];

    // Calculate progress
    const progress = this.calculateProgress(nextPhase, extractedData);

    // Update conversation
    await db
      .update(conversations)
      .set({
        messages: updatedMessages,
        extractedData,
        currentPhase: nextPhase,
        isComplete: nextPhase === 'complete',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Update proposal with extracted data
    await this.updateProposal(conversation.proposalId as string, extractedData);

    return {
      message: assistantMessage,
      extractedData,
      currentPhase: nextPhase,
      isComplete: nextPhase === 'complete',
      progress,
      phaseDescription: PHASE_DESCRIPTIONS[nextPhase],
    };
  }

  /**
   * Get conversation state
   */
  async getConversation(conversationId: string): Promise<any> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const progress = this.calculateProgress(
      conversation.currentPhase as ConversationPhase,
      conversation.extractedData as ExtractedData
    );

    return {
      ...conversation,
      progress,
      phaseDescription: PHASE_DESCRIPTIONS[conversation.currentPhase as ConversationPhase],
    };
  }

  /**
   * Extract structured data from conversation using AI
   */
  private async extractData(
    messages: Message[],
    existingData: ExtractedData
  ): Promise<ExtractedData> {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const response = await this.aiProvider.generateText(
        `FULL CONVERSATION HISTORY:
${conversationText}

EXISTING DATA THAT MUST BE PRESERVED (DO NOT OVERWRITE):
${JSON.stringify(existingData, null, 2)}

TASK: Extract ONLY NEW information from the conversation. Keep all existing data unchanged.`,
        DATA_EXTRACTION_PROMPT,
        { jsonMode: true }
      );

      // Strip markdown code blocks if present (```json ... ```)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleanedResponse);

      // Merge with existing data (preserve what we already have)
      // Existing data takes precedence - only add new fields
      const mergedData: any = { ...existingData };

      // Only add new fields that don't exist or are null/undefined in existing data
      for (const [key, value] of Object.entries(parsed.extractedData || {})) {
        if (value !== null && value !== undefined) {
          // Only update if existing value is null, undefined, or empty
          if (
            existingData[key] === null ||
            existingData[key] === undefined ||
            existingData[key] === '' ||
            (Array.isArray(existingData[key]) && existingData[key].length === 0)
          ) {
            mergedData[key] = value;
          }
        }
      }

      return mergedData;
    } catch (error) {
      console.error('Error extracting data:', error);
      return existingData;
    }
  }

  /**
   * Generate next question using AI with RAG context
   */
  private async generateNextQuestion(
    phase: ConversationPhase,
    extractedData: ExtractedData,
    messages: Message[]
  ): Promise<string> {
    const conversationHistory = messages
      .slice(-6) // Last 6 messages for context
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    let enhancedPrompt = getNextQuestionPrompt(phase, extractedData, conversationHistory);

    // Use RAG for relevant phases to provide better context from past successful proposals
    const RAG_ENABLED_PHASES: ConversationPhase[] = [
      'project_details',
      'technical_architecture',
      'scope',
      'methodology',
      'team_resources',
      'detailed_deliverables',
    ];

    if (RAG_ENABLED_PHASES.includes(phase) && extractedData.projectType) {
      try {
        const ragResults = await ragService.search(
          `${extractedData.projectType} ${extractedData.industry || ''}`,
          {
            topK: 3,
            filters: {
              industry: extractedData.industry,
              projectType: extractedData.projectType,
            },
            minSimilarity: 0.6,
          }
        );

        if (ragResults.length > 0) {
          const ragContext = ragService.buildContext(ragResults);
          enhancedPrompt = `${ragContext}\n\n${enhancedPrompt}\n\nUse the examples above to ask more informed questions about similar projects.`;
        }
      } catch (error) {
        console.error('RAG search failed, proceeding without context:', error);
      }
    }

    try {
      const question = await this.aiProvider.generateText(enhancedPrompt, SYSTEM_PROMPT);
      return question.trim();
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback to generic question
      return "Could you provide more details about that?";
    }
  }

  /**
   * Check if current phase has all required information
   */
  private async isPhaseComplete(
    phase: ConversationPhase,
    extractedData: ExtractedData
  ): Promise<boolean> {
    // Check if phase has minimum required information
    // Using OR logic - if ANY required field exists, phase is complete
    switch (phase) {
      case 'client_info':
        return !!(extractedData.clientName || extractedData.clientCompany);

      case 'project_details':
        return !!(extractedData.projectTitle || extractedData.projectType);

      case 'technical_architecture':
        return !!(
          extractedData.systemComponents?.length ||
          extractedData.technologyStack ||
          extractedData.technologies?.length
        );

      case 'scope':
        return !!(extractedData.scope || extractedData.deliverables?.length);

      case 'methodology':
        return !!(extractedData.developmentMethodology || extractedData.qualityAssurance);

      case 'team_resources':
        return !!(extractedData.teamStructure?.length || extractedData.keyPersonnel?.length);

      case 'detailed_deliverables':
        return !!(extractedData.deliverablesByPhase?.length || extractedData.deliverables?.length);

      case 'timeline':
        return !!(extractedData.timeline || extractedData.startDate || extractedData.endDate);

      case 'stakeholders':
        return !!(extractedData.keyStakeholders?.length || extractedData.approvalWorkflow);

      case 'success_metrics':
        return !!(extractedData.kpis?.length || extractedData.successCriteria?.length);

      case 'risks':
        return !!(extractedData.identifiedRisks?.length || extractedData.riskFactors?.length);

      case 'budget':
        return !!(extractedData.budget || extractedData.budgetRange);

      case 'visual_preferences':
        // Optional - always complete
        return true;

      case 'final_review':
        // Always complete after user confirms
        return true;

      case 'complete':
        return true;

      default:
        return false;
    }
  }

  /**
   * Calculate progress percentage dynamically based on current phase
   */
  private calculateProgress(phase: ConversationPhase, extractedData: ExtractedData): number {
    // Find the index of the current phase in PHASE_ORDER
    const currentIndex = PHASE_ORDER.indexOf(phase);

    // If phase not found or is the first phase, return 0
    if (currentIndex === -1 || currentIndex === 0) {
      return 0;
    }

    // If it's the complete phase, return 100
    if (phase === 'complete') {
      return 100;
    }

    // Calculate progress dynamically based on phase position
    // Exclude 'complete' from the total count for percentage calculation
    const totalPhases = PHASE_ORDER.length - 1; // -1 to exclude 'complete'
    const progress = Math.round((currentIndex / totalPhases) * 100);

    return progress;
  }

  /**
   * Update proposal with extracted data
   */
  private async updateProposal(proposalId: string, extractedData: ExtractedData): Promise<void> {
    await db
      .update(proposals)
      .set({
        clientName: extractedData.clientName || '',
        clientCompany: extractedData.clientCompany || '',
        projectTitle: extractedData.projectTitle || '',
        projectType: extractedData.projectType || undefined,
        scope: extractedData.scope || undefined,
        objectives: extractedData.objectives || undefined,
        budget: extractedData.budget || undefined,
        timeline: extractedData.timeline || undefined,
        technologies: extractedData.technologies || undefined,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));
  }
}

export const conversationService = new ConversationService();
