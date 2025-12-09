import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { proposals } from './src/db/schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/proposals');
const db = drizzle(client);

async function clearProposal() {
  const proposalId = 'db48eda0-1491-4d4a-913a-580a8606730e';

  await db
    .update(proposals)
    .set({
      generatedContent: null,
      status: 'awaiting_generation',
    })
    .where(eq(proposals.id, proposalId));

  console.log('Cleared generated content for proposal:', proposalId);
  process.exit(0);
}

clearProposal();
