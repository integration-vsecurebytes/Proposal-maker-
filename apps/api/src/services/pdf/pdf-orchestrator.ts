/**
 * PDF Orchestrator Service
 * Coordinates PDF generation between Puppeteer (primary) and LibreOffice (fallback)
 * Handles method selection, caching, and job queuing
 */

import { db } from '../../db';
import { proposals } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generatePuppeteerPDF } from './puppeteer-pdf-generator';
import { generateLibreOfficePDF } from './libreoffice-pdf-generator';
import { checkCache, saveToCache, clearCache } from './pdf-cache';
import { pdfQueue, PDFJobData } from './pdf-queue';
import crypto from 'crypto';

export type PDFMethod = 'puppeteer' | 'libreoffice' | 'auto';

export interface PDFGenerationOptions {
  method?: PDFMethod;
  includeTOC?: boolean;
  includePageNumbers?: boolean;
  quality?: 'draft' | 'standard' | 'high';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerFooter?: boolean;
  landscape?: boolean;
}

export interface PDFResult {
  success: boolean;
  jobId?: string;
  filePath?: string;
  fileSize?: number;
  method?: PDFMethod;
  cached?: boolean;
  estimatedTime?: number;
  error?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
}

/**
 * Generate PDF with automatic method selection and caching
 */
export async function generatePDF(
  proposalId: string,
  options: PDFGenerationOptions = {}
): Promise<PDFResult> {
  try {
    // Default options
    const opts: Required<PDFGenerationOptions> = {
      method: options.method || 'auto',
      includeTOC: options.includeTOC ?? true,
      includePageNumbers: options.includePageNumbers ?? true,
      quality: options.quality || 'standard',
      margins: options.margins || {
        top: 20,
        right: 25,
        bottom: 20,
        left: 25,
      },
      headerFooter: options.headerFooter ?? true,
      landscape: options.landscape ?? false,
    };

    // Fetch proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return {
        success: false,
        error: 'Proposal not found',
      };
    }

    // Generate cache key
    const cacheKey = generateCacheKey(proposalId, opts);

    // Check cache first
    const cachedPDF = await checkCache(cacheKey);
    if (cachedPDF) {
      return {
        success: true,
        filePath: cachedPDF.filePath,
        fileSize: cachedPDF.fileSize,
        method: cachedPDF.method as PDFMethod,
        cached: true,
      };
    }

    // Determine method
    const selectedMethod = opts.method === 'auto' ? selectBestMethod(proposal) : opts.method;

    // Queue job for async processing
    const job = await pdfQueue.add('generate-pdf', {
      proposalId,
      method: selectedMethod,
      options: opts,
      cacheKey,
    } as PDFJobData);

    return {
      success: true,
      jobId: job.id as string,
      status: 'queued',
      method: selectedMethod,
      estimatedTime: estimateGenerationTime(proposal, selectedMethod),
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate PDF synchronously (for small proposals or testing)
 */
export async function generatePDFSync(
  proposalId: string,
  options: PDFGenerationOptions = {}
): Promise<PDFResult> {
  try {
    const opts: Required<PDFGenerationOptions> = {
      method: options.method || 'auto',
      includeTOC: options.includeTOC ?? true,
      includePageNumbers: options.includePageNumbers ?? true,
      quality: options.quality || 'standard',
      margins: options.margins || {
        top: 20,
        right: 25,
        bottom: 20,
        left: 25,
      },
      headerFooter: options.headerFooter ?? true,
      landscape: options.landscape ?? false,
    };

    // Fetch proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return {
        success: false,
        error: 'Proposal not found',
      };
    }

    // Generate cache key
    const cacheKey = generateCacheKey(proposalId, opts);

    // Check cache
    const cachedPDF = await checkCache(cacheKey);
    if (cachedPDF) {
      return {
        success: true,
        filePath: cachedPDF.filePath,
        fileSize: cachedPDF.fileSize,
        method: cachedPDF.method as PDFMethod,
        cached: true,
      };
    }

    // Determine method
    const selectedMethod = opts.method === 'auto' ? selectBestMethod(proposal) : opts.method;

    // Generate PDF
    let pdfBuffer: Buffer;
    let filePath: string;

    if (selectedMethod === 'puppeteer') {
      const result = await generatePuppeteerPDF(proposal, opts);
      pdfBuffer = result.buffer;
      filePath = result.filePath;
    } else {
      const result = await generateLibreOfficePDF(proposal, opts);
      pdfBuffer = result.buffer;
      filePath = result.filePath;
    }

    // Save to cache
    await saveToCache({
      proposalId,
      cacheKey,
      method: selectedMethod,
      filePath,
      fileSize: pdfBuffer.length,
    });

    return {
      success: true,
      filePath,
      fileSize: pdfBuffer.length,
      method: selectedMethod,
      cached: false,
      status: 'completed',
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed',
    };
  }
}

/**
 * Get PDF generation job status
 */
