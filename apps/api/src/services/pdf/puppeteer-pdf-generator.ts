/**
 * Puppeteer PDF Generator
 * Generate high-quality PDFs using headless Chrome
 * Supports charts, diagrams, custom fonts, and complex layouts
 */

import { Cluster } from 'puppeteer-cluster';
import puppeteer, { PDFOptions } from 'puppeteer';
import ejs from 'ejs';
import juice from 'juice';
import fs from 'fs/promises';
import path from 'path';
import type { PDFGenerationOptions } from './pdf-orchestrator';
import { db } from '../../db';
import { templates } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { chartImageService } from '../documents/chart-to-image';
import { diagramImageService } from '../documents/diagram-to-image';

let cluster: Cluster | null = null;

/**
 * Initialize Puppeteer cluster (browser pool)
 */
async function getCluster(): Promise<Cluster> {
  if (cluster) return cluster;

  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 4, // Max 4 concurrent PDF generations
    puppeteer,
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    },
    timeout: 60000, // 60 second timeout per job
  });

  return cluster;
}

/**
 * Generate PDF using Puppeteer
 */
export async function generatePuppeteerPDF(
  proposal: any,
  options: PDFGenerationOptions
): Promise<{ buffer: Buffer; filePath: string }> {
  // Validate inputs
  if (!proposal || !proposal.id) {
    throw new Error('Invalid proposal: missing proposal or proposal ID');
  }

  if (!proposal.generatedContent) {
    console.warn(`[PDF] Proposal ${proposal.id} has no generated content`);
  }

  console.log(`[PDF] Generating PDF for proposal ${proposal.id}...`);

  // Fetch template to get branding information
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, proposal.templateId!));

  if (!template) {
    throw new Error('Template not found');
  }

  const templateSchema = template.schema as any;

  // Merge branding: proposal overrides template
  const proposalBranding = proposal.branding || {};
  const templateBranding = templateSchema.branding || {};
  const branding = {
    ...templateBranding,
    ...proposalBranding, // Proposal overrides template
  };

  // Attach merged branding to proposal for use in template
  proposal.branding = branding;

  const cluster = await getCluster();

  // Generate HTML from proposal data
  const html = await generateHTML(proposal, options);

  // Puppeteer handles CSS perfectly - no need to inline
  // juice() is designed for email HTML and destroys page-break CSS needed for pagination
  const processedHTML = html;

  // PDF options
  const pdfOptions: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
      top: `${options.margins?.top || 20}mm`,
      right: `${options.margins?.right || 25}mm`,
      bottom: `${options.margins?.bottom || 20}mm`,
      left: `${options.margins?.left || 25}mm`,
    },
    displayHeaderFooter: options.headerFooter ?? true,
    headerTemplate: generateHeader(proposal, options),
    footerTemplate: generateFooter(proposal, options),
    preferCSSPageSize: false,
    landscape: options.landscape ?? false,
  };

  // Generate PDF
  const buffer = await cluster.execute(async ({ page }) => {
    await page.setContent(processedHTML, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for charts to render
    await page.waitForTimeout(1000);

    // Generate PDF
    const pdfData = await page.pdf(pdfOptions);

    // Correctly convert Uint8Array to Buffer (page.pdf returns Uint8Array)
    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);

    // Validate PDF header to ensure it's valid
    const header = pdfBuffer.slice(0, 4).toString('ascii');
    if (!header.startsWith('%PDF')) {
      throw new Error(`Invalid PDF buffer (header: ${header})`);
    }

    console.log(`[PDF] Generated: ${pdfBuffer.length} bytes`);

    return pdfBuffer;
  });

  // Save to file
  const outputDir = path.join(process.cwd(), 'temp', 'pdfs');
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);

  await fs.writeFile(filePath, buffer);

  console.log(`[PDF] Saved: ${filePath} (${buffer.length} bytes)`);

  return { buffer, filePath };
}

/**
 * Generate HTML from proposal data using EJS template
 */
async function generateHTML(
  proposal: any,
  options: PDFGenerationOptions
): Promise<string> {
  const templatePath = path.join(__dirname, '../../templates/proposal.ejs');

  // Prepare template data
  const data = {
    proposal,
    options,
    generatedDate: new Date().toLocaleDateString(),
    sections: await formatSections(proposal.generatedContent || {}, proposal.branding),
    branding: proposal.branding || {},
    designMetadata: proposal.designMetadata || {},
  };

  // Render template
  const html = await ejs.renderFile(templatePath, data);

  return html;
}

