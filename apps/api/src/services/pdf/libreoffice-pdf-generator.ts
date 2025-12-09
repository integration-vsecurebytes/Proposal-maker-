/**
 * LibreOffice PDF Generator
 * Generates PDFs using DOCX → PDF conversion via LibreOffice CLI
 * Fastest method for text-heavy proposals, limited chart/diagram support
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs/promises';
import { docxGenerator } from '../documents/docx-generator';
import type { PDFGenerationOptions } from './pdf-orchestrator';

const execAsync = promisify(exec);

/**
 * Generate PDF using LibreOffice
 */
export async function generateLibreOfficePDF(
  proposal: any,
  options: PDFGenerationOptions
): Promise<{ buffer: Buffer; filePath: string }> {
  let tempDir: string | null = null;
  let docxPath: string | null = null;
  let pdfPath: string | null = null;

  try {
    // 1. Generate DOCX using existing generator
    console.log(`[LibreOffice] Generating DOCX for proposal ${proposal.id}...`);
    const docxBuffer = await docxGenerator.generateDocx(proposal.id);

    // 2. Create temp directory for conversion
    tempDir = await mkdtemp(path.join(tmpdir(), 'proposal-libreoffice-'));
    docxPath = path.join(tempDir, 'proposal.docx');
    pdfPath = path.join(tempDir, 'proposal.pdf');

    // 3. Write DOCX to temp file
    await writeFile(docxPath, docxBuffer);

    // 4. Convert DOCX to PDF using LibreOffice CLI
    console.log(`[LibreOffice] Converting DOCX to PDF...`);
    const command = `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}"`;

    await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // 5. Read generated PDF
    const pdfBuffer = await readFile(pdfPath);

    // 6. Save to permanent location
    const outputDir = path.join(process.cwd(), 'temp', 'pdfs');
    await fs.mkdir(outputDir, { recursive: true });

    const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await writeFile(filePath, pdfBuffer);

    // 7. Clean up temp files
    await cleanup(docxPath, pdfPath);

    console.log(`[LibreOffice] PDF generated successfully: ${filePath}`);

    return { buffer: pdfBuffer, filePath };
  } catch (error) {
    // Clean up on error
    if (docxPath) await unlink(docxPath).catch(() => {});
    if (pdfPath) await unlink(pdfPath).catch(() => {});

    if (error instanceof Error) {
      // Check if LibreOffice is not installed
      if (error.message.includes('libreoffice') || error.message.includes('not found')) {
        throw new Error(
          'LibreOffice is not installed or not accessible. Please install LibreOffice or use the Puppeteer PDF generation method.'
        );
      }

      // Check if timeout
      if (error.message.includes('timeout')) {
        throw new Error(
          'LibreOffice PDF conversion timed out. The proposal may be too large. Try using the Puppeteer method instead.'
        );
      }
    }

    console.error('[LibreOffice] PDF generation failed:', error);
    throw error;
  }
}

/**
 * Check if LibreOffice is available
 */
export async function isLibreOfficeAvailable(): Promise<boolean> {
  try {
    await execAsync('libreoffice --version', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get LibreOffice version info
 */
export async function getLibreOfficeVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('libreoffice --version', { timeout: 5000 });
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Clean up temporary files
 */
async function cleanup(...files: (string | null)[]): Promise<void> {
  for (const file of files) {
    if (file) {
      try {
        await unlink(file);
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`[LibreOffice] Failed to clean up file: ${file}`);
      }
    }
  }
}

/**
 * Estimate LibreOffice PDF generation time (in milliseconds)
 */
export function estimateLibreOfficeTime(proposal: any): number {
  const content = proposal.generatedContent || {};
  const sections = Object.keys(content).length;

  // Base time for DOCX generation + conversion
  let baseTime = 2000; // 2 seconds

  // Section multiplier (300ms per section)
  const sectionTime = sections * 300;

  // Text length estimation (longer proposals take more time)
  const totalText = Object.values(content).reduce((acc: number, section: any) => {
    const text = section?.content || '';
    return acc + text.length;
  }, 0);
  const textTime = Math.min(totalText / 1000, 3000); // Max 3s for text

  return Math.round(baseTime + sectionTime + textTime);
}

/**
 * Get method capabilities for LibreOffice
 */
export function getLibreOfficeCapabilities() {
  return {
    name: 'LibreOffice (Compatible)',
    description:
      'DOCX to PDF conversion. Maximum compatibility and fastest for text-heavy proposals.',
    pros: [
      'Fast generation (2-5 seconds)',
      'Low memory usage',
      'Maximum compatibility',
      'Excellent for text',
      'Industry standard DOCX format',
    ],
    cons: [
      'Limited chart support',
      'Basic layout only',
      'Fewer design features',
      'No custom CSS',
      'Requires LibreOffice installation',
    ],
    estimatedTime: '2-5 seconds',
    quality: 'Good',
    support: {
      charts: false, // Limited - converted to images
      diagrams: false, // Limited - converted to images
      customFonts: false,
      complexLayouts: false,
      tableOfContents: true,
      bookmarks: false,
      headerFooter: true,
      pageNumbers: true,
    },
  };
}

/**
 * Validate proposal for LibreOffice generation
 * Returns warnings if proposal has features that won't work well
 */
export function validateForLibreOffice(proposal: any): {
  compatible: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const content = proposal.generatedContent || {};

  // Check for charts
  const hasCharts = Object.values(content).some((section: any) =>
    section?.visualizations?.some((viz: any) => viz.type === 'chart')
  );
  if (hasCharts) {
    warnings.push('Proposal contains charts which will be converted to images');
    recommendations.push('Consider using Puppeteer for better chart rendering');
  }

  // Check for diagrams
  const hasDiagrams = Object.values(content).some((section: any) =>
    section?.visualizations?.some((viz: any) => viz.type === 'mermaid')
  );
  if (hasDiagrams) {
    warnings.push('Proposal contains diagrams which will be converted to images');
    recommendations.push('Consider using Puppeteer for better diagram rendering');
  }

  // Check for complex layouts
  const sections = Object.keys(content).length;
  if (sections > 10) {
    warnings.push('Large proposal with many sections may take longer to generate');
  }

  // Check for custom branding
  const branding = proposal.branding || {};
  if (branding.customFonts || branding.complexLayout) {
    warnings.push('Custom fonts and complex layouts have limited support');
    recommendations.push('Use Puppeteer for full design control');
  }

  // Overall compatibility
  const compatible = warnings.length === 0 || warnings.length <= 2;

  return {
    compatible,
    warnings,
    recommendations,
  };
}