export async function getJobStatus(jobId: string): Promise<PDFResult> {
  try {
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === 'completed') {
      const result = job.returnvalue as PDFResult;
      return {
        success: true,
        status: 'completed',
        ...result,
      };
    }

    if (state === 'failed') {
      return {
        success: false,
        status: 'failed',
        error: job.failedReason || 'Unknown error',
      };
    }

    return {
      success: true,
      jobId,
      status: state === 'active' ? 'processing' : 'queued',
      method: (job.data as PDFJobData).method,
    };
  } catch (error) {
    console.error('Job status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear PDF cache for proposal
 */
export async function clearProposalCache(proposalId: string): Promise<void> {
  await clearCache(proposalId);
}

/**
 * Select best PDF generation method based on proposal characteristics
 */
function selectBestMethod(proposal: any): PDFMethod {
  const content = proposal.generatedContent || {};
  const sections = Object.keys(content).length;
  const hasCharts = Object.values(content).some((section: any) =>
    section?.visualizations?.length > 0
  );
  const hasDiagrams = Object.values(content).some((section: any) =>
    section?.diagrams?.length > 0
  );

  // Use Puppeteer for:
  // - Complex layouts (many sections)
  // - Charts and visualizations
  // - Modern CSS features
  if (sections > 5 || hasCharts || hasDiagrams) {
    return 'puppeteer';
  }

  // Use LibreOffice for:
  // - Simple text-heavy proposals
  // - Maximum compatibility
  return 'libreoffice';
}

/**
 * Generate cache key from proposal ID and options
 */
function generateCacheKey(proposalId: string, options: PDFGenerationOptions): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ proposalId, options }))
    .digest('hex');

  return `pdf-${proposalId}-${hash.substring(0, 16)}`;
}

/**
 * Estimate PDF generation time (in milliseconds)
 */
function estimateGenerationTime(proposal: any, method: PDFMethod): number {
  const content = proposal.generatedContent || {};
  const sections = Object.keys(content).length;

  // Base time
  let baseTime = 3000; // 3 seconds

  // Method multiplier
  const methodMultiplier = method === 'puppeteer' ? 1.5 : 1.0;

  // Section multiplier (500ms per section)
  const sectionTime = sections * 500;

  // Visualization time (1s per chart/diagram)
  const visualizations = Object.values(content).reduce((acc: number, section: any) => {
    const charts = section?.visualizations?.length || 0;
    const diagrams = section?.diagrams?.length || 0;
    return acc + charts + diagrams;
  }, 0);
  const visualizationTime = visualizations * 1000;

  return Math.round((baseTime + sectionTime + visualizationTime) * methodMultiplier);
}

/**
 * Get method capabilities
 */
export function getMethodCapabilities(): Record<
  PDFMethod,
  {
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedTime: string;
    quality: string;
    support: {
      charts: boolean;
      diagrams: boolean;
      customFonts: boolean;
      complexLayouts: boolean;
      tableOfContents: boolean;
      bookmarks: boolean;
    };
  }
> {
  return {
    puppeteer: {
      name: 'Puppeteer (Modern)',
      description:
        'HTML to PDF using headless Chrome. Best for complex layouts, charts, and modern designs.',
      pros: [
        'Perfect CSS rendering',
        'Full chart/diagram support',
        'Custom fonts and modern layouts',
        'Print-optimized styling',
        'Automatic page breaks',
      ],
      cons: ['Slightly slower', 'Higher memory usage', 'Requires Chrome'],
      estimatedTime: '5-10 seconds',
      quality: 'Excellent',
      support: {
        charts: true,
        diagrams: true,
        customFonts: true,
        complexLayouts: true,
        tableOfContents: true,
        bookmarks: true,
      },
    },
    libreoffice: {
      name: 'LibreOffice (Compatible)',
      description:
        'DOCX to PDF conversion. Maximum compatibility and fastest for text-heavy proposals.',
      pros: [
        'Fast generation',
        'Low memory usage',
        'Maximum compatibility',
        'Excellent for text',
        'Industry standard',
      ],
      cons: [
        'Limited chart support',
        'Basic layout only',
        'Fewer design features',
        'No custom CSS',
      ],
      estimatedTime: '2-5 seconds',
      quality: 'Good',
      support: {
        charts: false,
        diagrams: false,
        customFonts: false,
        complexLayouts: false,
        tableOfContents: true,
        bookmarks: false,
      },
    },
    auto: {
      name: 'Auto (Recommended)',
      description:
        'Automatically selects the best method based on proposal content and complexity.',
      pros: [
        'Optimal performance',
        'Best quality for content',
        'No manual selection needed',
        'Smart fallback',
      ],
      cons: ['Less predictable timing'],
      estimatedTime: '2-10 seconds',
      quality: 'Optimal',
      support: {
        charts: true,
        diagrams: true,
        customFonts: true,
        complexLayouts: true,
        tableOfContents: true,
        bookmarks: true,
      },
    },
  };
}
