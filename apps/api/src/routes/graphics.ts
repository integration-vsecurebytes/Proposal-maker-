import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/graphics
 * List graphics with optional filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      style,
      industry,
      search,
      page = '1',
      limit = '24',
      sortBy = 'usage_count',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = sql`SELECT * FROM graphic_assets WHERE 1=1`;

    // Apply filters
    if (category && category !== 'all') {
      query = sql`${query} AND category = ${category}`;
    }

    if (style && style !== 'all') {
      query = sql`${query} AND style = ${style}`;
    }

    if (industry && industry !== 'all') {
      query = sql`${query} AND ${industry} = ANY(industry_tags)`;
    }

    // Full-text search
    if (search) {
      query = sql`${query} AND search_vector @@ plainto_tsquery('english', ${search})`;
    }

    // Sorting
    if (sortBy === 'usage_count') {
      query = sql`${query} ORDER BY usage_count DESC`;
    } else if (sortBy === 'created_at') {
      query = sql`${query} ORDER BY created_at DESC`;
    } else {
      query = sql`${query} ORDER BY name ASC`;
    }

    // Pagination
    query = sql`${query} LIMIT ${limitNum} OFFSET ${offset}`;

    const result = await db.execute(query);

    // Get total count for pagination
    let countQuery = sql`SELECT COUNT(*) as total FROM graphic_assets WHERE 1=1`;
    if (category && category !== 'all') {
      countQuery = sql`${countQuery} AND category = ${category}`;
    }
    if (style && style !== 'all') {
      countQuery = sql`${countQuery} AND style = ${style}`;
    }
    if (industry && industry !== 'all') {
      countQuery = sql`${countQuery} AND ${industry} = ANY(industry_tags)`;
    }
    if (search) {
      countQuery = sql`${countQuery} AND search_vector @@ plainto_tsquery('english', ${search})`;
    }

    const countResult = await db.execute(countQuery);
    const total = (countResult.rows[0] as any)?.total || 0;

    res.json({
      graphics: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total, 10),
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching graphics:', error);
    res.status(500).json({ error: 'Failed to fetch graphics' });
  }
});

/**
 * GET /api/graphics/:id
 * Get a single graphic asset by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(
      sql`SELECT * FROM graphic_assets WHERE id = ${id}`
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Graphic not found' });
    }

    // Increment usage count
    await db.execute(
      sql`UPDATE graphic_assets SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = ${id}`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching graphic:', error);
    res.status(500).json({ error: 'Failed to fetch graphic' });
  }
});

/**
 * GET /api/graphics/search
 * Full-text search for graphics
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const limitNum = parseInt(limit as string, 10);

    const result = await db.execute(sql`
      SELECT *,
        ts_rank(search_vector, plainto_tsquery('english', ${q})) AS rank
      FROM graphic_assets
      WHERE search_vector @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC, usage_count DESC
      LIMIT ${limitNum}
    `);

    res.json({
      results: result.rows,
      count: result.rows?.length || 0,
    });
  } catch (error) {
    console.error('Error searching graphics:', error);
    res.status(500).json({ error: 'Failed to search graphics' });
  }
});

/**
 * POST /api/graphics
 * Upload a custom graphic
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      style,
      tags = [],
      file_path,
      color_palette = [],
      industry_tags = [],
    } = req.body;

    // Validation
    if (!name || !category || !file_path) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, file_path',
      });
    }

    // Create search vector from name and tags
    const searchText = [name, ...tags, ...industry_tags].join(' ');

    const result = await db.execute(sql`
      INSERT INTO graphic_assets (
        name, category, style, tags, file_path, color_palette, industry_tags, search_vector
      )
      VALUES (
        ${name},
        ${category},
        ${style},
        ${JSON.stringify(tags)},
        ${file_path},
        ${JSON.stringify(color_palette)},
        ARRAY[${industry_tags.join(',')}],
        to_tsvector('english', ${searchText})
      )
      RETURNING *
    `);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating graphic:', error);
    res.status(500).json({ error: 'Failed to create graphic' });
  }
});

/**
 * PUT /api/graphics/:id/favorite
 * Toggle favorite status (client-side only, for now)
 */
router.put('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;

    // In production, this would update user-specific favorites
    // For now, just increment usage count
    if (isFavorite) {
      await db.execute(
        sql`UPDATE graphic_assets SET usage_count = usage_count + 1 WHERE id = ${id}`
      );
    }

    res.json({ success: true, isFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

/**
 * DELETE /api/graphics/:id
 * Delete a graphic asset
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(
      sql`DELETE FROM graphic_assets WHERE id = ${id} RETURNING *`
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Graphic not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting graphic:', error);
    res.status(500).json({ error: 'Failed to delete graphic' });
  }
});

export default router;
