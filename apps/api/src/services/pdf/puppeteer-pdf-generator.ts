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
  const cluster = await getCluster();

  // Generate HTML from proposal data
  const html = await generateHTML(proposal, options);

  // Inline CSS for better rendering
  const inlinedHTML = juice(html);

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
    await page.setContent(inlinedHTML, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for charts to render
    await page.waitForTimeout(1000);

    // Generate PDF
    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);
  });

  // Save to file
  const outputDir = path.join(process.cwd(), 'temp', 'pdfs');
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);

  await fs.writeFile(filePath, buffer);

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
    sections: formatSections(proposal.generatedContent || {}),
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
      color: #666;
      border-bottom: 1px solid #e5e7eb;
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
      color: #666;
      border-top: 1px solid #e5e7eb;
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
 * Format sections for template
 */
function formatSections(content: any): any[] {
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
      sections.push({
        id: key,
        title: formatSectionTitle(key),
        content: content[key],
      });
    }
  }

  // Add any custom sections
  for (const [key, value] of Object.entries(content)) {
    if (!sectionOrder.includes(key)) {
      sections.push({
        id: key,
        title: formatSectionTitle(key),
        content: value,
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
