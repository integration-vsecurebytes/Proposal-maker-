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
    const branding = templateSchema.branding || {};
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
        children: await this.createCoverPage(proposal, companyLogo, clientLogo),
      },
      // Table of contents
      {
        properties: {},
        children: this.createTableOfContents(sections),
      },
      // Main content
      {
        properties: {
          page: {
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
        properties: {},
        children: this.createSignaturePage(proposal),
      },
    ];

    // Create document
    const doc = new Document({
      creator: proposal.extractedData?.companyName || 'Company',
      title: proposal.projectTitle || 'Proposal',
      description: `Proposal for ${proposal.clientCompany}`,
      sections: docSections,
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * Create cover page
   */
  private async createCoverPage(
    proposal: any,
    companyLogo: any,
    clientLogo: any
  ): Promise<Paragraph[]> {
    const content: Paragraph[] = [];

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

    // Title
    content.push(
      new Paragraph({
        text: proposal.projectTitle || 'Proposal',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 400 },
      })
    );

    // Client company
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared for: ${proposal.clientCompany}`,
            size: 32,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Client name
    if (proposal.clientName) {
      content.push(
        new Paragraph({
          text: proposal.clientName,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Date
    content.push(
      new Paragraph({
        text: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
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

    content.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    return content;
  }

  /**
   * Create signature page
   */
  private createSignaturePage(proposal: any): Paragraph[] {
    const content: Paragraph[] = [];

    content.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

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

    content.push(
      new Paragraph({
        children: [signatureTable as any],
      })
    );

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

    for (const templateSection of templateSections) {
      const sectionId = templateSection.id;
      const sectionData = sections[sectionId];

      if (!sectionData || !sectionData.content) {
        continue;
      }

      // Section title with themed color
      const primaryColor = this.hexToRgb(branding.primary_color || '#3b82f6');
      content.push(
        new Paragraph({
          text: sectionData.title,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200,
          },
          shading: primaryColor ? {
            type: ShadingType.CLEAR,
            color: this.rgbToHex(primaryColor.r, primaryColor.g, primaryColor.b),
          } : undefined,
        })
      );

      // Section content (text)
      const contentParagraphs = this.formatContent(
        sectionData.content,
        sectionData.contentType
      );
      content.push(...contentParagraphs);

      // Process visualizations if present
      if (sectionData.visualizations && Array.isArray(sectionData.visualizations)) {
        for (const viz of sectionData.visualizations) {
          try {
            if (viz.type === 'table') {
              // Generate rich table
              const tableElement = await this.createRichTable(viz.data, templateSchema);
              if (tableElement) {
                content.push(tableElement);
                // Add caption if present
                if (viz.data.caption) {
                  content.push(
                    new Paragraph({
                      text: viz.data.caption,
                      italics: true,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 300 },
                    })
                  );
                }
              }
            } else if (viz.type === 'chart') {
              // Generate chart image
              const chartImage = await this.embedChartImage(viz.data);
              if (chartImage) {
                content.push(
                  new Paragraph({
                    children: [chartImage],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 },
                  })
                );
                // Add caption
                if (viz.data.caption) {
                  content.push(
                    new Paragraph({
                      text: viz.data.caption,
                      italics: true,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 300 },
                    })
                  );
                }
              }
            } else if (viz.type === 'mermaid') {
              // Generate diagram image
              const diagramImage = await this.embedDiagramImage(viz.data);
              if (diagramImage) {
                content.push(
                  new Paragraph({
                    children: [diagramImage],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 },
                  })
                );
                // Add caption
                if (viz.data.caption) {
                  content.push(
                    new Paragraph({
                      text: viz.data.caption,
                      italics: true,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 300 },
                    })
                  );
                }
              }
            } else if (viz.type === 'callout') {
              // Create callout box
              const calloutParagraph = this.createCalloutBox(viz.data, templateSchema);
              if (calloutParagraph) {
                content.push(calloutParagraph);
              }
            }
          } catch (error) {
            console.error(`Failed to embed visualization (${viz.type}):`, error);
            // Continue with other visualizations
          }
        }
      }

      // Add spacing after section
      content.push(
        new Paragraph({
          text: '',
          spacing: { after: 300 },
        })
      );
    }

    return content;
  }

  /**
   * Format content based on type
   */
  private formatContent(content: string, contentType: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    if (contentType === 'bullets') {
      // Handle bullet points
      const lines = content.split('\n').filter((line) => line.trim());

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
      // In a real implementation, you'd parse and create actual tables
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content,
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
      // Regular paragraphs
      const lines = content.split('\n\n');

      for (const para of lines) {
        if (para.trim()) {
          paragraphs.push(
            new Paragraph({
              text: para.trim(),
              spacing: {
                after: 200,
              },
            })
          );
        }
      }
    }

    return paragraphs;
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
   */
  private async createRichTable(tableData: any, templateSchema: any): Promise<Table | null> {
    try {
      const { headers, rows } = tableData;
      const tableStyles = templateSchema.table_styles || {};

      // Parse colors
      const headerBg = this.hexToRgb(tableStyles.header_bg_color || '#3b82f6');
      const headerText = this.hexToRgb(tableStyles.header_text_color || '#ffffff');
      const borderColor = tableStyles.border_color || '#e5e7eb';
      const alternatingRows = tableStyles.alternating_rows !== false;
      const rowOddBg = this.hexToRgb(tableStyles.row_odd_bg || '#f9fafb');
      const rowEvenBg = this.hexToRgb(tableStyles.row_even_bg || '#ffffff');

      // Create header row
      const headerRow = new TableRow({
        children: headers.map((header: string) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: headerText ? this.rgbToHex(headerText.r, headerText.g, headerText.b) : 'FFFFFF',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: headerBg ? {
              type: ShadingType.CLEAR,
              color: this.rgbToHex(headerBg.r, headerBg.g, headerBg.b),
              fill: this.rgbToHex(headerBg.r, headerBg.g, headerBg.b),
            } : undefined,
            verticalAlign: VerticalAlign.CENTER,
          })
        ),
        tableHeader: true,
      });

      // Create data rows
      const dataRows = rows.map((row: any[], index: number) => {
        const isOdd = index % 2 === 0;
        const bgColor = alternatingRows ? (isOdd ? rowOddBg : rowEvenBg) : null;

        return new TableRow({
          children: row.map((cell: any) => {
            const cellValue = typeof cell === 'object' ? cell.value : cell;
            const isBold = typeof cell === 'object' ? cell.bold : false;

            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: String(cellValue),
                      bold: isBold,
                    }),
                  ],
                }),
              ],
              shading: bgColor ? {
                type: ShadingType.CLEAR,
                color: this.rgbToHex(bgColor.r, bgColor.g, bgColor.b),
                fill: this.rgbToHex(bgColor.r, bgColor.g, bgColor.b),
              } : undefined,
            });
          }),
        });
      });

      const table = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [headerRow, ...dataRows],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
          left: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
          right: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColor.replace('#', '') },
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
   */
  private async embedChartImage(chartData: any): Promise<ImageRun | null> {
    try {
      const { chartType, chartData: data, caption } = chartData;

      // Generate chart image
      const imageBuffer = await chartImageService.generateFromChartData(
        chartType,
        data,
        caption,
        {
          width: 800,
          height: 500,
          backgroundColor: '#ffffff',
        }
      );

      // Resize for document
      const resizedBuffer = await sharp(imageBuffer)
        .resize(600, 375, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();

      const metadata = await sharp(resizedBuffer).metadata();

      return new ImageRun({
        data: resizedBuffer,
        transformation: {
          width: metadata.width || 600,
          height: metadata.height || 375,
        },
      });
    } catch (error) {
      console.error('Failed to embed chart image:', error);
      return null;
    }
  }

  /**
   * Embed diagram as image
   */
  private async embedDiagramImage(diagramData: any): Promise<ImageRun | null> {
    try {
      const { code, caption } = diagramData;

      // Generate diagram image
      const imageBuffer = await diagramImageService.generateDiagramImage(code, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // Resize for document
      const resizedBuffer = await sharp(imageBuffer)
        .resize(600, 400, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();

      const metadata = await sharp(resizedBuffer).metadata();

      return new ImageRun({
        data: resizedBuffer,
        transformation: {
          width: metadata.width || 600,
          height: metadata.height || 400,
        },
      });
    } catch (error) {
      console.error('Failed to embed diagram image:', error);
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
