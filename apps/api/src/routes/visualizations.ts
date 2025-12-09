import { Router, type IRouter } from 'express';
import { chartGenerationService } from '../services/visualizations/charts';
import { diagramGenerationService } from '../services/visualizations/diagrams';
import { db } from '../db';
import { visualizations } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { GenerateChartRequest, GenerateDiagramRequest } from '@proposal-gen/shared';

const router: IRouter = Router();

/**
 * POST /api/visualizations/chart/generate
 * Generate a chart using AI
 */
router.post('/chart/generate', async (req, res, next) => {
  try {
    const request: GenerateChartRequest = req.body;

    const { proposalId, sectionId, chartType, title, context } = request;

    if (!proposalId || !sectionId || !chartType || !title) {
      return res.status(400).json({
        error: 'Missing required fields: proposalId, sectionId, chartType, title',
      });
    }

    // Generate chart configuration
    const chartConfig = await chartGenerationService.generateChart(request);

    // Save to database
    const visualization = await chartGenerationService.saveChart(
      proposalId,
      sectionId,
      chartConfig
    );

    res.json({
      success: true,
      visualization: {
        id: visualization.id,
        type: visualization.type,
        config: visualization.config,
        createdAt: visualization.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/visualizations/diagram/generate
 * Generate a diagram using AI
 */
router.post('/diagram/generate', async (req, res, next) => {
  try {
    const request: GenerateDiagramRequest = req.body;

    const { proposalId, sectionId, diagramType, description } = request;

    if (!proposalId || !sectionId || !diagramType || !description) {
      return res.status(400).json({
        error: 'Missing required fields: proposalId, sectionId, diagramType, description',
      });
    }

    // Generate diagram configuration
    const diagramConfig = await diagramGenerationService.generateDiagram(request);

    // Save to database
    const visualization = await diagramGenerationService.saveDiagram(
      proposalId,
      sectionId,
      diagramConfig
    );

    res.json({
      success: true,
      visualization: {
        id: visualization.id,
        type: visualization.type,
        config: visualization.config,
        createdAt: visualization.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/visualizations/proposal/:proposalId
 * Get all visualizations for a proposal
 */
router.get('/proposal/:proposalId', async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    const allVisualizations = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.proposalId, proposalId));

    res.json({
      success: true,
      visualizations: allVisualizations.map(v => ({
        id: v.id,
        proposalId: v.proposalId,
        sectionId: v.sectionId,
        type: v.type,
        config: v.config,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/visualizations/:id
 * Get a specific visualization by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id));

    if (!visualization) {
      return res.status(404).json({ error: 'Visualization not found' });
    }

    res.json({
      success: true,
      visualization: {
        id: visualization.id,
        proposalId: visualization.proposalId,
        sectionId: visualization.sectionId,
        type: visualization.type,
        config: visualization.config,
        createdAt: visualization.createdAt,
        updatedAt: visualization.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/visualizations/:id
 * Update a visualization configuration
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    // Get existing visualization to determine type
    const [existing] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'Visualization not found' });
    }

    // Update based on type
    let updated;
    if (existing.type === 'chart') {
      updated = await chartGenerationService.updateChart(id, config);
    } else {
      updated = await diagramGenerationService.updateDiagram(id, config);
    }

    res.json({
      success: true,
      visualization: {
        id: updated.id,
        type: updated.type,
        config: updated.config,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/visualizations/:id
 * Delete a visualization
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.delete(visualizations).where(eq(visualizations.id, id));

    res.json({
      success: true,
      message: 'Visualization deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/visualizations/:id/regenerate
 * Regenerate a visualization using AI
 */
router.post('/:id/regenerate', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get existing visualization
    const [existing] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'Visualization not found' });
    }

    let newConfig;
    if (existing.type === 'chart') {
      const chartConfig = existing.config as any;
      newConfig = await chartGenerationService.generateChart({
        proposalId: existing.proposalId,
        sectionId: existing.sectionId,
        chartType: chartConfig.type,
        title: chartConfig.title,
      });
      await chartGenerationService.updateChart(id, newConfig);
    } else {
      const diagramConfig = existing.config as any;
      newConfig = await diagramGenerationService.generateDiagram({
        proposalId: existing.proposalId,
        sectionId: existing.sectionId,
        diagramType: diagramConfig.type,
        description: diagramConfig.title,
      });
      await diagramGenerationService.updateDiagram(id, newConfig);
    }

    res.json({
      success: true,
      visualization: {
        id: existing.id,
        type: existing.type,
        config: newConfig,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
