import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TableOfContents,
  convertInchesToTwip,
  ShadingType,
  VerticalAlign,
} from 'docx';
import { db } from '../../db';
import { proposals, templates, assets } from '../../db/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { chartImageService } from './chart-to-image';
import { diagramImageService } from './diagram-to-image';

/**
 * Normalized branding colors interface
 */
interface BrandingColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderColor: string;
  headerTextColor: string;
  rowOddBg: string;
  rowEvenBg: string;
  backgroundColor: string;
  surfaceColor: string;
  fontFamily: string;
}

/**
 * Normalize branding property names to camelCase
 * Handles both camelCase (from proposal.branding) and snake_case (from template)
 */
function normalizeBranding(branding: any): BrandingColors {
  return {
    primaryColor: branding.primaryColor || branding.primary_color || '#3b82f6',
    secondaryColor: branding.secondaryColor || branding.secondary_color || '#64748b',
    accentColor: branding.accentColor || branding.accent_color || '#FFB347',
    borderColor: branding.borderColor || branding.border_color || '#e5e7eb',
    headerTextColor: branding.headerTextColor || branding.header_text_color || '#ffffff',
    rowOddBg: branding.rowOddBg || branding.row_odd_bg || '#f9fafb',
    rowEvenBg: branding.rowEvenBg || branding.row_even_bg || '#ffffff',
    backgroundColor: branding.backgroundColor || branding.background_color || '#ffffff',
    surfaceColor: branding.surfaceColor || branding.surface_color || '#f9fafb',
    fontFamily: branding.fontFamily || branding.font_family || 'Arial, sans-serif',
  };
}

/**
 * DOCX Generator Service
 * Generates professional Word documents from proposal content
 */