/**
 * Generate header HTML for PDF
 */
function generateHeader(proposal: any, options: PDFGenerationOptions): string {
  if (!options.headerFooter) return '';

  const branding = proposal.branding || {};
  const headerConfig = branding.header || {};

  return `
    <div style="
      width: 100%;
      padding: 10px 25px;
      font-size: 10px;
      color: ${branding?.secondaryColor || 'gray'};
      border-bottom: 1px solid ${branding?.borderColor || 'lightgray'};
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="flex: 1;">
        ${headerConfig.showLogo && headerConfig.logoUrl ? `<img src="${headerConfig.logoUrl}" style="height: 30px;" />` : ''}
      </div>
      <div style="flex: 1; text-align: right;">
        ${proposal.projectTitle || 'Proposal'}
      </div>
    </div>
  `;
}

/**
 * Generate footer HTML for PDF
 */
function generateFooter(proposal: any, options: PDFGenerationOptions): string {
  if (!options.headerFooter) return '';

  const branding = proposal.branding || {};
  const footerConfig = branding.footer || {};

  return `
    <div style="
      width: 100%;
      padding: 10px 25px;
      font-size: 10px;
      color: ${branding?.secondaryColor || 'gray'};
      border-top: 1px solid ${branding?.borderColor || 'lightgray'};
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="flex: 1;">
        ${footerConfig.leftText || `${proposal.clientCompany || ''}`}
      </div>
      <div style="flex: 1; text-align: center;">
        ${options.includePageNumbers ? '<span class="pageNumber"></span> / <span class="totalPages"></span>' : ''}
      </div>
      <div style="flex: 1; text-align: right;">
        ${footerConfig.rightText || new Date().toLocaleDateString()}
      </div>
    </div>
  `;
}

/**
 * Parse content and extract embedded JSON visualizations
 */
function parseContentWithVisualizations(content: any): { textContent: string; visualizations: any[] } {
  let textContent = '';
  const visualizations: any[] = [];

  // Convert to string if needed
  if (typeof content === 'string') {
    textContent = content;
  } else if (content && typeof content === 'object') {
    textContent = content.text || content.content || JSON.stringify(content);
  } else {
    textContent = String(content || '');
  }

  // Extract JSON code blocks: ```json ... ```
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
      console.log(`[PDF] Extracted embedded visualization: ${vizData.type}`);
      visualizations.push(vizData);
    } catch (error) {
      console.error('[PDF] Failed to parse embedded JSON visualization:', error);
      // If parsing fails, keep the code block as text
      cleanText += match[0];
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  cleanText += textContent.substring(lastIndex);

  return {
    textContent: cleanText.trim(),
    visualizations
  };
}

/**
 * Pre-render visualizations to base64 images for PDF embedding
 */
async function preprocessVisualizations(
  visualizations: any[],
  branding?: any
): Promise<any[]> {
  const processed: any[] = [];

  for (const viz of visualizations) {
    try {
      if (viz.type === 'chart') {
        // Generate chart PNG
        console.log(`[PDF] Generating chart: ${viz.chartType}`);
        const imageBuffer = await chartImageService.generateFromChartData(
          viz.chartType,
          viz.chartData,
          viz.caption,
          {
            width: 800,
            height: 450,
            backgroundColor: branding?.backgroundColor,
            scale: 2,
          },
          branding
        );

        // Convert to base64 data URL
        const base64 = imageBuffer.toString('base64');
        processed.push({
          ...viz,
          imageData: `data:image/png;base64,${base64}`,
        });

        console.log(`[PDF] Pre-rendered chart: ${imageBuffer.length} bytes`);

      } else if (viz.type === 'mermaid') {
        // Generate diagram PNG
        console.log(`[PDF] Generating mermaid diagram`);
        const imageBuffer = await diagramImageService.generateDiagramImage(
          viz.code,
          {
            width: 1200,
            height: 800,
            backgroundColor: branding?.backgroundColor,
            scale: 2,
          },
          branding
        );

        // Convert to base64 data URL
        const base64 = imageBuffer.toString('base64');
        processed.push({
          ...viz,
          imageData: `data:image/png;base64,${base64}`,
        });

        console.log(`[PDF] Pre-rendered diagram: ${imageBuffer.length} bytes`);

      } else {
        // Tables, callouts, etc. - pass through
        processed.push(viz);
      }
    } catch (error) {
      console.error(`[PDF] Failed to pre-render ${viz.type}:`, error);
      // Add fallback
      processed.push({
        type: 'error',
        message: `Failed to render ${viz.type}: ${viz.caption || ''}`,
      });
    }
  }

  return processed;
}

