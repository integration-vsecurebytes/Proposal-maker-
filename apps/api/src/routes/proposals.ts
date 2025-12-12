import { Router } from 'express';
import { proposalGenerator } from '../services/proposal/generator';
import { db } from '../db';
import { proposals, conversations, visualizations } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/proposals
 * List all proposals
 */
router.get('/', async (req, res, next) => {
  try {
    const allProposals = await db
      .select()
      .from(proposals)
      .orderBy(desc(proposals.createdAt));

    res.json({
      success: true,
      proposals: allProposals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/proposals/:id/generate
 * Generate proposal content with real-time progress via SSE (for EventSource)
 */
router.get('/:id/generate', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const { stream = false } = req.query;

    // If streaming is requested, use SSE
    if (stream === 'true') {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Starting proposal generation...' })}\n\n`);

      // Generate with progress callback
      try {
        await proposalGenerator.generateProposal(proposalId, (progress) => {
          // Send progress update via SSE
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            ...progress
          })}\n\n`);
        });

        // Send completion message
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          message: 'Proposal generation completed successfully!'
        })}\n\n`);
        res.end();
      } catch (error: any) {
        // Send error message
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error.message || 'Generation failed'
        })}\n\n`);
        res.end();
      }
    } else {
      // Regular non-streaming request
      const result = await proposalGenerator.generateProposal(proposalId);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/proposals/:id/generate
 * Generate proposal content from conversation data (non-streaming alternative)
 */
router.post('/:id/generate', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const result = await proposalGenerator.generateProposal(proposalId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/proposals/:id/sections/:sectionId/regenerate
 * Regenerate a specific section
 */
router.post('/:id/sections/:sectionId/regenerate', async (req, res, next) => {
  try {
    const { id: proposalId, sectionId } = req.params;
    const options = req.body; // Get options from request body (includeImages, includeCharts, includeDiagrams)

    const result = await proposalGenerator.regenerateSection(proposalId, sectionId, options);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/proposals/:id
 * Get proposal details including generated content
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json({
      success: true,
      proposal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/proposals/:id
 * Delete a proposal and its related data
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Delete all related data first (foreign key constraints)
    // 1. Delete visualizations
    await db
      .delete(visualizations)
      .where(eq(visualizations.proposalId, proposalId));

    // 2. Delete conversations
    await db
      .delete(conversations)
      .where(eq(conversations.proposalId, proposalId));

    // 3. Now delete the proposal itself
    await db
      .delete(proposals)
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      message: 'Proposal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/proposals/:id/sections/:sectionId
 * Update a section's content manually
 */
router.put('/:id/sections/:sectionId', async (req, res, next) => {
  try {
    const { id: proposalId, sectionId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const generatedContent = (proposal.generatedContent as any) || { sections: {} };

    if (!generatedContent.sections[sectionId]) {
      return res.status(404).json({ error: 'Section not found' });
    }

    generatedContent.sections[sectionId].content = content;
    generatedContent.sections[sectionId].editedAt = new Date().toISOString();
    generatedContent.sections[sectionId].edited = true;

    await db
      .update(proposals)
      .set({
        generatedContent,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      section: generatedContent.sections[sectionId],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/proposals/:id/branding
 * Get proposal branding configuration
 */
router.get('/:id/branding', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json({
      success: true,
      branding: proposal.branding || {},
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/proposals/:id
 * Partially update proposal fields (general update)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const updateData = req.body;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Build update object only with provided fields
    const updates: any = { updatedAt: new Date() };

    if (updateData.title !== undefined) updates.title = updateData.title;
    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.branding !== undefined) {
      // Merge branding with existing
      const currentBranding = (proposal.branding as any) || {};
      updates.branding = { ...currentBranding, ...updateData.branding };
    }
    if (updateData.design !== undefined) {
      // Merge design with existing
      const currentDesign = (proposal.design as any) || {};
      updates.design = { ...currentDesign, ...updateData.design };
    }

    await db
      .update(proposals)
      .set(updates)
      .where(eq(proposals.id, proposalId));

    // Fetch updated proposal
    const [updatedProposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      proposal: updatedProposal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/proposals/:id/branding
 * Update proposal branding configuration
 */
router.put('/:id/branding', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const brandingData = req.body;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Merge with existing branding
    const currentBranding = (proposal.branding as any) || {};
    const updatedBranding = { ...currentBranding, ...brandingData };

    await db
      .update(proposals)
      .set({
        branding: updatedBranding,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      branding: updatedBranding,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/proposals/:id/branding
 * Partially update specific branding fields
 */
router.patch('/:id/branding', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const { section, data } = req.body;

    if (!section || !data) {
      return res.status(400).json({ error: 'Section and data are required' });
    }

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const currentBranding = (proposal.branding as any) || {};

    // Update specific section (header, footer, thankYouSlide, backCover, etc.)
    const updatedBranding = {
      ...currentBranding,
      [section]: {
        ...(currentBranding[section] || {}),
        ...data,
      },
    };

    await db
      .update(proposals)
      .set({
        branding: updatedBranding,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      branding: updatedBranding,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/proposals/:id/design
 * Get design system configuration (colors + fonts)
 */
router.get('/:id/design', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const designMetadata = (proposal.designMetadata as any) || null;

    res.json({
      success: true,
      design: designMetadata,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/proposals/:id/design
 * Save complete design system configuration
 */
router.put('/:id/design', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;
    const { design } = req.body;

    if (!design) {
      return res.status(400).json({ error: 'Design configuration required' });
    }

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    await db
      .update(proposals)
      .set({
        designMetadata: design,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      design,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/proposals/:id/design
 * Reset design to defaults
 */
router.delete('/:id/design', async (req, res, next) => {
  try {
    const { id: proposalId } = req.params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    await db
      .update(proposals)
      .set({
        designMetadata: null,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    res.json({
      success: true,
      message: 'Design reset to defaults',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
