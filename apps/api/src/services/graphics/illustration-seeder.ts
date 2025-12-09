import { db } from '../../db';
import { sql } from 'drizzle-orm';

// Sample graphics data (in production, would fetch from unDraw API)
const SAMPLE_GRAPHICS = [
  {
    name: 'Team Collaboration',
    category: 'illustration',
    style: 'flat',
    tags: ['team', 'collaboration', 'meeting', 'work'],
    industry_tags: ['business', 'technology'],
    file_path: '/graphics/team-collaboration.svg',
    color_palette: [
      { color: '#3B82F6', percentage: 40 },
      { color: '#8B5CF6', percentage: 30 },
      { color: '#EC4899', percentage: 30 },
    ],
  },
  {
    name: 'Data Analytics',
    category: 'illustration',
    style: 'isometric',
    tags: ['data', 'analytics', 'charts', 'insights'],
    industry_tags: ['technology', 'finance'],
    file_path: '/graphics/data-analytics.svg',
    color_palette: [
      { color: '#10B981', percentage: 50 },
      { color: '#3B82F6', percentage: 50 },
    ],
  },
  {
    name: 'Rocket Launch',
    category: 'illustration',
    style: 'flat',
    tags: ['startup', 'launch', 'rocket', 'growth'],
    industry_tags: ['business', 'technology'],
    file_path: '/graphics/rocket-launch.svg',
    color_palette: [
      { color: '#F59E0B', percentage: 60 },
      { color: '#EF4444', percentage: 40 },
    ],
  },
  {
    name: 'Healthcare Professional',
    category: 'illustration',
    style: 'line',
    tags: ['doctor', 'medical', 'healthcare', 'professional'],
    industry_tags: ['healthcare'],
    file_path: '/graphics/healthcare-professional.svg',
    color_palette: [
      { color: '#06B6D4', percentage: 70 },
      { color: '#10B981', percentage: 30 },
    ],
  },
  {
    name: 'Education Online',
    category: 'illustration',
    style: 'flat',
    tags: ['education', 'learning', 'online', 'study'],
    industry_tags: ['education'],
    file_path: '/graphics/education-online.svg',
    color_palette: [
      { color: '#8B5CF6', percentage: 50 },
      { color: '#EC4899', percentage: 50 },
    ],
  },
  {
    name: 'E-commerce Shopping',
    category: 'illustration',
    style: '3d',
    tags: ['shopping', 'ecommerce', 'cart', 'online'],
    industry_tags: ['ecommerce', 'business'],
    file_path: '/graphics/ecommerce-shopping.svg',
    color_palette: [
      { color: '#F59E0B', percentage: 40 },
      { color: '#3B82F6', percentage: 60 },
    ],
  },
  {
    name: 'Marketing Strategy',
    category: 'illustration',
    style: 'flat',
    tags: ['marketing', 'strategy', 'planning', 'growth'],
    industry_tags: ['marketing', 'business'],
    file_path: '/graphics/marketing-strategy.svg',
    color_palette: [
      { color: '#EC4899', percentage: 50 },
      { color: '#F59E0B', percentage: 50 },
    ],
  },
  {
    name: 'Financial Growth',
    category: 'illustration',
    style: 'isometric',
    tags: ['finance', 'growth', 'investment', 'money'],
    industry_tags: ['finance', 'business'],
    file_path: '/graphics/financial-growth.svg',
    color_palette: [
      { color: '#10B981', percentage: 70 },
      { color: '#F59E0B', percentage: 30 },
    ],
  },
  {
    name: 'Real Estate Property',
    category: 'illustration',
    style: 'flat',
    tags: ['real estate', 'property', 'house', 'home'],
    industry_tags: ['real-estate'],
    file_path: '/graphics/real-estate-property.svg',
    color_palette: [
      { color: '#3B82F6', percentage: 60 },
      { color: '#10B981', percentage: 40 },
    ],
  },
  {
    name: 'Security Shield',
    category: 'icon',
    style: 'line',
    tags: ['security', 'protection', 'shield', 'safe'],
    industry_tags: ['technology', 'business'],
    file_path: '/graphics/security-shield.svg',
    color_palette: [
      { color: '#10B981', percentage: 100 },
    ],
  },
  {
    name: 'Cloud Computing',
    category: 'icon',
    style: 'flat',
    tags: ['cloud', 'computing', 'server', 'storage'],
    industry_tags: ['technology'],
    file_path: '/graphics/cloud-computing.svg',
    color_palette: [
      { color: '#3B82F6', percentage: 100 },
    ],
  },
  {
    name: 'Success Checkmark',
    category: 'icon',
    style: 'flat',
    tags: ['success', 'check', 'done', 'complete'],
    industry_tags: ['business'],
    file_path: '/graphics/success-checkmark.svg',
    color_palette: [
      { color: '#10B981', percentage: 100 },
    ],
  },
];

async function seedGraphics() {
  console.log('🌱 Starting graphics seeding...');

  try {
    // Check if graphics already exist
    const existingCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM graphic_assets`
    );

    const count = existingCount.rows && existingCount.rows.length > 0
      ? parseInt((existingCount.rows[0] as any)?.count || '0', 10)
      : 0;

    if (count > 0) {
      console.log(`ℹ️  Database already has ${count} graphics. Skipping seed.`);
      console.log('   To re-seed, first run: DELETE FROM graphic_assets;');
      return;
    }

    // Insert sample graphics
    let inserted = 0;
    for (const graphic of SAMPLE_GRAPHICS) {
      const searchText = [
        graphic.name,
        ...graphic.tags,
        ...graphic.industry_tags,
      ].join(' ');

      await db.execute(sql`
        INSERT INTO graphic_assets (
          name, category, style, tags, file_path, color_palette, industry_tags, search_vector
        )
        VALUES (
          ${graphic.name},
          ${graphic.category},
          ${graphic.style},
          ${JSON.stringify(graphic.tags)}::jsonb,
          ${graphic.file_path},
          ${JSON.stringify(graphic.color_palette)}::jsonb,
          ARRAY[${sql.raw(graphic.industry_tags.map((t) => `'${t}'`).join(','))}],
          to_tsvector('english', ${searchText})
        )
      `);

      inserted++;
      console.log(`   ✓ Inserted: ${graphic.name}`);
    }

    console.log(`\n✅ Successfully seeded ${inserted} graphics!`);
    console.log('\n📊 Summary:');
    console.log(`   - Illustrations: ${SAMPLE_GRAPHICS.filter((g) => g.category === 'illustration').length}`);
    console.log(`   - Icons: ${SAMPLE_GRAPHICS.filter((g) => g.category === 'icon').length}`);
    console.log(`   - Total: ${inserted}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export { seedGraphics };

// Run if called directly
seedGraphics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
