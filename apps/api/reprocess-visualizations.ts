import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { proposals } from './src/db/schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/proposals');
const db = drizzle(client);

/**
 * Parse visualizations (mind maps and charts) from AI-generated content
 */
function parseVisualizations(content: string): {
  cleanedContent: string;
  visualizations: Array<{ type: 'mermaid' | 'chart'; data: any }>;
} {
  const visualizations: Array<{ type: 'mermaid' | 'chart'; data: any }> = [];
  const lines = content.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line starts with JSON visualization block
    if (trimmed.startsWith('{"type":')) {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(trimmed);

        if (parsed.type === 'mermaid' && parsed.code) {
          visualizations.push({
            type: 'mermaid',
            data: { code: parsed.code },
          });
          // Skip this line (don't add to cleanedLines)
          continue;
        } else if (parsed.type === 'chart' && parsed.chartType && parsed.data) {
          visualizations.push({
            type: 'chart',
            data: {
              chartType: parsed.chartType,
              chartData: parsed.data,
            },
          });
          // Skip this line (don't add to cleanedLines)
          continue;
        }
      } catch (error) {
        console.warn('Failed to parse visualization JSON:', trimmed);
      }
    }

    // Keep this line
    cleanedLines.push(line);
  }

  return {
    cleanedContent: cleanedLines.join('\n').trim(),
    visualizations
  };
}

async function reprocessProposal(proposalId?: string) {
  try {
    // If proposalId provided, reprocess just that one, otherwise do all
    let proposalsToProcess;

    if (proposalId) {
      console.log(`Reprocessing proposal: ${proposalId}`);
      proposalsToProcess = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, proposalId));
    } else {
      console.log('Reprocessing ALL proposals with generated content...');
      proposalsToProcess = await db
        .select()
        .from(proposals);
    }

    if (proposalsToProcess.length === 0) {
      console.log('No proposals found to reprocess.');
      process.exit(0);
    }

    for (const proposal of proposalsToProcess) {
      if (!proposal.generatedContent) {
        console.log(`Skipping ${proposal.id} - no generated content`);
        continue;
      }

      const generatedContent = proposal.generatedContent as any;
      const sections = generatedContent.sections || {};

      let hasChanges = false;

      // Reprocess each section
      for (const [sectionId, sectionData] of Object.entries(sections) as [string, any][]) {
        if (!sectionData.content) continue;

        const { cleanedContent, visualizations } = parseVisualizations(sectionData.content);

        if (visualizations.length > 0) {
          console.log(`  Found ${visualizations.length} visualization(s) in section: ${sectionData.title}`);
          hasChanges = true;

          // Update section with cleaned content and extracted visualizations
          sections[sectionId] = {
            ...sectionData,
            content: cleanedContent,
            visualizations: visualizations,
          };
        }
      }

      if (hasChanges) {
        // Update proposal in database
        await db
          .update(proposals)
          .set({
            generatedContent: {
              ...generatedContent,
              sections,
            },
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposal.id));

        console.log(`✅ Updated proposal ${proposal.id}`);
      } else {
        console.log(`  No embedded visualizations found in ${proposal.id}`);
      }
    }

    console.log('\n✅ Reprocessing complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error reprocessing proposals:', error);
    process.exit(1);
  }
}

// Get proposal ID from command line args, or process all if not provided
const proposalId = process.argv[2];
reprocessProposal(proposalId);
