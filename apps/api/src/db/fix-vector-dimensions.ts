import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Migration script to update vector dimensions from 1536 to 768
 * This is needed because we're using Gemini text-embedding-004 which produces 768-dimensional embeddings
 */
async function fixVectorDimensions() {
  console.log('Starting vector dimension migration...');

  try {
    // Drop and recreate document_chunks embedding column with correct dimensions
    console.log('Updating document_chunks.embedding column...');
    await db.execute(sql`
      ALTER TABLE document_chunks
      DROP COLUMN IF EXISTS embedding CASCADE;
    `);

    await db.execute(sql`
      ALTER TABLE document_chunks
      ADD COLUMN embedding vector(768);
    `);
    console.log('✓ document_chunks.embedding updated to 768 dimensions');

    // Drop and recreate winning_proposals embedding column with correct dimensions
    console.log('Updating winning_proposals.embedding column...');
    await db.execute(sql`
      ALTER TABLE winning_proposals
      DROP COLUMN IF EXISTS embedding CASCADE;
    `);

    await db.execute(sql`
      ALTER TABLE winning_proposals
      ADD COLUMN embedding vector(768);
    `);
    console.log('✓ winning_proposals.embedding updated to 768 dimensions');

    console.log('✅ Vector dimension migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
fixVectorDimensions()
  .then(() => {
    console.log('Migration complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
