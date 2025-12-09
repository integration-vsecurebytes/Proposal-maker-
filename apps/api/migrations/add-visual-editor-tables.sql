-- Migration: Add Visual Editor Tables
-- Created: 2025-12-08
-- Purpose: Add tables for graphics library, PDF caching, and job tracking

-- Graphics library with full-text search
CREATE TABLE IF NOT EXISTS graphic_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- illustration, icon, pattern, decorative
  style VARCHAR(50), -- flat, isometric, line, 3d
  tags JSONB,
  file_path TEXT NOT NULL,
  color_palette JSONB, -- [{color: "#FF5733", percentage: 25}]
  industry_tags TEXT[], -- technology, finance, healthcare, etc.
  search_vector tsvector,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graphic_search ON graphic_assets USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_graphic_category ON graphic_assets(category);
CREATE INDEX IF NOT EXISTS idx_graphic_style ON graphic_assets(style);

-- PDF generation cache
CREATE TABLE IF NOT EXISTS pdf_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  cache_key VARCHAR(64) UNIQUE NOT NULL,
  method VARCHAR(20) NOT NULL, -- puppeteer, libreoffice
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  metadata JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pdf_cache_proposal ON pdf_cache(proposal_id);
CREATE INDEX IF NOT EXISTS idx_pdf_cache_key ON pdf_cache(cache_key);

-- Async job tracking
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL, -- pdf, asset_batch
  status VARCHAR(50) NOT NULL, -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Extend existing tables
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS design_metadata JSONB;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_metadata JSONB;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS design_system JSONB;
