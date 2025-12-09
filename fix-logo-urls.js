// Script to fix old localhost:4000 URLs in the database
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');

async function fixLogoUrls() {
  const pool = new Pool({
    connectionString: 'postgresql://edurag:edurag_secure_password_2024@localhost:5433/proposals'
  });

  const db = drizzle(pool);

  try {
    console.log('Fixing logo URLs in database...');

    // Fix companyLogo URLs
    const result1 = await db.execute(sql`
      UPDATE branding
      SET "companyLogo" = REPLACE("companyLogo", 'http://localhost:4000', '')
      WHERE "companyLogo" LIKE '%localhost:4000%'
    `);
    console.log('Fixed companyLogo URLs:', result1.rowCount || 0);

    // Fix clientLogo URLs
    const result2 = await db.execute(sql`
      UPDATE branding
      SET "clientLogo" = REPLACE("clientLogo", 'http://localhost:4000', '')
      WHERE "clientLogo" LIKE '%localhost:4000%'
    `);
    console.log('Fixed clientLogo URLs:', result2.rowCount || 0);

    // Fix header logo URLs
    const result3 = await db.execute(sql`
      UPDATE branding
      SET header = jsonb_set(
        header,
        '{logo}',
        to_jsonb(REPLACE(header->>'logo', 'http://localhost:4000', ''))
      )
      WHERE header->>'logo' LIKE '%localhost:4000%'
    `);
    console.log('Fixed header logo URLs:', result3.rowCount || 0);

    // Fix footer logo URLs
    const result4 = await db.execute(sql`
      UPDATE branding
      SET footer = jsonb_set(
        footer,
        '{logo}',
        to_jsonb(REPLACE(footer->>'logo', 'http://localhost:4000', ''))
      )
      WHERE footer->>'logo' LIKE '%localhost:4000%'
    `);
    console.log('Fixed footer logo URLs:', result4.rowCount || 0);

    console.log('✅ All URLs fixed successfully!');
  } catch (error) {
    console.error('Error fixing URLs:', error);
  } finally {
    await pool.end();
  }
}

fixLogoUrls();
