/**
 * PDF Generation Job Queue
 * BullMQ-based async job processing for PDF generation
 * Handles queuing, progress tracking, retries, and error handling
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { db } from '../../db';
import { proposals } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generatePuppeteerPDF } from './puppeteer-pdf-generator';
import { generateLibreOfficePDF } from './libreoffice-pdf-generator';
import { saveToCache } from './pdf-cache';
import type { PDFMethod, PDFGenerationOptions, PDFResult } from './pdf-orchestrator';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export interface PDFJobData {
  proposalId: string;
  method: PDFMethod;
  options: PDFGenerationOptions;
  cacheKey: string;
}

export interface PDFJobResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  method?: PDFMethod;
  error?: string;
}

/**
 * PDF Generation Queue
 */
export const pdfQueue = new Queue<PDFJobData, PDFJobResult>('pdf-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, doubles each retry
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Queue Events (for monitoring)
 */
export const pdfQueueEvents = new QueueEvents('pdf-generation', {
  connection: redisConnection,
});

/**
 * PDF Generation Worker
 */
export const pdfWorker = new Worker<PDFJobData, PDFJobResult>(
  'pdf-generation',
  async (job: Job<PDFJobData, PDFJobResult>) => {
    const { proposalId, method, options, cacheKey } = job.data;

    console.log(
      `[PDF Worker] Starting job ${job.id} for proposal ${proposalId} using ${method} method`
    );

    try {
      // Update progress
      await job.updateProgress(10);

      // Fetch proposal
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      await job.updateProgress(20);

      // Generate PDF based on method
      let pdfBuffer: Buffer;
      let filePath: string;

      if (method === 'puppeteer') {
        console.log(`[PDF Worker] Generating PDF with Puppeteer...`);
        await job.updateProgress(30);

        const result = await generatePuppeteerPDF(proposal, options);
        pdfBuffer = result.buffer;
        filePath = result.filePath;

        await job.updateProgress(80);
      } else if (method === 'libreoffice') {
        console.log(`[PDF Worker] Generating PDF with LibreOffice...`);
        await job.updateProgress(30);

        const result = await generateLibreOfficePDF(proposal, options);
        pdfBuffer = result.buffer;
        filePath = result.filePath;

        await job.updateProgress(80);
      } else {
        throw new Error(`Unknown PDF generation method: ${method}`);
      }

      // Save to cache
      console.log(`[PDF Worker] Saving to cache...`);
      await saveToCache({
        proposalId,
        cacheKey,
        method,
        filePath,
        fileSize: pdfBuffer.length,
      });

      await job.updateProgress(100);

      console.log(`[PDF Worker] Job ${job.id} completed successfully`);

      return {
        success: true,
        filePath,
        fileSize: pdfBuffer.length,
        method,
      };
    } catch (error) {
      console.error(`[PDF Worker] Job ${job.id} failed:`, error);

      // Check if we should retry
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      if (attemptsMade < maxAttempts) {
        console.log(
          `[PDF Worker] Will retry job ${job.id} (attempt ${attemptsMade + 1}/${maxAttempts})`
        );
        throw error; // Re-throw to trigger retry
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    connection: redisConnection,
    concurrency: 4, // Process up to 4 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per 60 seconds (rate limiting)
    },
  }
);

/**
 * Worker event handlers
 */
pdfWorker.on('completed', (job: Job<PDFJobData, PDFJobResult>) => {
  console.log(`[PDF Worker] Job ${job.id} completed for proposal ${job.data.proposalId}`);
});

pdfWorker.on('failed', (job: Job<PDFJobData, PDFJobResult> | undefined, error: Error) => {
  if (job) {
    console.error(
      `[PDF Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`,
      error.message
    );
  } else {
    console.error('[PDF Worker] Job failed:', error.message);
  }
});

pdfWorker.on('active', (job: Job<PDFJobData, PDFJobResult>) => {
  console.log(`[PDF Worker] Job ${job.id} is now active (proposal ${job.data.proposalId})`);
});

pdfWorker.on('progress', (job: Job<PDFJobData, PDFJobResult>, progress: number) => {
  console.log(`[PDF Worker] Job ${job.id} progress: ${progress}%`);
});

pdfWorker.on('stalled', (jobId: string) => {
  console.warn(`[PDF Worker] Job ${jobId} stalled (may be retrying)`);
});

/**
 * Queue event handlers
 */
pdfQueueEvents.on('waiting', ({ jobId }) => {
  console.log(`[PDF Queue] Job ${jobId} is waiting`);
});

pdfQueueEvents.on('active', ({ jobId }) => {
  console.log(`[PDF Queue] Job ${jobId} is active`);
});

pdfQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`[PDF Queue] Job ${jobId} completed with result:`, returnvalue);
});

pdfQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[PDF Queue] Job ${jobId} failed:`, failedReason);
});

/**
 * Add PDF generation job to queue
 */
export async function addPDFJob(data: PDFJobData): Promise<Job<PDFJobData, PDFJobResult>> {
  const job = await pdfQueue.add('generate-pdf', data, {
    jobId: `pdf-${data.proposalId}-${Date.now()}`, // Unique job ID
  });

  console.log(`[PDF Queue] Added job ${job.id} for proposal ${data.proposalId}`);

  return job;
}

/**
 * Get job by ID
 */
export async function getPDFJob(jobId: string): Promise<Job<PDFJobData, PDFJobResult> | undefined> {
  return pdfQueue.getJob(jobId);
}

/**
 * Get job state
 */
export async function getPDFJobState(jobId: string): Promise<string | null> {
  const job = await getPDFJob(jobId);
  if (!job) return null;

  return job.getState();
}

/**
 * Get job progress
 */
export async function getPDFJobProgress(jobId: string): Promise<number | object | null> {
  const job = await getPDFJob(jobId);
  if (!job) return null;

  return job.progress;
}

/**
 * Cancel job
 */
export async function cancelPDFJob(jobId: string): Promise<boolean> {
  const job = await getPDFJob(jobId);
  if (!job) return false;

  const state = await job.getState();

  // Can only cancel jobs that are waiting or delayed
  if (state === 'waiting' || state === 'delayed') {
    await job.remove();
    console.log(`[PDF Queue] Cancelled job ${jobId}`);
    return true;
  }

  console.log(`[PDF Queue] Cannot cancel job ${jobId} (state: ${state})`);
  return false;
}

/**
 * Get queue stats
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}> {
  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    pdfQueue.getWaitingCount(),
    pdfQueue.getActiveCount(),
    pdfQueue.getCompletedCount(),
    pdfQueue.getFailedCount(),
    pdfQueue.getDelayedCount(),
    pdfQueue.getPausedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
  };
}

/**
 * Get jobs by proposal ID
 */
export async function getJobsByProposalId(proposalId: string): Promise<Job<PDFJobData, PDFJobResult>[]> {
  const jobs = await pdfQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);

  return jobs.filter((job) => job.data.proposalId === proposalId);
}

/**
 * Clear completed jobs older than age (in seconds)
 */
export async function clearOldJobs(age: number = 24 * 3600): Promise<void> {
  await pdfQueue.clean(age * 1000, 1000, 'completed');
  console.log(`[PDF Queue] Cleared completed jobs older than ${age} seconds`);
}

/**
 * Pause queue
 */
export async function pauseQueue(): Promise<void> {
  await pdfQueue.pause();
  console.log('[PDF Queue] Queue paused');
}

/**
 * Resume queue
 */
export async function resumeQueue(): Promise<void> {
  await pdfQueue.resume();
  console.log('[PDF Queue] Queue resumed');
}

/**
 * Close queue and worker (for graceful shutdown)
 */
export async function closeQueue(): Promise<void> {
  console.log('[PDF Queue] Closing queue and worker...');

  await pdfWorker.close();
  await pdfQueue.close();
  await pdfQueueEvents.close();

  console.log('[PDF Queue] Closed successfully');
}

/**
 * Handle graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('[PDF Queue] SIGTERM received, closing gracefully...');
  await closeQueue();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[PDF Queue] SIGINT received, closing gracefully...');
  await closeQueue();
  process.exit(0);
});

// Export queue for use in orchestrator
export default pdfQueue;
