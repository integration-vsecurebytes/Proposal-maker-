import { Router } from 'express';
import { templateService } from '../services/templates';
import { upload } from '../lib/upload';

const router = Router();

/**
 * GET /api/templates
 * List all templates
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await templateService.listTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:slugOrId
 * Get template by slug or ID
 */
router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;

    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let template;
    if (isUUID) {
      // Fetch by ID - UUIDs are always database records, never predefined
      template = await templateService.getTemplateById(slugOrId);

      if (!template) {
        console.log(`Template with ID ${slugOrId} not found in database`);
        return res.status(404).json({ error: 'Template not found' });
      }
    } else {
      // Fetch by slug - can be from database or predefined
      template = await templateService.getTemplate(slugOrId);

      if (!template) {
        console.log(`Template with slug ${slugOrId} not found`);
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    next(error);
  }
});

/**
 * POST /api/templates
 * Create new template
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, slug, schema, styles, assets } = req.body;

    if (!name || !slug || !schema) {
      return res.status(400).json({ error: 'Missing required fields: name, slug, schema' });
    }

    const template = await templateService.createTemplate(name, slug, schema, styles, assets);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/templates/:id
 * Update template
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const template = await templateService.updateTemplate(id, data);
    res.json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/templates/:id
 * Delete template (soft delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/:id/images
 * Upload/update template images manually
 * Body: { imageType: 'companyLogo' | 'headerLogo' | 'footerLogo' | 'coverImage' }
 */
router.post('/:id/images', upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    if (!imageType) {
      return res.status(400).json({ error: 'imageType is required (companyLogo, headerLogo, footerLogo, coverImage)' });
    }

    // Convert to base64
    const fs = await import('fs/promises');
    const fileData = await fs.readFile(req.file.path);
    const base64 = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;

    // Get existing template
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Update assets
    const assets = (template.assets as any) || {};
    assets[imageType] = base64;

    // Update template
    const updated = await templateService.updateTemplate(id, { assets });

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      template: updated,
      imageType,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    next(error);
  }
});

export default router;
