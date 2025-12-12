import { db } from '../../db';
import { proposals, templates, conversations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createAIProvider } from '../../lib/ai-provider';
import { LATEST_STABLE_MODELS } from '../../lib/models';
import { ragService } from '../rag';
import { getSectionPrompt, GENERATION_SYSTEM_PROMPT } from './prompts';
import { designGenerator } from '../design/generator';

export interface GenerationProgress {
  totalSections: number;
  completedSections: number;
  currentSection: string;
  percentage: number;
}

export type GenerationCallback = (progress: GenerationProgress) => void;

/**
 * Proposal Generator Service
 * Generates proposal content using AI with RAG context
 */
export class ProposalGenerator {
  private aiProvider: any;

  constructor() {
    // Use GPT-4o for high-quality enterprise proposal content generation
    this.aiProvider = createAIProvider('openai', LATEST_STABLE_MODELS.openai.gpt4o);
  }

  /**
   * Generate complete proposal from conversation data
   */
  async generateProposal(
    proposalId: string,
    onProgress?: GenerationCallback
  ): Promise<{ success: boolean; generatedContent: any }> {
    console.log(`Starting proposal generation for ${proposalId}...`);

    // Get proposal and template
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, proposal.templateId!));

    if (!template) {
      throw new Error('Template not found');
    }

    // Get conversation data
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.proposalId, proposalId));

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const extractedData = conversation.extractedData as any;
    const templateSchema = template.schema as any;
    const sections = templateSchema.sections || [];

    const totalSections = sections.length;
    let completedSections = 0;

    // Check if proposal already has generated content (resume capability)
    const existingContent = proposal.generatedContent as any;
    const generatedContent: any = existingContent && existingContent.sections ? {
      ...existingContent,
    } : {
      sections: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        templateId: template.id,
        model: LATEST_STABLE_MODELS.gemini.pro,
      },
    };

    // Count already completed sections
    if (existingContent && existingContent.sections) {
      completedSections = Object.keys(existingContent.sections).length;
      console.log(`Resuming generation: ${completedSections} sections already completed`);
    }

    // Set status to in_progress at the start
    await db
      .update(proposals)
      .set({
        status: 'in_progress',
        generatedContent,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Generate each section
    for (const section of sections) {
      const sectionId = section.id;
      const sectionTitle = section.title;
      const contentType = section.contentType || 'paragraphs';

      // Skip if section already generated (resume capability)
      if (generatedContent.sections[sectionId]) {
        console.log(`Skipping already generated section: ${sectionTitle}`);
        continue;
      }

      console.log(`Generating section: ${sectionTitle}...`);

      if (onProgress) {
        onProgress({
          totalSections,
          completedSections,
          currentSection: sectionTitle,
          percentage: Math.round((completedSections / totalSections) * 100),
        });
      }

      try {
        console.log(`\n📝 Generating section: ${sectionTitle}`);
        console.log(`   Type: ${section.type || 'general'}`);
        console.log(`   Content Type: ${contentType}`);

        // Get RAG context for this section
        console.log(`   🔍 Fetching RAG context...`);
        const ragContext = await this.getRAGContext(sectionTitle, extractedData);
        console.log(`   ${ragContext ? '✅ RAG context retrieved' : '⚠️ No RAG context found'}`);

        // Generate section content
        console.log(`   🤖 Calling AI to generate content...`);
        const result = await this.generateSection({
          sectionTitle,
          sectionType: section.type || 'general',
          contentType,
          extractedData,
          ragContext,
          templateInstructions: section.description,
        });

        console.log(`   ✅ Content generated (${result.content.length} chars)`);
        if (result.visualizations && result.visualizations.length > 0) {
          console.log(`   🎨 ${result.visualizations.length} visualization(s) extracted`);
        }

        generatedContent.sections[sectionId] = {
          title: sectionTitle,
          content: result.content,
          type: section.type,
          contentType,
          visualizations: result.visualizations,
          generatedAt: new Date().toISOString(),
        };

        completedSections++;

        // Auto-save after each section (incremental save)
        await db
          .update(proposals)
          .set({
            generatedContent,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId));

        console.log(`   💾 Saved section ${sectionTitle} (${completedSections}/${totalSections})`);
      } catch (error) {
        console.error(`\n❌ ERROR generating section ${sectionTitle}:`);
        console.error(`   Error type: ${error.constructor.name}`);
        console.error(`   Error message: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack trace:\n${error.stack}`);
        }
        if (error.response) {
          console.error(`   API Response:`, error.response);
        }

        generatedContent.sections[sectionId] = {
          title: sectionTitle,
          content: `[Error generating this section. Please edit manually.]`,
          error: true,
          errorMessage: error.message,
        };
        completedSections++;

        // Save even on error
        await db
          .update(proposals)
          .set({
            generatedContent,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId));

        console.log(`   💾 Saved error state for section ${sectionTitle}`);
      }
    }

    // Generate design system automatically
    console.log('\n🎨 Generating design system...');
    try {
      const designSystem = await designGenerator.generateDesignSystem({
        projectTitle: proposal.projectTitle || extractedData.project_title || 'Business Proposal',
        industry: extractedData.industry || extractedData.client_industry,
        clientCompany: proposal.clientCompany || extractedData.client_company,
        projectType: extractedData.project_type,
      });

      // Save design to proposal branding
      const branding = {
        primaryColor: designSystem.colors.primary,
        secondaryColor: designSystem.colors.secondary,
        accentColor: designSystem.colors.accent,
        successColor: designSystem.colors.success,
        warningColor: designSystem.colors.warning,
        errorColor: designSystem.colors.error,
        backgroundColor: designSystem.colors.background,
        surfaceColor: designSystem.colors.surface,
        headingFont: designSystem.fonts.headingFont,
        fontFamily: designSystem.fonts.bodyFont,
        coverLayout: designSystem.coverLayout,
        showClientLogo: true,
        showDate: true,
        backgroundStyle: 'gradient',
      };

      console.log('✅ Design system generated:', {
        colors: `${designSystem.colors.primary}, ${designSystem.colors.secondary}`,
        fonts: `${designSystem.fonts.headingFont} / ${designSystem.fonts.bodyFont}`,
        layout: designSystem.coverLayout,
      });

      // Save generated content and design to proposal
      await db
        .update(proposals)
        .set({
          generatedContent,
          branding,
          status: 'generated',
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposalId));
    } catch (error) {
      console.error('❌ Design generation failed, using defaults:', error.message);

      // Save with default branding if design generation fails
      await db
        .update(proposals)
        .set({
          generatedContent,
          branding: {
            primaryColor: '#3b82f6',
            secondaryColor: '#10b981',
            accentColor: '#FFB347',
            successColor: '#10b981',
            warningColor: '#f59e0b',
            errorColor: '#ef4444',
            backgroundColor: '#ffffff',
            surfaceColor: '#f9fafb',
            headingFont: 'Poppins',
            fontFamily: 'Inter',
            coverLayout: 'centered',
            showClientLogo: true,
            showDate: true,
            backgroundStyle: 'gradient',
          },
          status: 'generated',
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposalId));
    }

    if (onProgress) {
      onProgress({
        totalSections,
        completedSections,
        currentSection: 'Complete',
        percentage: 100,
      });
    }

    console.log(`✅ Proposal generation complete: ${proposalId}`);

    return {
      success: true,
      generatedContent,
    };
  }

  /**
   * Parse visualizations (mermaid diagrams, charts, tables, and callouts) from AI-generated content
   */
  private parseVisualizations(content: string): {
    cleanedContent: string;
    visualizations: Array<{ type: 'mermaid' | 'chart' | 'table' | 'callout'; data: any }>;
  } {
    const visualizations: Array<{ type: 'mermaid' | 'chart' | 'table' | 'callout'; data: any }> = [];
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    let inCallout = false;
    let calloutLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if line starts with JSON visualization block
      if (trimmed.startsWith('{"type":')) {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(trimmed);

          if (parsed.type === 'mermaid' && parsed.code) {
            visualizations.push({
              type: 'mermaid',
              data: {
                code: parsed.code,
                caption: parsed.caption || undefined,
              },
            });
            continue;
          } else if (parsed.type === 'chart' && parsed.chartType && parsed.data) {
            visualizations.push({
              type: 'chart',
              data: {
                chartType: parsed.chartType,
                chartData: parsed.data,
                caption: parsed.caption || undefined,
              },
            });
            continue;
          } else if (parsed.type === 'table' && parsed.headers && parsed.rows) {
            visualizations.push({
              type: 'table',
              data: {
                tableType: parsed.tableType || 'summary',
                headers: parsed.headers,
                rows: parsed.rows,
                caption: parsed.caption || undefined,
                styling: parsed.styling || undefined,
              },
            });
            continue;
          }
        } catch (error) {
          console.warn('Failed to parse visualization JSON:', trimmed);
        }
      }

      // Check for callout boxes (markdown blockquotes with bold title)
      // Format: > **Title:** Content
      if (trimmed.startsWith('>')) {
        if (!inCallout) {
          inCallout = true;
          calloutLines = [line];
        } else {
          calloutLines.push(line);
        }
        continue;
      } else if (inCallout) {
        // End of callout, process it
        const calloutContent = calloutLines
          .map(l => l.replace(/^>\s*/, ''))
          .join('\n');

        const titleMatch = calloutContent.match(/^\*\*([^:]+):\*\*\s*(.+)/s);
        if (titleMatch) {
          visualizations.push({
            type: 'callout',
            data: {
              title: titleMatch[1].trim(),
              content: titleMatch[2].trim(),
            },
          });
        }

        inCallout = false;
        calloutLines = [];
      }

      // Keep this line
      cleanedLines.push(line);
    }

    // Handle any remaining callout at end of content
    if (inCallout && calloutLines.length > 0) {
      const calloutContent = calloutLines
        .map(l => l.replace(/^>\s*/, ''))
        .join('\n');

      const titleMatch = calloutContent.match(/^\*\*([^:]+):\*\*\s*(.+)/s);
      if (titleMatch) {
        visualizations.push({
          type: 'callout',
          data: {
            title: titleMatch[1].trim(),
            content: titleMatch[2].trim(),
          },
        });
      }
    }

    return {
      cleanedContent: cleanedLines.join('\n').trim(),
      visualizations
    };
  }

  /**
   * Generate a single section with RAG context
   */
  private async generateSection(data: {
    sectionTitle: string;
    sectionType: string;
    contentType: 'paragraphs' | 'bullets' | 'table' | 'mixed';
    extractedData: any;
    ragContext?: string;
    templateInstructions?: string;
  }): Promise<{ content: string; visualizations?: any[] }> {
    const prompt = getSectionPrompt(data);

    try {
      const rawContent = await this.aiProvider.generateText(
        prompt,
        GENERATION_SYSTEM_PROMPT,
        {
          temperature: 0.7,
          maxTokens: 4096,  // Increased from 2048 to support comprehensive, detailed content (800-1000 words per section)
        }
      );

      // DEBUG: Log raw AI output to see what's being generated
      console.log('\n[AI-DEBUG] ========== RAW AI OUTPUT START ==========');
      console.log(`[AI-DEBUG] Section: ${data.sectionTitle}`);
      console.log(`[AI-DEBUG] Content length: ${rawContent.length} chars`);
      console.log('[AI-DEBUG] Raw content (first 1000 chars):');
      console.log(rawContent.substring(0, 1000));
      console.log('[AI-DEBUG] Raw content (last 500 chars):');
      console.log(rawContent.substring(Math.max(0, rawContent.length - 500)));

      // Check for JSON visualization blocks
      const jsonMatches = rawContent.match(/\{"type":/g);
      console.log(`[AI-DEBUG] Found ${jsonMatches ? jsonMatches.length : 0} JSON blocks starting with {"type":`);

      // Check for callouts
      const calloutMatches = rawContent.match(/^>\s*\*\*/gm);
      console.log(`[AI-DEBUG] Found ${calloutMatches ? calloutMatches.length : 0} markdown callout blocks (> **)`);
      console.log('[AI-DEBUG] ========== RAW AI OUTPUT END ==========\n');

      // Parse and extract visualizations
      const { cleanedContent, visualizations } = this.parseVisualizations(rawContent);

      return {
        content: cleanedContent.trim(),
        visualizations: visualizations.length > 0 ? visualizations : undefined,
      };
    } catch (error) {
      console.error('Error calling AI provider:', error);
      throw error;
    }
  }

  /**
   * Get RAG context for a section
   */
  private async getRAGContext(
    sectionTitle: string,
    extractedData: any
  ): Promise<string | undefined> {
    if (!extractedData.projectType && !extractedData.industry) {
      return undefined;
    }

    try {
      // Build search query
      let query = sectionTitle;

      if (extractedData.projectType) {
        query += ` ${extractedData.projectType}`;
      }

      if (extractedData.industry) {
        query += ` ${extractedData.industry}`;
      }

      // Search for similar content
      const results = await ragService.search(query, {
        topK: 3,
        filters: {
          industry: extractedData.industry,
          projectType: extractedData.projectType,
        },
        minSimilarity: 0.6,
      });

      if (results.length === 0) {
        return undefined;
      }

      // Build context string
      return ragService.buildContext(results);
    } catch (error) {
      console.error('RAG search failed:', error);
      return undefined;
    }
  }

  /**
   * Regenerate a specific section
   */
  async regenerateSection(
    proposalId: string,
    sectionId: string,
    options?: { includeImages?: boolean; includeCharts?: boolean; includeDiagrams?: boolean }
  ): Promise<{ success: boolean; content: string }> {
    console.log(`Regenerating section ${sectionId} for proposal ${proposalId} with options:`, options);

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, proposal.templateId!));

    if (!template) {
      throw new Error('Template not found');
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.proposalId, proposalId));

    const extractedData = conversation?.extractedData as any || {};
    const templateSchema = template.schema as any;
    const section = templateSchema.sections.find((s: any) => s.id === sectionId);

    if (!section) {
      throw new Error('Section not found in template');
    }

    const ragContext = await this.getRAGContext(section.title, extractedData);

    // Build instructions based on options
    let generationInstructions = section.description || '';
    if (options?.includeImages) {
      generationInstructions += '\n\nIMPORTANT: Include relevant images and pictures in this section using markdown image syntax.';
    }
    if (options?.includeCharts) {
      generationInstructions += '\n\nIMPORTANT: Include relevant charts and data visualizations in JSON format for this section.';
    }
    if (options?.includeDiagrams) {
      generationInstructions += '\n\nIMPORTANT: Include relevant diagrams (flowcharts, process diagrams, etc.) using Mermaid syntax for this section.';
    }

    const result = await this.generateSection({
      sectionTitle: section.title,
      sectionType: section.type || 'general',
      contentType: section.contentType || 'paragraphs',
      extractedData,
      ragContext,
      templateInstructions: generationInstructions,
    });

    // Update the specific section in generatedContent
    const generatedContent = (proposal.generatedContent as any) || { sections: {} };
    generatedContent.sections[sectionId] = {
      title: section.title,
      content: result.content,
      type: section.type,
      contentType: section.contentType,
      visualizations: result.visualizations,
      generatedAt: new Date().toISOString(),
    };

    await db
      .update(proposals)
      .set({
        generatedContent,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    return {
      success: true,
      content: result.content,
    };
  }
}

export const proposalGenerator = new ProposalGenerator();
