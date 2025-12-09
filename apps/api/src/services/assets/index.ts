import { db } from '../../db';
import { assets } from '../../db/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface AssetUploadOptions {
  proposalId?: string;
  type: 'company_logo' | 'client_logo' | 'cover_image' | 'diagram' | 'chart' | 'other';
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  quality?: number;
}

export class AssetService {
  constructor() {
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Upload and process an asset
   */
  async uploadAsset(
    file: Express.Multer.File,
    options: AssetUploadOptions
  ): Promise<{
    id: string;
    filename: string;
    url: string;
    size: number;
  }> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    try {
      let processedBuffer = file.buffer;
      let processedFilename = file.originalname;

      // Process image if options provided
      if (options.resize || options.quality) {
        const processor = sharp(file.buffer);

        if (options.resize) {
          processor.resize(options.resize);
        }

        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
          processor.jpeg({ quality: options.quality || 85 });
          processedFilename = processedFilename.replace(/\.[^.]+$/, '.jpg');
        } else if (file.mimetype === 'image/png') {
          processor.png({ quality: options.quality || 85 });
          processedFilename = processedFilename.replace(/\.[^.]+$/, '.png');
        }

        processedBuffer = await processor.toBuffer();
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitized = processedFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${timestamp}_${sanitized}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      // Save file
      await writeFile(filePath, processedBuffer);

      // Save metadata to database
      const [asset] = await db
        .insert(assets)
        .values({
          proposalId: options.proposalId,
          type: options.type,
          filename: uniqueFilename,
          mimeType: file.mimetype,
          size: processedBuffer.length,
          url: `/uploads/${uniqueFilename}`,
          data: filePath, // Store file path
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        })
        .returning();

      return {
        id: asset.id,
        filename: uniqueFilename,
        url: asset.url || '',
        size: processedBuffer.length,
      };
    } catch (error) {
      console.error('Failed to upload asset:', error);
      throw new Error('Failed to process and save asset');
    }
  }

  /**
   * Upload asset as base64 (for embedded assets in DOCX)
   */
  async uploadAssetBase64(
    file: Express.Multer.File,
    options: AssetUploadOptions
  ): Promise<{
    id: string;
    base64: string;
  }> {
    // Process image
    let processedBuffer = file.buffer;

    if (options.resize || options.quality) {
      const processor = sharp(file.buffer);

      if (options.resize) {
        processor.resize(options.resize);
      }

      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        processor.jpeg({ quality: options.quality || 85 });
      } else if (file.mimetype === 'image/png') {
        processor.png({ quality: options.quality || 85 });
      }

      processedBuffer = await processor.toBuffer();
    }

    // Convert to base64
    const base64 = processedBuffer.toString('base64');
    const base64Data = `data:${file.mimetype};base64,${base64}`;

    // Save to database
    const [asset] = await db
      .insert(assets)
      .values({
        proposalId: options.proposalId,
        type: options.type,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: processedBuffer.length,
        data: base64Data, // Store base64
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          embedded: true,
        },
      })
      .returning();

    return {
      id: asset.id,
      base64: base64Data,
    };
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string) {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, assetId));

    if (!asset) {
      throw new Error('Asset not found');
    }

    return asset;
  }

  /**
   * Get all assets for a proposal
   */
  async getProposalAssets(proposalId: string) {
    return db
      .select()
      .from(assets)
      .where(eq(assets.proposalId, proposalId));
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.getAsset(assetId);

    // Delete file if exists
    if (asset.data && asset.data.startsWith('/') && !asset.data.startsWith('data:')) {
      try {
        await unlink(asset.data);
      } catch (error) {
        console.warn('Failed to delete asset file:', error);
      }
    }

    // Delete from database
    await db.delete(assets).where(eq(assets.id, assetId));
  }

  /**
   * Crop image
   */
  async cropImage(
    assetId: string,
    crop: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): Promise<string> {
    const asset = await this.getAsset(assetId);

    let imageBuffer: Buffer;

    if (asset.data?.startsWith('data:')) {
      // Base64 data
      const base64Data = asset.data.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (asset.data) {
      // File path
      const { readFile } = await import('fs/promises');
      imageBuffer = await readFile(asset.data);
    } else {
      throw new Error('Asset data not found');
    }

    // Crop image
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      })
      .toBuffer();

    // Save cropped version
    const timestamp = Date.now();
    const croppedFilename = `${timestamp}_cropped_${asset.filename}`;
    const croppedPath = path.join(UPLOAD_DIR, croppedFilename);

    await writeFile(croppedPath, croppedBuffer);

    // Update database
    await db
      .update(assets)
      .set({
        data: croppedPath,
        url: `/uploads/${croppedFilename}`,
        size: croppedBuffer.length,
      })
      .where(eq(assets.id, assetId));

    return `/uploads/${croppedFilename}`;
  }
}

export const assetService = new AssetService();
