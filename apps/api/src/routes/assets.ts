import { Router, type IRouter } from 'express';
import multer from 'multer';
import { assetService } from '../services/assets';

const router: IRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/assets/upload
 * Upload a new asset
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { proposalId, type, width, height, fit, quality, format } = req.body;

    const options: any = {
      proposalId,
      type: type || 'other',
    };

    // Parse resize options
    if (width || height) {
      options.resize = {
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
        fit: fit || 'cover',
      };
    }

    // Parse quality
    if (quality) {
      options.quality = parseInt(quality, 10);
    }

    // Upload asset
    let result;
    if (format === 'base64') {
      result = await assetService.uploadAssetBase64(req.file, options);
    } else {
      result = await assetService.uploadAsset(req.file, options);
    }

    res.json({
      success: true,
      asset: result,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/assets/upload-multiple
 * Upload multiple assets
 */
router.post('/upload-multiple', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { proposalId, type } = req.body;

    const options: any = {
      proposalId,
      type: type || 'other',
    };

    const results = await Promise.all(
      req.files.map((file) => assetService.uploadAsset(file, options))
    );

    res.json({
      success: true,
      assets: results,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/assets/:id
 * Get asset by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await assetService.getAsset(id);

    res.json({
      success: true,
      asset: {
        id: asset.id,
        proposalId: asset.proposalId,
        type: asset.type,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        url: asset.url,
        metadata: asset.metadata,
        createdAt: asset.createdAt,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/assets/proposal/:proposalId
 * Get all assets for a proposal
 */
router.get('/proposal/:proposalId', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const assets = await assetService.getProposalAssets(proposalId);

    res.json({
      success: true,
      assets: assets.map((asset) => ({
        id: asset.id,
        proposalId: asset.proposalId,
        type: asset.type,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        url: asset.url,
        metadata: asset.metadata,
        createdAt: asset.createdAt,
      })),
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/assets/:id/crop
 * Crop an image asset
 */
router.post('/:id/crop', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { x, y, width, height } = req.body;

    if (x === undefined || y === undefined || !width || !height) {
      return res.status(400).json({
        error: 'Missing crop parameters (x, y, width, height)',
      });
    }

    const url = await assetService.cropImage(id, { x, y, width, height });

    res.json({
      success: true,
      url,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await assetService.deleteAsset(id);

    res.json({
      success: true,
      message: 'Asset deleted',
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
