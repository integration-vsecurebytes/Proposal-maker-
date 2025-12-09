-- Add branding column to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS branding JSONB;
