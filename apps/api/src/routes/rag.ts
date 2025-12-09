import { Router } from 'express';
import { ragService } from '../services/rag';
import { upload } from '../lib/upload';
import * as fs from 'fs/promises';
import mammoth from 'mammoth';

const router = Router();

/**
 * POST /api/rag/index-proposal
 * Index a proposal for RAG retrieval
 */
router.post('/index-proposal', async (req, res, next) => {
  try {
    const { proposalId, sections, metadata } = req.body;

    if (!proposalId || !sections || !Array.isArray(sections)) {
      return res.status(400).json({
        error: 'proposalId and sections array are required',
      });
    }

    await ragService.indexProposal(proposalId, sections, metadata);

    res.json({
      success: true,
      message: `Indexed ${sections.length} sections from proposal ${proposalId}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rag/winning-proposal
 * Upload and index a winning proposal
 */
router.post('/winning-proposal', upload.single('file'), async (req, res, next) => {
  try {
    const { title, industry, projectType, winRate, companySize, dealValue, tags } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let content = '';

    // If file uploaded, extract content
    if (req.file) {
      const filePath = req.file.path;

      try {
        if (req.file.originalname.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ path: filePath });
          content = result.value;
        } else if (req.file.originalname.endsWith('.txt')) {
          content = await fs.readFile(filePath, 'utf-8');
        } else {
          return res.status(400).json({
            error: 'Only .docx and .txt files are supported',
          });
        }

        // Clean up uploaded file
        await fs.unlink(filePath);
      } catch (error) {
        // Try to clean up file
        try {
          await fs.unlink(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }
        throw error;
      }
    } else if (req.body.content) {
      content = req.body.content;
    } else {
      return res.status(400).json({
        error: 'Either file upload or content field is required',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Proposal content cannot be empty',
      });
    }

    const id = await ragService.indexWinningProposal({
      title,
      content,
      industry,
      projectType,
      winRate: winRate ? parseInt(winRate) : undefined,
      companySize,
      dealValue,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      metadata: {},
    });

    res.json({
      success: true,
      id,
      message: 'Winning proposal indexed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rag/search
 * Search for similar content
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, topK, filters, sources, minSimilarity } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await ragService.search(query, {
      topK: topK || 5,
      filters: filters || {},
      sources: sources || ['document_chunk', 'winning_proposal'],
      minSimilarity: minSimilarity || 0.5,
    });

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rag/context
 * Get formatted context for AI generation
 */
router.post('/context', async (req, res, next) => {
  try {
    const { query, topK, filters } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await ragService.search(query, {
      topK: topK || 3,
      filters: filters || {},
    });

    const context = ragService.buildContext(results);

    res.json({
      success: true,
      context,
      resultsUsed: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rag/stats
 * Get RAG system statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await ragService.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