export class DocxGenerator {
  /**
   * Generate DOCX file from proposal
   */
  async generateDocx(proposalId: string): Promise<Buffer> {
    // Get proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get template
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, proposal.templateId!));

    if (!template) {
      throw new Error('Template not found');
    }

    // Get assets
    const proposalAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.proposalId, proposalId));

    const companyLogo = proposalAssets.find((a) => a.type === 'company_logo');
    const clientLogo = proposalAssets.find((a) => a.type === 'client_logo');

    const templateSchema = template.schema as any;

    // Merge branding: proposal overrides template
    const proposalBranding = proposal.branding || {};
    const templateBranding = templateSchema.branding || {};
    const branding = {
      ...templateBranding,
      ...proposalBranding, // Proposal overrides template
    };

    const generatedContent = proposal.generatedContent as any;
    const sections = generatedContent?.sections || {};

    // Create document sections
    const docSections = [
      // Cover page
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: await this.createCoverPage(proposal, companyLogo, clientLogo, branding),
      },
      // Table of contents
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: this.createTableOfContents(sections),
      },
      // Main content
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: proposal.projectTitle || 'Proposal',
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT],
                  }),
                ],
              }),
            ],
          }),
        },
        children: await this.createContent(proposal, template, sections, branding),
      },
      // Signature page
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: this.createSignaturePage(proposal),
      },
    ];

    // CRITICAL: Validate that no section has empty children array
    // This prevents Word corruption errors
    for (let i = 0; i < docSections.length; i++) {
      const section = docSections[i];
      if (!section.children || section.children.length === 0) {
        console.error(`[DOCX] Section ${i} has no children! Adding fallback paragraph.`);
        section.children = [
          new Paragraph({
            text: '[Content unavailable]',
            spacing: { after: 200 },
          }),
        ];
      }
    }

    // Create document
    const doc = new Document({
      creator: (proposal.extractedData as any)?.companyName || 'Company',
      title: proposal.projectTitle || 'Proposal',
      description: `Proposal for ${proposal.clientCompany}`,
      sections: docSections,
    });

    // Generate buffer
    try {
      const buffer = await Packer.toBuffer(doc);
      console.log(`[DOCX] Generated: ${buffer.length} bytes for proposal ${proposal.id}`);
      return buffer;
    } catch (error) {
      console.error(`[DOCX] Generation error for proposal ${proposal.id}:`, error);
      throw new Error(`Failed to generate DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create cover page
   */
  private async createCoverPage(
    proposal: any,
    companyLogo: any,
    clientLogo: any,
    branding: any = {}
  ): Promise<Paragraph[]> {
    const content: Paragraph[] = [];

    // Normalize branding colors
    const normalizedBranding = normalizeBranding(branding);
    const primaryColor = this.hexToRgb(normalizedBranding.primaryColor);
    const secondaryColor = this.hexToRgb(normalizedBranding.secondaryColor);

    // Company logo
    if (companyLogo?.data) {
      const logoImage = await this.prepareImage(companyLogo.data, 400, 200);
      if (logoImage) {
        content.push(
          new Paragraph({
            children: [logoImage],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }
    }

    // Title with primary color
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: proposal.projectTitle || 'Proposal',
            size: 56,
            bold: true,
            color: primaryColor ? this.rgbToHex(primaryColor.r, primaryColor.g, primaryColor.b).replace('#', '') : '3b82f6',
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 400 },
      })
    );

    // Client company with secondary color
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared for: ${proposal.clientCompany}`,
            size: 32,
            bold: true,
            color: secondaryColor ? this.rgbToHex(secondaryColor.r, secondaryColor.g, secondaryColor.b).replace('#', '') : '64748b',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Client name with secondary color
    if (proposal.clientName) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proposal.clientName,
              size: 24,
              color: secondaryColor ? this.rgbToHex(secondaryColor.r, secondaryColor.g, secondaryColor.b).replace('#', '') : '64748b',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Date with secondary color
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            size: 22,
            color: secondaryColor ? this.rgbToHex(secondaryColor.r, secondaryColor.g, secondaryColor.b).replace('#', '') : '64748b',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
      })
    );

    // Client logo
    if (clientLogo?.data) {
      const logoImage = await this.prepareImage(clientLogo.data, 300, 150);
      if (logoImage) {
        content.push(
          new Paragraph({
            children: [logoImage],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 },
          })
        );
      }
    }

    // Note: No need for page break here - TOC is in a separate Word section
    // which automatically starts on a new page

    return content;
  }

  /**
   * Create table of contents
   */
  private createTableOfContents(sections: any): Paragraph[] {
    const content: Paragraph[] = [];

    content.push(
      new Paragraph({
        text: 'Table of Contents',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    );

    let index = 1;
    Object.entries(sections).forEach(([sectionId, sectionData]: [string, any]) => {
      if (!sectionData?.title) return;

      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index}. ${sectionData.title}`,
              size: 24,
            }),
            new TextRun({
              text: `\t${index + 1}`,
              size: 24,
            }),
          ],
          spacing: { after: 150 },
          tabStops: [
            {
              type: 'right',
              position: convertInchesToTwip(6),
            },
          ],
        })
      );
      index++;
    });

    // Note: No need for page break here - main content is in a separate Word section
    // which automatically starts on a new page

    return content;
  }

  /**
   * Create signature page
   */
  private createSignaturePage(proposal: any): (Paragraph | Table)[] {
    const content: (Paragraph | Table)[] = [];

    // Note: No need for page break here - signature is in a separate Word section
    // which automatically starts on a new page

    content.push(
      new Paragraph({
        text: 'Agreement',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    );

    content.push(
      new Paragraph({
        text: 'By signing below, both parties agree to the terms and conditions outlined in this proposal.',
        spacing: { after: 600 },
      })
    );

    // Signature table
    const signatureTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: proposal.extractedData?.companyName || 'Company Name',
                      bold: true,
                    }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: proposal.clientCompany || 'Client Company',
                      bold: true,
                    }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '________________________' }),
                new Paragraph({ text: 'Signature' }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '________________________' }),
                new Paragraph({ text: 'Signature' }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: '________________________' }),
                new Paragraph({ text: 'Date' }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ text: '________________________' }),
                new Paragraph({ text: 'Date' }),
              ],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
    });

    // Add table directly to content (NOT wrapped in a Paragraph)
    content.push(signatureTable);

    return content;
  }

  /**
   * Create document content
   */
  private async createContent(
    proposal: any,
    template: any,
    sections: any,
    branding: any
  ): Promise<(Paragraph | Table)[]> {
    const content: (Paragraph | Table)[] = [];
    const templateSchema = template.schema as any;
    const templateSections = templateSchema.sections || [];

    // Normalize branding for consistent color access
    const normalizedBranding = normalizeBranding(branding);

    console.log(`[DOCX] ========== DOCUMENT GENERATION START ==========`);
    console.log(`[DOCX] Proposal ID: ${proposal.id}`);
    console.log(`[DOCX] Template sections: ${templateSections.length}`);
    console.log(`[DOCX] Sections with content: ${Object.keys(sections).length}`);
    console.log(`[DOCX] Available section IDs: ${Object.keys(sections).join(', ')}`);

    // Track section index for page break logic
    let sectionIndex = 0;
    const totalSections = templateSections.filter((ts: any) => sections[ts.id]?.content).length;

    for (const templateSection of templateSections) {
      const sectionId = templateSection.id;
      const sectionData = sections[sectionId];

      if (!sectionData || !sectionData.content) {
        console.log(`[DOCX] Skipping section ${sectionId} - no content`);
        continue;
      }

      console.log(`\n[DOCX] ===== Processing section ${sectionId} =====`);
      console.log(`[DOCX] Section title: ${sectionData.title || 'No title'}`);
      console.log(`[DOCX] Content length: ${typeof sectionData.content === 'string' ? sectionData.content.length : 'not a string'} chars`);
      console.log(`[DOCX] Has visualizations array: ${!!sectionData.visualizations}`);
      console.log(`[DOCX] Visualizations count: ${sectionData.visualizations?.length || 0}`);

      sectionIndex++;

      // Section title with themed color and inline markdown parsing
      const primaryColor = this.hexToRgb(normalizedBranding.primaryColor);

      // Parse inline markdown in section title
      const titleRuns = this.parseInlineMarkdown(sectionData.title);

      // Apply primary color and bold to all runs
      const coloredTitleRuns = titleRuns.map(run => {
        return new TextRun({
          text: run.text,
          bold: run.bold !== undefined ? run.bold : true,
          italics: run.italics,
          color: primaryColor ? this.rgbToHex(primaryColor.r, primaryColor.g, primaryColor.b).replace('#', '') : undefined,
          size: 32,
        });
      });

      content.push(
        new Paragraph({
          children: coloredTitleRuns,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200,
          },
        })
      );

      // Parse content and extract embedded visualizations
      const { textContent, embeddedVisualizations } = this.parseContentWithVisualizations(sectionData.content);

      // Section content (text only) - pass branding for colored headers
      const contentParagraphs = this.formatContent(
        textContent,
        sectionData.contentType,
        branding
      );
      content.push(...contentParagraphs);

      // Process embedded visualizations from content
      if (embeddedVisualizations.length > 0) {
        console.log(`[DOCX] Found ${embeddedVisualizations.length} embedded visualizations in content`);
        for (const viz of embeddedVisualizations) {
          await this.processVisualization(viz, content, templateSchema, branding);
        }
      }

      // Process visualizations array if present
      if (sectionData.visualizations && Array.isArray(sectionData.visualizations)) {
        console.log(`\n[DOCX] ===== Processing ${sectionData.visualizations.length} visualizations from array for section ${sectionId} =====`);
        for (let vizIndex = 0; vizIndex < sectionData.visualizations.length; vizIndex++) {
          const viz = sectionData.visualizations[vizIndex];
          console.log(`\n[DOCX] --- Visualization ${vizIndex + 1}/${sectionData.visualizations.length} ---`);
          console.log(`[DOCX] Raw visualization type: ${viz.type}`);
          console.log(`[DOCX] Raw visualization keys: ${Object.keys(viz).join(', ')}`);
          console.log(`[DOCX] Raw visualization data:`, JSON.stringify(viz, null, 2));

          // Unwrap nested data structure to flat format
          const vizData = this.unwrapVisualizationData(viz);
          console.log(`[DOCX] Unwrapped visualization type: ${vizData?.type}`);
          console.log(`[DOCX] Unwrapped visualization keys: ${vizData ? Object.keys(vizData).join(', ') : 'null'}`);
          console.log(`[DOCX] Unwrapped visualization data:`, JSON.stringify(vizData, null, 2));

          await this.processVisualization(vizData, content, templateSchema, branding);
        }
        console.log(`[DOCX] ===== Finished processing ${sectionData.visualizations.length} visualizations =====\n`);
      } else if (sectionData.visualizations) {
        console.log(`[DOCX] WARNING: visualizations exists but is not an array: ${typeof sectionData.visualizations}`);
        console.log(`[DOCX] Visualizations value:`, sectionData.visualizations);
      } else {
        console.log(`[DOCX] No visualizations array found for section ${sectionId}`);
      }

      // Add spacing after section
      content.push(
        new Paragraph({
          text: '',
          spacing: { after: 300 },
        })
      );

      // Add page break after section (except for the last section)
      // Last section doesn't need a page break since signature is in a separate Word section
      if (sectionIndex < totalSections) {
        content.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    console.log(`[DOCX] createContent returning ${content.length} elements (paragraphs/tables)`);

    // CRITICAL: Ensure content is never empty
    if (content.length === 0) {
      console.error('[DOCX] WARNING: No content generated! Adding fallback paragraph.');
      content.push(
        new Paragraph({
          text: '[No content available for this proposal]',
          spacing: { after: 200 },
        })
      );
    }

    return content;
  }

  /**
   * Format content based on type - with Markdown support
   */
  private formatContent(content: any, contentType: string, branding: any = {}): (Paragraph | Table)[] {
    const paragraphs: (Paragraph | Table)[] = [];

    // Normalize branding colors
    const normalizedBranding = normalizeBranding(branding);
    const primaryColor = this.hexToRgb(normalizedBranding.primaryColor);
    const secondaryColor = this.hexToRgb(normalizedBranding.secondaryColor);

    // Extract text content if it's an object
    let textContent: string;
    if (typeof content === 'string') {
      textContent = content;
    } else if (content && typeof content === 'object') {
      // Handle object content - extract text property or stringify
      textContent = content.text || content.content || JSON.stringify(content, null, 2);
    } else {
      textContent = String(content || '');
    }

    if (contentType === 'bullets') {
      // Handle bullet points
      const lines = textContent.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanLine) {
          paragraphs.push(
            new Paragraph({
              text: cleanLine,
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            })
          );
        }
      }
    } else if (contentType === 'table') {
      // For tables, just format as monospace text for now
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: textContent,
              font: 'Courier New',
              size: 20,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );
    } else {
      // Regular paragraphs with Markdown parsing
      const lines = textContent.split('\n');
      let i = 0;

      while (i < lines.length) {
        const trimmedLine = lines[i].trim();

        // Skip empty lines
        if (!trimmedLine) {
          i++;
          continue;
        }

        // Skip horizontal rules
        if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
          paragraphs.push(
            new Paragraph({
              text: '',
              spacing: { before: 200, after: 200 },
            })
          );
          i++;
          continue;
        }

        // Parse Markdown tables: | header | header |
        if (trimmedLine.startsWith('|')) {
          const tableResult = this.parseMarkdownTable(lines, i, branding);
          if (tableResult.table) {
            paragraphs.push(tableResult.table);
            i = tableResult.nextIndex;
            continue;
          }
        }

        // Parse Markdown headers: # Header, ## Header, ### Header, #### Header, ##### Header, ###### Header
        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const headerText = headerMatch[2].trim();

          // Map markdown levels to Word heading levels (h1-h6)
          const headingLevel = level === 1 ? HeadingLevel.HEADING_2 :
                               level === 2 ? HeadingLevel.HEADING_3 :
                               level === 3 ? HeadingLevel.HEADING_3 :
                               level === 4 ? HeadingLevel.HEADING_4 :
                               level === 5 ? HeadingLevel.HEADING_5 :
                               HeadingLevel.HEADING_6;

          // Use primary color for h1, secondary for others
          const headerColor = level === 1 ? primaryColor : secondaryColor;

          // Font sizes for different heading levels
          const fontSize = level === 1 ? 32 :
                          level === 2 ? 28 :
                          level === 3 ? 26 :
                          level === 4 ? 24 :
                          level === 5 ? 22 :
                          20;

          // Parse inline markdown in header text
          const headerRuns = this.parseInlineMarkdown(headerText);

          // Apply header color and size to all runs
          const coloredRuns = headerRuns.map(run => {
            return new TextRun({
              text: run.text,
              bold: run.bold !== undefined ? run.bold : true,
              italics: run.italics,
              color: headerColor ? this.rgbToHex(headerColor.r, headerColor.g, headerColor.b).replace('#', '') : undefined,
              size: fontSize,
            });
          });

          // Create paragraph with formatted text runs
          const headerParagraph = new Paragraph({
            heading: headingLevel,
            spacing: {
              before: 300,
              after: 150,
            },
            children: coloredRuns
          });

          paragraphs.push(headerParagraph);
          i++;
          continue;
        }

        // Parse bullet points: - item or * item
        const bulletMatch = trimmedLine.match(/^[\-\*]\s+(.+)$/);
        if (bulletMatch) {
          const bulletText = bulletMatch[1].trim();
          const textRuns = this.parseInlineMarkdown(bulletText);

          paragraphs.push(
            new Paragraph({
              children: textRuns.map(run => new TextRun(run)),
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            })
          );
          i++;
          continue;
        }

        // Regular text with inline formatting
        const textRuns = this.parseInlineMarkdown(trimmedLine);

        paragraphs.push(
          new Paragraph({
            children: textRuns.map(run => new TextRun(run)),
            spacing: {
              after: 150,
            },
          })
        );
        i++;
      }
    }

    return paragraphs;
  }

  /**
   * Parse Markdown table and convert to Word Table with dynamic branding colors
   * Matches the preview styling with proper colors
   */
  private parseMarkdownTable(lines: string[], startIndex: number, branding: any = {}): { table: Table | null; nextIndex: number } {
    const tableLine = lines[startIndex].trim();

    // Check if this is a table header row
    if (!tableLine.startsWith('|') || !tableLine.endsWith('|')) {
      return { table: null, nextIndex: startIndex + 1 };
    }

    // Parse header row
    const headerCells = tableLine
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // Check for separator row (e.g., |---|---|)
    let currentIndex = startIndex + 1;
    if (currentIndex >= lines.length) {
      return { table: null, nextIndex: startIndex + 1 };
    }

    const separatorLine = lines[currentIndex].trim();
    if (!separatorLine.match(/^\|[\s\-:]+\|/)) {
      return { table: null, nextIndex: startIndex + 1 };
    }
    currentIndex++;

    // Parse data rows
    const dataRows: string[][] = [];
    while (currentIndex < lines.length) {
      const rowLine = lines[currentIndex].trim();
      if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
        break;
      }

      const rowCells = rowLine
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

      dataRows.push(rowCells);
      currentIndex++;
    }

    // Normalize branding for consistent colors - matching preview defaults
    const normalizedBranding = normalizeBranding(branding);
    const primaryColorHex = normalizedBranding.primaryColor || '#3b82f6';
    const headerTextColorHex = normalizedBranding.headerTextColor || '#ffffff';
    const borderColorHex = normalizedBranding.borderColor || '#e5e7eb';
    const rowOddBgHex = normalizedBranding.rowOddBg || '#ffffff';
    const rowEvenBgHex = normalizedBranding.rowEvenBg || '#f9fafb';

    // Parse to RGB
    const primaryColor = this.hexToRgb(primaryColorHex);
    const headerTextColor = this.hexToRgb(headerTextColorHex);
    const rowOddBg = this.hexToRgb(rowOddBgHex);
    const rowEvenBg = this.hexToRgb(rowEvenBgHex);

    // Helper to convert RGB to hex WITHOUT # prefix (DOCX requirement)
    const rgbToHexNoHash = (rgb: { r: number; g: number; b: number } | null): string => {
      if (!rgb) return 'FFFFFF';
      return this.rgbToHex(rgb.r, rgb.g, rgb.b).replace('#', '');
    };

    // Border color without # prefix
    const borderColorNoHash = borderColorHex.replace('#', '');

    // Create Word table with dynamic colors matching preview
    const headerRow = new TableRow({
      children: headerCells.map(cellText =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: true,
                  color: rgbToHexNoHash(headerTextColor),
                  size: 22, // 11pt
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: primaryColor ? {
            type: ShadingType.CLEAR,
            color: rgbToHexNoHash(primaryColor),
            fill: rgbToHexNoHash(primaryColor),
          } : undefined,
          verticalAlign: VerticalAlign.CENTER,
          margins: {
            top: convertInchesToTwip(0.08),
            bottom: convertInchesToTwip(0.08),
            left: convertInchesToTwip(0.1),
            right: convertInchesToTwip(0.1),
          },
        })
      ),
      tableHeader: true,
    });

    const tableDataRows = dataRows.map((row, rowIndex) => {
      const isOdd = rowIndex % 2 === 0; // 0, 2, 4... are odd rows
      const bgColor = isOdd ? rowOddBg : rowEvenBg;

      return new TableRow({
        children: row.map(cellText =>
          new TableCell({
            children: [
              new Paragraph({
                children: this.parseInlineMarkdown(cellText).map(run => new TextRun({
                  ...run,
                  size: 20, // 10pt
                  color: '374151', // text-gray-700
                })),
              }),
            ],
            shading: bgColor ? {
              type: ShadingType.CLEAR,
              color: rgbToHexNoHash(bgColor),
              fill: rgbToHexNoHash(bgColor),
            } : undefined,
            margins: {
              top: convertInchesToTwip(0.06),
              bottom: convertInchesToTwip(0.06),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          })
        ),
      });
    });

    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [headerRow, ...tableDataRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        left: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        right: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
      },
    });

    return { table, nextIndex: currentIndex };
  }

  /**
   * Parse inline Markdown formatting (bold, italic)
   * Returns plain objects that can be converted to TextRun
   */
  private parseInlineMarkdown(text: string): Array<{ text: string; bold?: boolean; italics?: boolean }> {
    const runs: Array<{ text: string; bold?: boolean; italics?: boolean }> = [];
    let currentIndex = 0;

    // Match **bold** or __bold__
    const boldRegex = /(\*\*|__)(.*?)\1/g;
    // Match *italic* or _italic_
    const italicRegex = /(\*|_)(.*?)\1/g;

    // Combined regex to match bold and italic
    const combinedRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;

    let match;
    const matches: Array<{ index: number; length: number; text: string; bold: boolean; italic: boolean }> = [];

    // Find all bold patterns
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[2],
        bold: true,
        italic: false,
      });
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // If no formatting found, return plain text
    if (matches.length === 0) {
      return [{ text }];
    }

    // Build text runs with formatting
    for (const match of matches) {
      // Add plain text before this match
      if (match.index > currentIndex) {
        const plainText = text.substring(currentIndex, match.index);
        if (plainText) {
          runs.push({ text: plainText });
        }
      }

      // Add formatted text
      runs.push({
        text: match.text,
        bold: match.bold,
        italics: match.italic,
      });

      currentIndex = match.index + match.length;
    }

    // Add remaining plain text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        runs.push({ text: remainingText });
      }
    }

    return runs;
  }

  /**
   * Parse content and extract embedded JSON visualizations
   */
  private parseContentWithVisualizations(content: any): { textContent: string; embeddedVisualizations: any[] } {
    let textContent = '';
    const embeddedVisualizations: any[] = [];

    // Convert to string if needed
    if (typeof content === 'object') {
      textContent = content.text || content.content || JSON.stringify(content);
    } else {
      textContent = String(content || '');
    }

    // First pass: Extract JSON code blocks: ```json ... ```
    const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
    let match;
    let lastIndex = 0;
    let cleanText = '';

    while ((match = jsonBlockRegex.exec(textContent)) !== null) {
      // Add text before this code block
      cleanText += textContent.substring(lastIndex, match.index);

      try {
        // Parse the JSON visualization
        const vizData = JSON.parse(match[1]);
        console.log(`[DOCX] Extracted embedded JSON visualization: ${vizData.type}`);
        embeddedVisualizations.push(vizData);
      } catch (error) {
        console.error('[DOCX] Failed to parse embedded JSON visualization:', error);
        // If parsing fails, keep the code block as text
        cleanText += match[0];
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last JSON code block
    cleanText += textContent.substring(lastIndex);

    // Second pass: Extract Mermaid code blocks: ```mermaid ... ```
    const mermaidBlockRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    lastIndex = 0;
    let finalText = '';

    while ((match = mermaidBlockRegex.exec(cleanText)) !== null) {
      // Add text before this code block
      finalText += cleanText.substring(lastIndex, match.index);

      // Create a mermaid visualization from the code block
      const mermaidCode = match[1].trim();
      if (mermaidCode) {
        console.log(`[DOCX] Extracted embedded Mermaid diagram (${mermaidCode.length} chars)`);
        embeddedVisualizations.push({
          type: 'mermaid',
          code: mermaidCode,
          caption: 'Diagram'
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last Mermaid code block
    finalText += cleanText.substring(lastIndex);

    return {
      textContent: finalText.trim(),
      embeddedVisualizations
    };
  }

  /**
   * Validate table visualization data structure
   */
  private isValidTableData(data: any): boolean {
    return data &&
           Array.isArray(data.headers) &&
           data.headers.length > 0 &&
           Array.isArray(data.rows) &&
           data.rows.length > 0;
  }

  /**
   * Validate chart visualization data structure
   */
  private isValidChartData(data: any): boolean {
    return data &&
           typeof data.chartType === 'string' &&
           data.chartData !== undefined &&
           data.chartData !== null;
  }

  /**
   * Validate mermaid diagram data structure
   * Accepts code in: code, diagramCode, or mermaidCode fields
   */
  private isValidDiagramData(data: any): boolean {
    if (!data) return false;

    // Check all possible code field names
    const code = data.code || data.diagramCode || data.mermaidCode;
    return typeof code === 'string' && code.trim().length > 0;
  }

  /**
   * Validate callout data structure
   */
  private isValidCalloutData(data: any): boolean {
    return data &&
           typeof data.title === 'string' &&
           typeof data.content === 'string';
  }

  /**
   * Unwrap and normalize visualization data structure
   * Handles both nested { type, data: {...} } and flat { type, ...props } formats
   * Also normalizes code field names for diagrams
   */
  private unwrapVisualizationData(viz: any): any {
    if (!viz) {
      console.error('[DOCX] Null visualization');
      return null;
    }

    // Normalize type: "diagram" → "mermaid"
    let normalizedType = viz.type?.toLowerCase();
    if (normalizedType === 'diagram' || normalizedType === 'mermaid_diagram') {
      normalizedType = 'mermaid';
      console.log('[DOCX] Normalized type to "mermaid"');
    }

    let result: any;

    // Handle nested data structure
    if (viz.data && typeof viz.data === 'object') {
      result = {
        type: normalizedType,
        ...viz.data,
      };
    } else {
      // Flat structure
      result = {
        ...viz,
        type: normalizedType,
      };
    }

    // Normalize code field for mermaid diagrams
    // Accept: code, diagramCode, mermaidCode
    if (normalizedType === 'mermaid') {
      const codeValue = result.code || result.diagramCode || result.mermaidCode;
      if (codeValue && !result.code) {
        result.code = codeValue;
        console.log(`[DOCX] Normalized diagram code field (found in ${result.diagramCode ? 'diagramCode' : 'mermaidCode'})`);
      }
    }

    return result;
  }

  /**
   * Add fallback content when visualization fails
   */
  private addVisualizationFallback(content: (Paragraph | Table)[], vizType: string, reason: string): void {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[Visualization Unavailable: ${vizType}]`,
            italics: true,
            color: '999999',
          }),
        ],
        spacing: { before: 200, after: 200 },
        alignment: AlignmentType.CENTER,
      })
    );
    console.log(`[DOCX] Added fallback for ${vizType}: ${reason}`);
  }

  /**
   * Process a single visualization and add to content
   */
  private async processVisualization(viz: any, content: (Paragraph | Table)[], templateSchema: any, branding: any = {}): Promise<void> {
    try {
      // Normalize data structure and branding
      const normalizedViz = this.unwrapVisualizationData(viz);
      const normalizedBranding = normalizeBranding(branding);
      const vizType = normalizedViz.type;

      console.log(`[DOCX] Processing ${vizType} visualization with data:`,
                  Object.keys(normalizedViz).filter(k => k !== 'type'));

      if (vizType === 'table') {
        // Validate table data structure
        if (!this.isValidTableData(normalizedViz)) {
          console.error(`[DOCX] Invalid table data structure:`, normalizedViz);
          this.addVisualizationFallback(content, 'table', 'Invalid table data structure');
          return;
        }

        // Generate rich table
        const tableElement = await this.createRichTable(normalizedViz, templateSchema, branding);
        if (tableElement) {
          content.push(tableElement);
          // Add caption if present
          if (normalizedViz.caption) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: normalizedViz.caption,
                    italics: true,
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
          }
        } else {
          this.addVisualizationFallback(content, 'table', 'Failed to render table');
        }
      } else if (vizType === 'chart') {
        // Validate chart data structure
        if (!this.isValidChartData(normalizedViz)) {
          console.error('[DOCX] Chart validation failed:', {
            hasChartType: !!normalizedViz.chartType,
            chartType: normalizedViz.chartType,
            hasChartData: !!normalizedViz.chartData,
            hasLabels: !!normalizedViz.chartData?.labels,
            hasDatasets: !!normalizedViz.chartData?.datasets,
            labelsLength: normalizedViz.chartData?.labels?.length,
            datasetsLength: normalizedViz.chartData?.datasets?.length,
            fullData: JSON.stringify(normalizedViz, null, 2),
          });
          this.addVisualizationFallback(content, 'chart', 'Invalid chart data structure');
          return;
        }

        // Generate chart image with branding
        const chartImage = await this.embedChartImage(normalizedViz, normalizedBranding);
        if (chartImage) {
          content.push(
            new Paragraph({
              children: [chartImage],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            })
          );
          // Add caption
          if (normalizedViz.caption) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: normalizedViz.caption,
                    italics: true,
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
          }
        } else {
          this.addVisualizationFallback(content, 'chart', 'Failed to render chart');
        }
      } else if (vizType === 'mermaid') {
        // Validate diagram data structure
        if (!this.isValidDiagramData(normalizedViz)) {
          console.error('[DOCX] Diagram validation failed:', {
            hasCode: !!normalizedViz.code,
            hasDiagramCode: !!normalizedViz.diagramCode,
            hasMermaidCode: !!normalizedViz.mermaidCode,
            isCodeString: typeof (normalizedViz.code || normalizedViz.diagramCode || normalizedViz.mermaidCode) === 'string',
            codeLength: (normalizedViz.code || normalizedViz.diagramCode || normalizedViz.mermaidCode)?.length,
            available: Object.keys(normalizedViz),
            fullData: JSON.stringify(normalizedViz, null, 2),
          });
          this.addVisualizationFallback(content, 'diagram', 'Invalid diagram data structure');
          return;
        }

        // Generate diagram image with branding
        const diagramImage = await this.embedDiagramImage(normalizedViz, normalizedBranding);
        if (diagramImage) {
          content.push(
            new Paragraph({
              children: [diagramImage],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            })
          );
          // Add caption
          if (normalizedViz.caption) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: normalizedViz.caption,
                    italics: true,
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
          }
        } else {
          this.addVisualizationFallback(content, 'diagram', 'Failed to render diagram');
        }
      } else if (vizType === 'callout') {
        // Validate callout data structure
        if (!this.isValidCalloutData(normalizedViz)) {
          console.error(`[DOCX] Invalid callout data structure:`, normalizedViz);
          this.addVisualizationFallback(content, 'callout', 'Invalid callout data structure');
          return;
        }

        // Create callout box
        const calloutParagraph = this.createCalloutBox(normalizedViz, templateSchema);
        if (calloutParagraph) {
          content.push(calloutParagraph);
        } else {
          this.addVisualizationFallback(content, 'callout', 'Failed to render callout');
        }
      } else {
        console.warn(`[DOCX] Unknown visualization type: ${vizType}`);
        console.warn(`[DOCX] Full visualization data:`, JSON.stringify(normalizedViz, null, 2));
        this.addVisualizationFallback(content, vizType || 'unknown', `Unknown visualization type: ${vizType}`);
      }
    } catch (error) {
      console.error(`[DOCX] Failed to process visualization:`, error);
      console.error(`[DOCX] Visualization that failed:`, JSON.stringify(viz, null, 2));
      this.addVisualizationFallback(content, viz?.type || 'unknown',
                                     error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Prepare image for embedding
   */
  private async prepareImage(
    imageData: string,
    maxWidth: number = 600,
    maxHeight: number = 400
  ): Promise<ImageRun | null> {
    try {
      let imageBuffer: Buffer;

      // Check if base64 or file path
      if (imageData.startsWith('data:')) {
        // Base64
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (imageData.startsWith('/')) {
        // File path
        imageBuffer = await readFile(imageData);
      } else {
        return null;
      }

      // Resize image
      const resizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();

      // Get image metadata for accurate dimensions
      const metadata = await sharp(resizedBuffer).metadata();

      return new ImageRun({
        type: 'png',
        data: resizedBuffer,
        transformation: {
          width: metadata.width || maxWidth,
          height: metadata.height || maxHeight,
        },
      });
    } catch (error) {
      console.error('Failed to prepare image:', error);
      return null;
    }
  }

  /**
   * Create rich themed table from table data
   * Matches the preview styling with proper branding colors
   */
  private async createRichTable(tableData: any, templateSchema: any, branding: any = {}): Promise<Table | null> {
    try {
      // Defensive validation
      if (!tableData || !Array.isArray(tableData.headers) || !Array.isArray(tableData.rows)) {
        console.error('[DOCX] Invalid table structure in createRichTable:', {
          hasTableData: !!tableData,
          hasHeaders: tableData?.headers !== undefined,
          isHeadersArray: Array.isArray(tableData?.headers),
          hasRows: tableData?.rows !== undefined,
          isRowsArray: Array.isArray(tableData?.rows),
        });
        return null;
      }

      const { headers, rows, styling = {} } = tableData;
      const tableStyles = templateSchema.table_styles || {};

      // Normalize branding for consistent colors
      const normalizedBranding = normalizeBranding(branding);

      // Parse colors - prioritize per-table styling, then template styles, then branding, then defaults
      // Match preview's TableRenderer default colors
      const headerBgColor = styling.headerBg || tableStyles.header_bg_color || normalizedBranding.primaryColor || '#3b82f6';
      const headerTextColorHex = styling.headerTextColor || tableStyles.header_text_color || normalizedBranding.headerTextColor || '#ffffff';
      const borderColorHex = styling.borderColor || tableStyles.border_color || normalizedBranding.borderColor || '#e5e7eb';
      const alternatingRows = styling.alternateRows !== undefined ? styling.alternateRows : (tableStyles.alternating_rows !== false);

      // Match preview's alternating colors exactly: white (#ffffff) and gray (#f9fafb)
      const rowOddBgColor = styling.rowOddBg || tableStyles.row_odd_bg || normalizedBranding.rowOddBg || '#ffffff';
      const rowEvenBgColor = styling.rowEvenBg || tableStyles.row_even_bg || normalizedBranding.rowEvenBg || '#f9fafb';

      // Parse colors to RGB
      const headerBg = this.hexToRgb(headerBgColor);
      const headerText = this.hexToRgb(headerTextColorHex);
      const rowOddBg = this.hexToRgb(rowOddBgColor);
      const rowEvenBg = this.hexToRgb(rowEvenBgColor);

      // Helper to convert RGB to hex WITHOUT # prefix (DOCX requirement)
      const rgbToHexNoHash = (rgb: { r: number; g: number; b: number } | null): string => {
        if (!rgb) return 'FFFFFF';
        return this.rgbToHex(rgb.r, rgb.g, rgb.b).replace('#', '');
      };

      // Create header row with styling matching preview
      const headerRow = new TableRow({
        children: headers.map((header: string) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: rgbToHexNoHash(headerText),
                    size: 22, // 11pt - slightly larger for headers
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: headerBg ? {
              type: ShadingType.CLEAR,
              color: rgbToHexNoHash(headerBg),
              fill: rgbToHexNoHash(headerBg),
            } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: {
              top: convertInchesToTwip(0.08),
              bottom: convertInchesToTwip(0.08),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          })
        ),
        tableHeader: true,
      });

      // Create data rows with alternating backgrounds matching preview
      const dataRows = rows.map((row: any[], index: number) => {
        const isOdd = index % 2 === 0; // 0, 2, 4... are "odd" rows (first, third, etc.)
        const bgColor = alternatingRows ? (isOdd ? rowOddBg : rowEvenBg) : rowOddBg;

        // Check if this is a total/summary row
        const firstCell = typeof row[0] === 'object' ? row[0].value : row[0];
        const isTotalRow = String(firstCell).toUpperCase() === 'TOTAL';

        return new TableRow({
          children: row.map((cell: any) => {
            const cellValue = typeof cell === 'object' ? cell.value : cell;
            const isBold = typeof cell === 'object' ? cell.bold : isTotalRow;

            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: String(cellValue),
                      bold: isBold,
                      size: 20, // 10pt for body text
                      color: '374151', // text-gray-700 matching preview
                    }),
                  ],
                }),
              ],
              shading: bgColor ? {
                type: ShadingType.CLEAR,
                color: rgbToHexNoHash(bgColor),
                fill: rgbToHexNoHash(bgColor),
              } : undefined,
              margins: {
                top: convertInchesToTwip(0.06),
                bottom: convertInchesToTwip(0.06),
                left: convertInchesToTwip(0.1),
                right: convertInchesToTwip(0.1),
              },
            });
          }),
        });
      });

      // Border color without # prefix
      const borderColorNoHash = borderColorHex.replace('#', '');

      const table = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [headerRow, ...dataRows],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
          left: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
          right: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColorNoHash },
        },
      });

      return table;
    } catch (error) {
      console.error('Failed to create rich table:', error);
      return null;
    }
  }

  /**
   * Embed chart as image
   * Generates high-quality chart matching preview styling
   */
  private async embedChartImage(chartData: any, branding?: any): Promise<ImageRun | null> {
    try {
      // Defensive validation
      if (!chartData || typeof chartData.chartType !== 'string' || chartData.chartData === undefined || chartData.chartData === null) {
        console.error('[DOCX] Invalid chart structure in embedChartImage:', {
          hasChartData: !!chartData,
          hasChartType: chartData?.chartType !== undefined,
          isChartTypeString: typeof chartData?.chartType === 'string',
          hasData: chartData?.chartData !== undefined,
          dataIsNotNull: chartData?.chartData !== null,
        });
        return null;
      }

      const { chartType, chartData: data, caption } = chartData;

      console.log(`[DOCX] === CHART GENERATION START ===`);
      console.log(`[DOCX] Chart Type: ${chartType}`);
      console.log(`[DOCX] Chart Data:`, JSON.stringify(data, null, 2));
      console.log(`[DOCX] Caption: ${caption}`);
      console.log(`[DOCX] Branding Colors:`, branding);

      // Chart dimensions - LARGER for document visibility
      // Increased from 600x350 to 800x500 for better text readability
      const chartWidth = 800;
      const chartHeight = 500;

      // Generate high-quality chart image with branding
      // Using higher resolution (scale=2) for better quality in documents
      // White background for document clarity (matches preview container)
      const imageBuffer = await chartImageService.generateFromChartData(
        chartType,
        data,
        caption,
        {
          width: chartWidth,
          height: chartHeight,
          backgroundColor: '#ffffff', // White background matching preview container
          scale: 2, // 2x resolution for crisp rendering
        },
        branding
      );

      // Resize to final document size with high quality
      const resizedBuffer = await sharp(imageBuffer)
        .resize(chartWidth, chartHeight, {
          fit: 'inside',
          withoutEnlargement: false,
          kernel: sharp.kernel.lanczos3, // High-quality resampling
        })
        .png({ quality: 100, compressionLevel: 6 })
        .toBuffer();

      const metadata = await sharp(resizedBuffer).metadata();

      console.log(`[DOCX] Chart image: ${metadata.width}x${metadata.height}px, ${resizedBuffer.length} bytes`);

      return new ImageRun({
        type: 'png',
        data: resizedBuffer,
        transformation: {
          width: metadata.width || chartWidth,
          height: metadata.height || chartHeight,
        },
      });
    } catch (error) {
      console.error('[DOCX] Failed to embed chart image:', {
        chartType: chartData?.chartType,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Embed diagram as image
   * Generates Mermaid diagrams matching preview styling
   */
  private async embedDiagramImage(diagramData: any, branding?: any): Promise<ImageRun | null> {
    try {
      // Normalize field names (code, diagramCode, mermaidCode)
      const code = diagramData.code || diagramData.diagramCode || diagramData.mermaidCode;

      // Defensive validation
      if (!diagramData || typeof code !== 'string' || !code.trim()) {
        console.error('[DOCX] No mermaid code found:', {
          hasDiagramData: !!diagramData,
          checkedFields: ['code', 'diagramCode', 'mermaidCode'],
          available: diagramData ? Object.keys(diagramData) : [],
          fullData: JSON.stringify(diagramData, null, 2),
        });
        return null;
      }

      const { caption } = diagramData;

      console.log(`[DOCX] === DIAGRAM GENERATION START ===`);
      console.log(`[DOCX] Diagram Code:`, code);
      console.log(`[DOCX] Caption: ${caption}`);
      console.log(`[DOCX] Branding Colors:`, branding);

      // Max dimensions for DOCX - LARGER for better visibility
      // A4 page width ~595pt, using most of the usable width
      const maxDocWidth = 550;
      const maxDocHeight = 500;

      // Generate diagram image - SVG screenshot at natural size
      // Using large viewport to allow diagram to render fully
      const imageBuffer = await diagramImageService.generateDiagramImage(
        code,
        {
          width: 2000,  // Very large viewport for big diagrams
          height: 1600,
          backgroundColor: '#ffffff', // White background for documents
          scale: 2, // 2x scale for crisp text
        },
        branding
      );

      // Get actual image dimensions from the SVG screenshot
      const sourceMetadata = await sharp(imageBuffer).metadata();
      const srcWidth = sourceMetadata.width || 800;
      const srcHeight = sourceMetadata.height || 600;
      console.log(`[DOCX] Diagram source: ${srcWidth}x${srcHeight}px`);

      // Calculate scale to fit within max dimensions while maintaining aspect ratio
      const scaleX = maxDocWidth / srcWidth;
      const scaleY = maxDocHeight / srcHeight;
      const fitScale = Math.min(scaleX, scaleY, 1); // Don't enlarge

      const targetWidth = Math.round(srcWidth * fitScale);
      const targetHeight = Math.round(srcHeight * fitScale);

      // Resize if needed, otherwise use original
      let finalBuffer: Buffer;
      if (fitScale < 1) {
        finalBuffer = await sharp(imageBuffer)
          .resize(targetWidth, targetHeight, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3,
          })
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
      } else {
        finalBuffer = await sharp(imageBuffer)
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
      }

      const metadata = await sharp(finalBuffer).metadata();
      const finalWidth = metadata.width || targetWidth;
      const finalHeight = metadata.height || targetHeight;

      console.log(`[DOCX] Diagram final: ${finalWidth}x${finalHeight}px (scale: ${fitScale.toFixed(2)}), ${finalBuffer.length} bytes`);

      return new ImageRun({
        type: 'png',
        data: finalBuffer,
        transformation: {
          width: finalWidth,
          height: finalHeight,
        },
      });
    } catch (error) {
      console.error('[DOCX] Failed to embed diagram image:', {
        diagramType: diagramData?.diagramType,
        codeLength: diagramData?.code?.length,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Create callout box
   */
  private createCalloutBox(calloutData: any, templateSchema: any): Paragraph | null {
    try {
      const { title, content } = calloutData;
      const calloutStyles = templateSchema.callout_styles || {};

      // Determine callout type from title keywords
      let calloutType = 'info';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('success') || lowerTitle.includes('benefit')) {
        calloutType = 'success';
      } else if (lowerTitle.includes('warning') || lowerTitle.includes('risk')) {
        calloutType = 'warning';
      } else if (lowerTitle.includes('tip') || lowerTitle.includes('insight')) {
        calloutType = 'tip';
      } else if (lowerTitle.includes('note')) {
        calloutType = 'note';
      }

      const calloutStyle = calloutStyles[calloutType] || {};
      const borderColor = this.hexToRgb(calloutStyle.border || '#3b82f6');
      const backgroundColor = this.hexToRgb(calloutStyle.background || '#eff6ff');

      return new Paragraph({
        children: [
          new TextRun({
            text: `${calloutStyle.icon || '💡'} ${title}: `,
            bold: true,
          }),
          new TextRun({
            text: content,
          }),
        ],
        border: {
          left: {
            color: borderColor ? this.rgbToHex(borderColor.r, borderColor.g, borderColor.b).replace('#', '') : '3b82f6',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 24,
          },
        },
        shading: backgroundColor ? {
          type: ShadingType.CLEAR,
          color: this.rgbToHex(backgroundColor.r, backgroundColor.g, backgroundColor.b),
          fill: this.rgbToHex(backgroundColor.r, backgroundColor.g, backgroundColor.b),
        } : undefined,
        spacing: {
          before: 200,
          after: 200,
        },
      });
    } catch (error) {
      console.error('Failed to create callout box:', error);
      return null;
    }
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!hex) return null;

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

export const docxGenerator = new DocxGenerator();
