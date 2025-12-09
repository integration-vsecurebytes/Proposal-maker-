import { db } from './src/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  try {
    console.log('🔄 Applying visual editor tables migration...');

    // Read the SQL migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-visual-editor-tables.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration applied successfully!');
    console.log('📋 New tables created:');
    console.log('   - graphic_assets (graphics library with full-text search)');
    console.log('   - pdf_cache (PDF generation cache)');
    console.log('   - generation_jobs (async job tracking)');
    console.log('📋 Extended tables:');
    console.log('   - proposals (added design_metadata JSONB column)');
    console.log('   - assets (added asset_metadata JSONB column)');
    console.log('   - templates (added design_system JSONB column)');

    // Verify the tables were created
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('graphic_assets', 'pdf_cache', 'generation_jobs')
      ORDER BY table_name
    `);

    if (tables.rows && tables.rows.length > 0) {
      console.log('\n✅ Verification: New tables exist');
      tables.rows.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️  Warning: Could not verify table creation');
    }

    // Verify column extensions
    const columns = await db.execute(sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND (
        (table_name = 'proposals' AND column_name = 'design_metadata')
        OR (table_name = 'assets' AND column_name = 'asset_metadata')
        OR (table_name = 'templates' AND column_name = 'design_system')
      )
      ORDER BY table_name, column_name
    `);

    if (columns.rows && columns.rows.length > 0) {
      console.log('\n✅ Verification: Column extensions exist');
      columns.rows.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name}.${row.column_name}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
