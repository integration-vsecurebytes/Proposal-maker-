/**
 * PDF Cache Service
 * Caches generated PDFs with LRU eviction
 * Max 1000 PDFs, 7-day TTL
 */

import { db } from '../../db';
import { pdfCache } from '../../db/schema';
import { eq, lt, desc, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';

const MAX_CACHE_SIZE = 1000; // Max 1000 cached PDFs
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface CachedPDF {
  id: string;
  proposalId: string;
  cacheKey: string;
  method: string;
  filePath: string;
  fileSize: number;
  metadata?: any;
  generatedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  expiresAt: Date | null;
}

export interface SaveCacheOptions {
  proposalId: string;
  cacheKey: string;
  method: string;
  filePath: string;
  fileSize: number;
  metadata?: any;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Check cache for existing PDF
 */
export async function checkCache(cacheKey: string): Promise<CachedPDF | null> {
  try {
    // Find cached PDF
    const [cached] = await db
      .select()
      .from(pdfCache)
      .where(eq(pdfCache.cacheKey, cacheKey))
      .limit(1);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
      console.log(`[PDF Cache] Cache expired for key ${cacheKey}`);
      await clearCache(cacheKey);
      return null;
    }

    // Update access timestamp and count
    await db
      .update(pdfCache)
      .set({
        lastAccessedAt: new Date(),
        accessCount: (cached.accessCount || 0) + 1,
      })
      .where(eq(pdfCache.id, cached.id));

    console.log(`[PDF Cache] Cache hit for key ${cacheKey}`);

    return {
      id: cached.id,
      proposalId: cached.proposalId!,
      cacheKey: cached.cacheKey,
      method: cached.method,
      filePath: cached.filePath,
      fileSize: cached.fileSizeBytes || 0,
      metadata: cached.metadata,
      generatedAt: cached.generatedAt!,
      lastAccessedAt: new Date(),
      accessCount: (cached.accessCount || 0) + 1,
      expiresAt: cached.expiresAt,
    };
  } catch (error) {
    console.error('[PDF Cache] Error checking cache:', error);
    return null;
  }
}

/**
 * Save PDF to cache
 */
export async function saveToCache(options: SaveCacheOptions): Promise<void> {
  try {
    const { proposalId, cacheKey, method, filePath, fileSize, metadata, ttl = DEFAULT_TTL } = options;

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + ttl);

    // Save to cache
    await db.insert(pdfCache).values({
      proposalId,
      cacheKey,
      method,
      filePath,
      fileSizeBytes: fileSize,
      metadata,
      expiresAt,
      generatedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0,
    });

    console.log(`[PDF Cache] Saved to cache: ${cacheKey}`);

    // Check cache size and evict if needed
    await evictIfNeeded();
  } catch (error) {
    console.error('[PDF Cache] Error saving to cache:', error);
    throw error;
  }
}

/**
 * Clear cache by cache key or proposal ID
 */
