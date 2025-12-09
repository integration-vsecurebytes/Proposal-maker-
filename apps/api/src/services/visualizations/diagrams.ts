import { createAIProvider } from '../../lib/ai-provider';
import { LATEST_STABLE_MODELS } from '../../lib/models';
import type { DiagramConfig, DiagramType, GenerateDiagramRequest } from '@proposal-gen/shared';
import { db } from '../../db';
import { proposals, visualizations } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface DiagramGenerationContext {
  proposalId: string;
  sectionId: string;
  diagramType: DiagramType;
  description: string;
  extractedData?: any;
}

export class DiagramGenerationService {
  private aiProvider = createAIProvider('grok', LATEST_STABLE_MODELS.grok.latest);

  /**
   * Generate a diagram configuration using AI
   */
  async generateDiagram(request: GenerateDiagramRequest): Promise<DiagramConfig> {
    const { proposalId, sectionId, diagramType, description } = request;

    // Get proposal data for context
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const extractedData = proposal.extractedData || {};

    // Generate diagram code using AI
    const diagramCode = await this.generateMermaidCode({
      proposalId,
      sectionId,
      diagramType,
      description,
      extractedData,
    });

    const config: DiagramConfig = {
      type: diagramType,
      title: description,
      code: diagramCode,
    };

    return config;
  }

  /**
   * Generate Mermaid code using AI
   */
  private async generateMermaidCode(ctx: DiagramGenerationContext): Promise<string> {
    const prompt = this.buildDiagramPrompt(ctx);

    const response = await this.aiProvider.generateText(
      prompt,
      'You are a Mermaid diagram expert. Generate valid Mermaid syntax for professional diagrams.'
    );

    // Extract Mermaid code from response
    let mermaidCode = response;

    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:mermaid)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      mermaidCode = codeBlockMatch[1].trim();
    }

    // Validate that it starts with a valid Mermaid diagram type
    if (!this.isValidMermaidCode(mermaidCode, ctx.diagramType)) {
      throw new Error('Generated invalid Mermaid code');
    }

    return mermaidCode;
  }

  /**
   * Build AI prompt for diagram generation
   */
  private buildDiagramPrompt(ctx: DiagramGenerationContext): string {
    const { diagramType, description, extractedData } = ctx;

    let prompt = `Generate a ${diagramType} diagram using Mermaid syntax.\n\n`;

    prompt += `Diagram Purpose: ${description}\n\n`;

    // Add proposal context
    if (extractedData.projectTitle) {
      prompt += `Project: ${extractedData.projectTitle}\n`;
    }
    if (extractedData.clientCompany) {
      prompt += `Client: ${extractedData.clientCompany}\n`;
    }
    if (extractedData.scope?.phases) {
      prompt += `Project Phases: ${extractedData.scope.phases.map((p: any) => p.name || p).join(', ')}\n`;
    }
    if (extractedData.timeline?.milestones) {
      prompt += `Milestones: ${extractedData.timeline.milestones.map((m: any) => m.name || m).join(', ')}\n`;
    }

    // Diagram-specific instructions
    prompt += `\n${this.getDiagramTypeInstructions(diagramType)}\n\n`;

    prompt += `Requirements:
- Use proper Mermaid syntax for ${diagramType}
- Make it professional and clear
- Use appropriate styling and formatting
- Include all relevant information from the context
- Return ONLY the Mermaid code, no explanations

Generate the Mermaid diagram code now:`;

    return prompt;
  }

  /**
   * Get diagram-specific generation instructions
   */
  private getDiagramTypeInstructions(diagramType: DiagramType): string {
    switch (diagramType) {
      case 'flowchart':
        return `Create a flowchart diagram showing process flow. Use:
- Start with: flowchart TD or flowchart LR
- Use clear node labels
- Show decision points with diamond shapes
- Use appropriate connectors and arrows
- Include all major steps in the process

Example structure:
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]`;

      case 'sequence':
        return `Create a sequence diagram showing interactions. Use:
- Start with: sequenceDiagram
- Define participants clearly
- Show message flow between actors
- Include activations and notes where helpful
- Follow chronological order

Example structure:
sequenceDiagram
    participant Client
    participant System
    Client->>System: Request
    System-->>Client: Response`;

      case 'gantt':
        return `Create a Gantt chart for project timeline. Use:
- Start with: gantt
- Set appropriate date format and axis format
- Define sections for project phases
- Include realistic tasks and durations
- Show dependencies where applicable

Example structure:
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: 2024-01-01, 30d`;

      case 'architecture':
        return `Create a system architecture diagram. Use:
- Start with: graph TD or C4Context
- Show system components clearly
- Include data flows and connections
- Use subgraphs for logical grouping
- Label all components and connections

Example structure:
graph TD
    A[Frontend] --> B[API]
    B --> C[Database]`;

      case 'erDiagram':
        return `Create an Entity-Relationship diagram. Use:
- Start with: erDiagram
- Define entities with attributes
- Show relationships clearly
- Use proper cardinality notation
- Include key attributes

Example structure:
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
    }`;

      default:
        return 'Create an appropriate diagram for the given context.';
    }
  }

  /**
   * Validate Mermaid code
   */
  private isValidMermaidCode(code: string, diagramType: DiagramType): boolean {
    const trimmedCode = code.trim();

    switch (diagramType) {
      case 'flowchart':
        return trimmedCode.startsWith('flowchart') || trimmedCode.startsWith('graph');
      case 'sequence':
        return trimmedCode.startsWith('sequenceDiagram');
      case 'gantt':
        return trimmedCode.startsWith('gantt');
      case 'architecture':
        return trimmedCode.startsWith('graph') || trimmedCode.startsWith('flowchart') || trimmedCode.startsWith('C4');
      case 'erDiagram':
        return trimmedCode.startsWith('erDiagram');
      default:
        return true;
    }
  }

  /**
   * Save generated diagram to database
   */
  async saveDiagram(proposalId: string, sectionId: string, config: DiagramConfig): Promise<any> {
    const [visualization] = await db
      .insert(visualizations)
      .values({
        proposalId,
        sectionId,
        type: 'diagram',
        config,
      })
      .returning();

    return visualization;
  }

  /**
   * Update existing diagram
   */
  async updateDiagram(visualizationId: string, config: DiagramConfig): Promise<any> {
    const [updated] = await db
      .update(visualizations)
      .set({
        config,
        updatedAt: new Date(),
      })
      .where(eq(visualizations.id, visualizationId))
      .returning();

    return updated;
  }

  /**
   * Get diagram by ID
   */
  async getDiagram(visualizationId: string): Promise<any> {
    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, visualizationId));

    return visualization;
  }

  /**
   * Get all diagrams for a proposal
   */
  async getProposalDiagrams(proposalId: string): Promise<any[]> {
    const diagrams = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.proposalId, proposalId));

    return diagrams.filter(v => v.type === 'diagram');
  }

  /**
   * Validate and fix common Mermaid syntax issues
   */
  validateAndFixMermaid(code: string): string {
    let fixed = code.trim();

    // Remove any leading/trailing markdown code blocks
    fixed = fixed.replace(/^```(?:mermaid)?\n?/, '');
    fixed = fixed.replace(/\n?```$/, '');

    // Ensure single newline between lines
    fixed = fixed.replace(/\n{3,}/g, '\n\n');

    return fixed;
  }
}

export const diagramGenerationService = new DiagramGenerationService();
