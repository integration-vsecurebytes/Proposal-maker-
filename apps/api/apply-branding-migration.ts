import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    console.log('🔄 Applying branding column migration...');

    // Add branding column to proposals table
    await db.execute(sql`
      ALTER TABLE proposals
      ADD COLUMN IF NOT EXISTS branding JSONB
    `);

    console.log('✅ Migration applied successfully!');
    console.log('📋 Branding column added to proposals table');

    // Verify the column was added
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      AND column_name = 'branding'
    `);

    if (result.rows && result.rows.length > 0) {
      console.log('✅ Verification: branding column exists');
      console.log(`   Type: ${result.rows[0].data_type}`);
    } else {
      console.log('⚠️  Warning: Could not verify column creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
