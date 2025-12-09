-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database if not exists (this runs on initial setup)
-- The database should already be created by the POSTGRES_DB env var,
-- but we can add additional setup here if needed

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE proposals TO postgres;
