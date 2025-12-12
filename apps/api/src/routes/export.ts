import { Router } from 'express';
import { docxGenerator } from '../services/documents/docx-generator';
import { htmlGenerator } from '../services/documents/html-generator';
import { db } from '../db';
import { proposals } from '../db/schema';
import { eq } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { generatePDF, generatePDFSync, getJobStatus, clearProposalCache, getMethodCapabilities } from '../services/pdf/pdf-orchestrator';
import type { PDFMethod, PDFGenerationOptions } from '../services/pdf/pdf-orchestrator';

const execAsync = promisify(exec);
const router = Router();

/**
 * GET /api/export/:proposalId/docx
 * Export proposal as DOCX file
 */
router.get('/:proposalId/docx', async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Generate DOCX
    const buffer = await docxGenerator.generateDocx(proposalId);

    // Create filename
    const filename = `${proposal.projectTitle || 'Proposal'}_${proposal.clientCompany || 'Client'}.docx`
      .replace(/[^a-z0-9_\-\.]/gi, '_');

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file (use .end() for binary data to avoid encoding issues)
    res.end(buffer, 'binary');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/:proposalId/html
 * Export proposal as HTML file
 */
router.get('/:proposalId/html', async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Generate HTML
    const htmlContent = await htmlGenerator.generateHtml(proposalId);

    // Create filename
    const filename = `${proposal.projectTitle || 'Proposal'}_${proposal.clientCompany || 'Client'}.html`
      .replace(/[^a-z0-9_\-\.]/gi, '_');

    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(htmlContent, 'utf8'));

    // Send file
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/:proposalId/pdf
 * Export proposal as PDF file
 * Uses LibreOffice if available, otherwise returns DOCX with instructions
 */
router.get('/:proposalId/pdf', async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Generate DOCX first
    const docxBuffer = await docxGenerator.generateDocx(proposalId);

    try {
      // Try to convert to PDF using LibreOffice
      const tempDir = await mkdtemp(path.join(tmpdir(), 'proposal-'));
      const docxPath = path.join(tempDir, 'proposal.docx');
      const pdfPath = path.join(tempDir, 'proposal.pdf');

      // Write DOCX to temp file
      await writeFile(docxPath, docxBuffer);

      // Try to convert using LibreOffice
      try {
        await execAsync(
          `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}"`,
          { timeout: 30000 }
        );

        // Read the generated PDF
        const { readFile } = await import('fs/promises');
        const pdfBuffer = await readFile(pdfPath);

        // Create filename
        const filename = `${proposal.projectTitle || 'Proposal'}_${proposal.clientCompany || 'Client'}.pdf`
          .replace(/[^a-z0-9_\-\.]/gi, '_');

        // Clean up temp files
        await unlink(docxPath).catch(() => {});
        await unlink(pdfPath).catch(() => {});

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF (use .end() for binary data to avoid encoding issues)
        res.end(pdfBuffer, 'binary');
      } catch (conversionError) {
        // LibreOffice not available or conversion failed
        console.log('PDF conversion failed, falling back to DOCX:', conversionError);

        // Clean up
        await unlink(docxPath).catch(() => {});

        // Return DOCX with a message
        return res.status(501).json({
          error: 'PDF conversion not available',
          message: 'LibreOffice is not installed on this server. Please download the DOCX version and convert it manually, or install LibreOffice for automatic PDF conversion.',
          docxUrl: `/api/export/${proposalId}/docx`,
        });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/export/docx
 * Export proposal as DOCX from request body (for frontend generated proposals)
 */
router.post('/docx', async (req, res, next) => {
  try {
    const { proposalId } = req.body;

    if (!proposalId) {
      return res.status(400).json({ error: 'proposalId is required' });
    }

    // Generate DOCX
    const buffer = await docxGenerator.generateDocx(proposalId);

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    const filename = `${proposal?.projectTitle || 'Proposal'}_${proposal?.clientCompany || 'Client'}.docx`
      .replace(/[^a-z0-9_\-\.]/gi, '_');

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file (use .end() for binary data to avoid encoding issues)
    res.end(buffer, 'binary');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/export/pdf
 * Export proposal as PDF from request body
 */
router.post('/pdf', async (req, res, next) => {
  try {
    const { proposalId } = req.body;

    if (!proposalId) {
      return res.status(400).json({ error: 'proposalId is required' });
    }

    // Generate DOCX first
    const docxBuffer = await docxGenerator.generateDocx(proposalId);

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    try {
      const tempDir = await mkdtemp(path.join(tmpdir(), 'proposal-'));
      const docxPath = path.join(tempDir, 'proposal.docx');
      const pdfPath = path.join(tempDir, 'proposal.pdf');

      await writeFile(docxPath, docxBuffer);

      try {
        await execAsync(
          `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}"`,
          { timeout: 30000 }
        );

        const { readFile } = await import('fs/promises');
        const pdfBuffer = await readFile(pdfPath);

        const filename = `${proposal?.projectTitle || 'Proposal'}_${proposal?.clientCompany || 'Client'}.pdf`
          .replace(/[^a-z0-9_\-\.]/gi, '_');

        await unlink(docxPath).catch(() => {});
        await unlink(pdfPath).catch(() => {});

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.end(pdfBuffer, 'binary');
      } catch (conversionError) {
        await unlink(docxPath).catch(() => {});

        return res.status(501).json({
          error: 'PDF conversion not available',
          message: 'LibreOffice is not installed. Please use DOCX export instead.',
          docxUrl: `/api/export/${proposalId}/docx`,
        });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/export/:proposalId/pdf-advanced
 * Generate PDF using new dual-method system (Puppeteer/LibreOffice)
 */
router.post('/:proposalId/pdf-advanced', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const options: PDFGenerationOptions = req.body;

    // Generate PDF (async with queue)
    const result = await generatePDF(proposalId, options);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/:proposalId/pdf-status
 * Check PDF generation job status
 */
router.get('/:proposalId/pdf-status', async (req, res, next) => {
  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const result = await getJobStatus(jobId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/:proposalId/pdf-download
 * Download generated PDF
 */
router.get('/:proposalId/pdf-download', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Get job status to find file path
    const result = await getJobStatus(jobId);

    if (!result.success || result.status !== 'completed' || !result.filePath) {
      return res.status(404).json({ error: 'PDF not ready or not found' });
    }

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    const filename = `${proposal?.projectTitle || 'Proposal'}_${proposal?.clientCompany || 'Client'}.pdf`
      .replace(/[^a-z0-9_\-\.]/gi, '_');

    // Read file
    const pdfBuffer = await readFile(result.filePath);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send file (use .end() for binary data to avoid encoding issues)
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/export/:proposalId/pdf-sync
 * Generate PDF synchronously (for small proposals or testing)
 */
router.post('/:proposalId/pdf-sync', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const options: PDFGenerationOptions = req.body;

    // Generate PDF synchronously
    const result = await generatePDFSync(proposalId, options);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Get proposal for filename
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    const filename = `${proposal?.projectTitle || 'Proposal'}_${proposal?.clientCompany || 'Client'}.pdf`
      .replace(/[^a-z0-9_\-\.]/gi, '_');

    // Read file
    const pdfBuffer = await readFile(result.filePath!);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send file (use .end() for binary data to avoid encoding issues)
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/export/:proposalId/pdf-cache
 * Clear PDF cache for proposal
 */
router.delete('/:proposalId/pdf-cache', async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    await clearProposalCache(proposalId);

    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/pdf-methods
 * Get PDF generation method capabilities
 */
router.get('/pdf-methods', async (req, res, next) => {
  try {
    const capabilities = getMethodCapabilities();
    res.json(capabilities);
  } catch (error) {
    next(error);
  }
});

export default router;