export async function clearCache(keyOrProposalId: string): Promise<number> {
  try {
    // Try to find by cache key first
    let cached = await db
      .select()
      .from(pdfCache)
      .where(eq(pdfCache.cacheKey, keyOrProposalId));

    // If not found, try by proposal ID
    if (cached.length === 0) {
      cached = await db
        .select()
        .from(pdfCache)
        .where(eq(pdfCache.proposalId, keyOrProposalId));
    }

    if (cached.length === 0) {
      return 0;
    }

    // Delete files from filesystem
    for (const entry of cached) {
      try {
        await unlink(entry.filePath);
        console.log(`[PDF Cache] Deleted file: ${entry.filePath}`);
      } catch (error) {
        console.warn(`[PDF Cache] Failed to delete file: ${entry.filePath}`);
      }
    }

    // Delete from database
    const result = await db
      .delete(pdfCache)
      .where(
        cached.length === 1 && cached[0].cacheKey === keyOrProposalId
          ? eq(pdfCache.cacheKey, keyOrProposalId)
          : eq(pdfCache.proposalId, keyOrProposalId)
      );

    console.log(`[PDF Cache] Cleared ${cached.length} cache entries`);

    return cached.length;
  } catch (error) {
    console.error('[PDF Cache] Error clearing cache:', error);
    return 0;
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpired(): Promise<number> {
  try {
    // Find expired entries
    const expired = await db
      .select()
      .from(pdfCache)
      .where(lt(pdfCache.expiresAt, new Date()));

    if (expired.length === 0) {
      return 0;
    }

    // Delete files from filesystem
    for (const entry of expired) {
      try {
        await unlink(entry.filePath);
      } catch (error) {
        console.warn(`[PDF Cache] Failed to delete expired file: ${entry.filePath}`);
      }
    }

    // Delete from database
    await db
      .delete(pdfCache)
      .where(lt(pdfCache.expiresAt, new Date()));

    console.log(`[PDF Cache] Cleared ${expired.length} expired entries`);

    return expired.length;
  } catch (error) {
    console.error('[PDF Cache] Error clearing expired entries:', error);
    return 0;
  }
}

/**
 * Evict least recently used entries if cache size exceeds limit
 */
async function evictIfNeeded(): Promise<void> {
  try {
    // Count total cache entries
    const allEntries = await db.select().from(pdfCache);
    const totalCount = allEntries.length;

    if (totalCount <= MAX_CACHE_SIZE) {
      return;
    }

    // Calculate how many to evict
    const evictCount = totalCount - MAX_CACHE_SIZE;

    console.log(
      `[PDF Cache] Cache size (${totalCount}) exceeds limit (${MAX_CACHE_SIZE}), evicting ${evictCount} entries`
    );

    // Get least recently used entries
    const toEvict = await db
      .select()
      .from(pdfCache)
      .orderBy(pdfCache.lastAccessedAt)
      .limit(evictCount);

    // Delete files from filesystem
    for (const entry of toEvict) {
      try {
        await unlink(entry.filePath);
        console.log(`[PDF Cache] Evicted file: ${entry.filePath}`);
      } catch (error) {
        console.warn(`[PDF Cache] Failed to delete evicted file: ${entry.filePath}`);
      }
    }

    // Delete from database
    const idsToDelete = toEvict.map((entry) => entry.id);
    for (const id of idsToDelete) {
      await db.delete(pdfCache).where(eq(pdfCache.id, id));
    }

    console.log(`[PDF Cache] Evicted ${toEvict.length} entries (LRU)`);
  } catch (error) {
    console.error('[PDF Cache] Error evicting entries:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSizeBytes: number;
  avgAccessCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  byMethod: Record<string, number>;
}> {
  try {
    const allEntries = await db.select().from(pdfCache);

    if (allEntries.length === 0) {
      return {
        totalEntries: 0,
        totalSizeBytes: 0,
        avgAccessCount: 0,
        oldestEntry: null,
        newestEntry: null,
        byMethod: {},
      };
    }

    const totalSizeBytes = allEntries.reduce((sum, entry) => sum + (entry.fileSizeBytes || 0), 0);
    const totalAccessCount = allEntries.reduce((sum, entry) => sum + (entry.accessCount || 0), 0);
    const avgAccessCount = Math.round(totalAccessCount / allEntries.length);

    const sortedByDate = [...allEntries].sort(
      (a, b) => a.generatedAt!.getTime() - b.generatedAt!.getTime()
    );
    const oldestEntry = sortedByDate[0]?.generatedAt || null;
    const newestEntry = sortedByDate[sortedByDate.length - 1]?.generatedAt || null;

    const byMethod: Record<string, number> = {};
    for (const entry of allEntries) {
      byMethod[entry.method] = (byMethod[entry.method] || 0) + 1;
    }

    return {
      totalEntries: allEntries.length,
      totalSizeBytes,
      avgAccessCount,
      oldestEntry,
      newestEntry,
      byMethod,
    };
  } catch (error) {
    console.error('[PDF Cache] Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalSizeBytes: 0,
      avgAccessCount: 0,
      oldestEntry: null,
      newestEntry: null,
      byMethod: {},
    };
  }
}

/**
 * Get cache entries for a proposal
 */
export async function getCacheEntriesForProposal(proposalId: string): Promise<CachedPDF[]> {
  try {
    const entries = await db
      .select()
      .from(pdfCache)
      .where(eq(pdfCache.proposalId, proposalId))
      .orderBy(desc(pdfCache.generatedAt));

    return entries.map((entry) => ({
      id: entry.id,
      proposalId: entry.proposalId!,
      cacheKey: entry.cacheKey,
      method: entry.method,
      filePath: entry.filePath,
      fileSize: entry.fileSizeBytes || 0,
      metadata: entry.metadata,
      generatedAt: entry.generatedAt!,
      lastAccessedAt: entry.lastAccessedAt!,
      accessCount: entry.accessCount || 0,
      expiresAt: entry.expiresAt,
    }));
  } catch (error) {
    console.error('[PDF Cache] Error getting cache entries for proposal:', error);
    return [];
  }
}

/**
 * Warm up cache by pre-generating PDFs for recent proposals
 * (Called during off-peak hours)
 */
export async function warmupCache(proposalIds: string[]): Promise<void> {
  console.log(`[PDF Cache] Warming up cache for ${proposalIds.length} proposals...`);
  // Implementation would call generatePDF for each proposal
  // This is a placeholder for future implementation
}

/**
 * Clear all cache entries (admin function)
 */
export async function clearAllCache(): Promise<number> {
  try {
    const allEntries = await db.select().from(pdfCache);

    // Delete files from filesystem
    for (const entry of allEntries) {
      try {
        await unlink(entry.filePath);
      } catch (error) {
        console.warn(`[PDF Cache] Failed to delete file: ${entry.filePath}`);
      }
    }

    // Delete from database
    await db.delete(pdfCache);

    console.log(`[PDF Cache] Cleared all ${allEntries.length} cache entries`);

    return allEntries.length;
  } catch (error) {
    console.error('[PDF Cache] Error clearing all cache:', error);
    return 0;
  }
}

// Schedule automatic cleanup job (runs every hour)
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    console.log('[PDF Cache] Running scheduled cleanup...');
    const expiredCount = await clearExpired();
    console.log(`[PDF Cache] Cleanup completed: removed ${expiredCount} expired entries`);
  }, 60 * 60 * 1000); // 1 hour
}
