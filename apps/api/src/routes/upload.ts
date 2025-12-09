import { Router } from 'express';
import { upload, uploadImage } from '../lib/upload';
import { templateExtractor } from '../services/templates/extractor';
import { aiTemplateExtractor } from '../services/templates/ai-extractor';
import { templateService } from '../services/templates';
import * as fs from 'fs/promises';

const router = Router();

/**
 * POST /api/upload
 * General file upload endpoint for images, logos, etc.
 */
router.post('/', uploadImage.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { proposalId, fileType } = req.body;

    // Get file information
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileUrl = `/uploads/${fileName}`;

    console.log(`File uploaded: ${fileName} (Type: ${fileType || 'unknown'})`);

    res.json({
      success: true,
      file: {
        filename: fileName,
        path: filePath,
        url: fileUrl,
        filePath: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      proposalId,
      fileType,
      filePath, // For backward compatibility
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    next(error);
  }
});

/**
 * POST /api/upload/template
 * Upload and extract DOCX template
 * Query params:
 *   - useAI=true: Use AI-powered extraction (Gemini + GPT-4)
 */
router.post('/template', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name } = req.body;
    const useAI = req.query.useAI === 'true' || req.body.useAI === 'true';

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const filePath = req.file.path;

    console.log(`Extracting template from: ${filePath} (AI: ${useAI})`);

    let schema, styles, assets, aiAnalysis;

    if (useAI) {
      // Use AI-powered extraction
      console.log('🤖 Using AI-powered extraction...');
      const aiResult = await aiTemplateExtractor.extractDesignWithAI(filePath);
      schema = aiResult.schema;
      styles = aiResult.styles;
      assets = aiResult.assets;
      aiAnalysis = aiResult.aiAnalysis;
    } else {
      // Use traditional extraction
      const result = await templateExtractor.extractFromDOCX(filePath);
      schema = result.schema;
      styles = result.styles;
      assets = result.assets;
    }

    // Update schema name
    schema.name = name;

    // Generate base slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    // Check for existing slugs and make unique
    let slug = baseSlug;
    let counter = 1;
    while (await templateService.getTemplate(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log(`Generated unique slug: ${slug}`);

    // Save template to database
    const template = await templateService.createTemplate(name, slug, schema, styles, assets);

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Build image placements for response
    const imagePlacements: any = {};
    if (assets.companyLogo) {
      imagePlacements.companyLogo = assets.companyLogo.placement;
    }
    if (assets.headerLogo) {
      imagePlacements.headerLogo = assets.headerLogo.placement;
    }
    if (assets.footerLogo) {
      imagePlacements.footerLogo = assets.footerLogo.placement;
    }
    if (assets.coverImage) {
      imagePlacements.coverImage = assets.coverImage.placement;
    }
    if (assets.thankYouSlide) {
      imagePlacements.thankYouSlide = assets.thankYouSlide.placement;
    }

    res.json({
      success: true,
      template,
      extracted: {
        sectionsCount: schema.sections?.length || 0,
        imagesCount: Object.keys(assets).filter(k => assets[k] && k !== 'images').length + (assets.images?.length || 0),
        colors: {
          primary: styles.primaryColor || null,
          secondary: styles.secondaryColor || null,
          accent: styles.accentColor || null,
        },
        fonts: {
          heading: styles.fontFamily || styles.bodyFont || null,
          body: styles.bodyFont || styles.fontFamily || null,
        },
        hasLogo: !!assets.companyLogo,
        primaryColor: styles.primaryColor,
        fontFamily: styles.fontFamily,
        aiPowered: useAI,
        confidence: aiAnalysis?.confidence,
        designStyle: styles.designStyle || null,
        industry: schema.industry || null,
        // Include placement information
        placements: imagePlacements,
      },
      aiAnalysis: useAI ? aiAnalysis : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    next(error);
  }
});

/**
 * POST /api/upload/template/:id/re-extract
 * Re-extract an existing template from a new DOCX file
 */
router.post('/template/:id/re-extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params;
    const filePath = req.file.path;

    console.log(`Re-extracting template ${id} from: ${filePath}`);

    // Extract template data from DOCX
    const { schema, styles, assets } = await templateExtractor.extractFromDOCX(filePath);

    // Update the existing template with new extracted data
    const template = await templateService.updateTemplate(id, {
      schema,
      styles,
      assets,
    });

    // Clean up uploaded file
    await fs.unlink(filePath);

    res.json({
      success: true,
      template,
      extracted: {
        sectionsCount: schema.sections?.length || 0,
        hasLogo: !!assets.companyLogo,
        primaryColor: styles.primaryColor,
        fontFamily: styles.fontFamily,
      },
    });
  } catch (error) {
    console.error('Re-extract error:', error);

    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    next(error);
  }
});

export default router;