/**
 * Format sections for template
 */
async function formatSections(content: any, branding?: any): Promise<any[]> {
  const sections: any[] = [];

  // Standard section order
  const sectionOrder = [
    'executiveSummary',
    'projectOverview',
    'objectives',
    'scope',
    'methodology',
    'timeline',
    'budget',
    'team',
    'caseStudies',
    'termsAndConditions',
  ];

  for (const key of sectionOrder) {
    if (content[key]) {
      // Parse content and extract visualizations
      const { textContent, visualizations } = parseContentWithVisualizations(content[key]);

      // PRE-RENDER VISUALIZATIONS
      const processedViz = await preprocessVisualizations(visualizations, branding);

      sections.push({
        id: key,
        title: formatSectionTitle(key),
        content: markdownToHtml(textContent),
        visualizations: processedViz,
      });
    }
  }

  // Add any custom sections
  for (const [key, value] of Object.entries(content)) {
    if (!sectionOrder.includes(key)) {
      const { textContent, visualizations } = parseContentWithVisualizations(value);

      // PRE-RENDER VISUALIZATIONS
      const processedViz = await preprocessVisualizations(visualizations, branding);

      sections.push({
        id: key,
        title: formatSectionTitle(key),
        content: markdownToHtml(textContent),
        visualizations: processedViz,
      });
    }
  }

  return sections;
}

/**
 * Format section key to title
 */
function formatSectionTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Convert Markdown to HTML for PDF rendering
 */
function markdownToHtml(text: string): string {
  if (!text) return '';

  let html = text;

  // Convert markdown tables: | header | header |
  html = convertMarkdownTables(html);

  // Convert headers: # Header, ## Header, ### Header
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Convert bullet points: - item or * item
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive list items in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Convert bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic: *text* or _text_ (but not ** or __)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Convert line breaks
  const lines = html.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      processedLines.push('<br>');
      continue;
    }

    // Skip horizontal rules
    if (line === '---' || line === '***' || line === '___') {
      processedLines.push('<div style="margin: 20px 0;"></div>');
      continue;
    }

    // If line doesn't start with HTML tag, wrap in paragraph
    if (!line.startsWith('<')) {
      processedLines.push('<p>' + line + '</p>');
    } else {
      processedLines.push(line);
    }
  }

  html = processedLines.join('\n');

  return html;
}

/**
 * Convert markdown tables to HTML tables
 */
function convertMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check if this is a table header row
    if (line.startsWith('|') && line.endsWith('|')) {
      // Parse header
      const headerCells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

      // Check for separator row
      if (i + 1 < lines.length) {
        const separatorLine = lines[i + 1].trim();
        if (separatorLine.match(/^\|[\s\-:]+\|/)) {
          // This is a table! Start building it
          let tableHtml = '<table>\n<thead>\n<tr>\n';
          headerCells.forEach(cell => {
            tableHtml += `<th>${cell}</th>\n`;
          });
          tableHtml += '</tr>\n</thead>\n<tbody>\n';

          // Skip header and separator
          i += 2;

          // Parse data rows
          while (i < lines.length) {
            const rowLine = lines[i].trim();
            if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
              break;
            }

            const rowCells = rowLine
              .split('|')
              .map(cell => cell.trim())
              .filter(cell => cell.length > 0);

            tableHtml += '<tr>\n';
            rowCells.forEach(cell => {
              tableHtml += `<td>${cell}</td>\n`;
            });
            tableHtml += '</tr>\n';

            i++;
          }

          tableHtml += '</tbody>\n</table>\n';
          result.push(tableHtml);
          continue;
        }
      }
    }

    result.push(lines[i]);
    i++;
  }

  return result.join('\n');
}

/**
 * Cleanup cluster on shutdown
 */
export async function cleanup(): Promise<void> {
  if (cluster) {
    await cluster.close();
    cluster = null;
  }
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
