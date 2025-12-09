import { db } from '../../db';
import { documentChunks, winningProposals, proposals } from '../../db/schema';
import { embeddingService } from './embeddings';
import { eq, sql, desc } from 'drizzle-orm';

export interface SearchFilters {
  industry?: string;
  projectType?: string;
  minWinRate?: number;
  companySize?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: any;
  source: 'document_chunk' | 'winning_proposal';
}

/**
 * RAG Service
 * Handles vector similarity search and context retrieval
 */
export class RAGService {
  /**
   * Index a proposal by creating embeddings for its sections
   */
  async indexProposal(
    proposalId: string,
    sections: Array<{ type: string; content: string }>,
    metadata?: any
  ): Promise<void> {
    console.log(`Indexing proposal ${proposalId} with ${sections.length} sections...`);

    for (const section of sections) {
      if (!section.content || section.content.trim().length === 0) {
        continue;
      }

      try {
        // Generate embedding for section content
        const embedding = await embeddingService.generateEmbedding(section.content);

        // Store in database
        await db.insert(documentChunks).values({
          proposalId,
          sectionType: section.type,
          content: section.content,
          embedding,
          metadata: metadata || {},
          relevanceScore: null,
          usageCount: 0,
        });

        console.log(`✓ Indexed section: ${section.type}`);
      } catch (error) {
        console.error(`Failed to index section ${section.type}:`, error);
      }
    }

    console.log(`Proposal ${proposalId} indexing complete`);
  }

  /**
   * Index a winning proposal
   */
  async indexWinningProposal(data: {
    title: string;
    content: string;
    industry?: string;
    projectType?: string;
    winRate?: number;
    tags?: string[];
    companySize?: string;
    dealValue?: string;
    metadata?: any;
  }): Promise<string> {
    console.log(`Indexing winning proposal: ${data.title}...`);

    // Generate embedding for the entire proposal content
    const embedding = await embeddingService.generateEmbedding(data.content);

    // Insert into database
    const [winningProposal] = await db
      .insert(winningProposals)
      .values({
        title: data.title,
        content: data.content,
        industry: data.industry,
        projectType: data.projectType,
        embedding,
        winRate: data.winRate || null,
        tags: data.tags || [],
        companySize: data.companySize,
        dealValue: data.dealValue,
        metadata: data.metadata || {},
        timesReferenced: 0,
      })
      .returning();

    console.log(`✓ Winning proposal indexed: ${winningProposal.id}`);
    return winningProposal.id;
  }

  /**
   * Search for similar content using cosine similarity
   */
  async search(
    query: string,
    options: {
      topK?: number;
      filters?: SearchFilters;
      sources?: ('document_chunk' | 'winning_proposal')[];
      minSimilarity?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 5,
      filters = {},
      sources = ['document_chunk', 'winning_proposal'],
      minSimilarity = 0.5,
    } = options;

    console.log(`Searching for: "${query.substring(0, 50)}..." (topK: ${topK})`);

    // Generate embedding for query
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const queryVector = `[${queryEmbedding.join(',')}]`;

    const results: SearchResult[] = [];

    // Search in document chunks
    if (sources.includes('document_chunk')) {
      try {
        const chunkResults: any = await db.execute(sql`
          SELECT
            id,
            content,
            section_type,
            metadata,
            1 - (embedding <=> ${queryVector}::vector) as similarity
          FROM document_chunks
          WHERE 1 - (embedding <=> ${queryVector}::vector) > ${minSimilarity}
          ${filters.industry ? sql`AND metadata->>'industry' = ${filters.industry}` : sql``}
          ${filters.projectType ? sql`AND metadata->>'projectType' = ${filters.projectType}` : sql``}
          ORDER BY embedding <=> ${queryVector}::vector
          LIMIT ${topK}
        `);

        for (const row of chunkResults.rows || []) {
          results.push({
            id: row.id,
            content: row.content,
            similarity: parseFloat(row.similarity),
            metadata: row.metadata,
            source: 'document_chunk',
          });
        }

        console.log(`Found ${chunkResults.rows.length} chunk results`);
      } catch (error) {
        console.error('Error searching document chunks:', error);
      }
    }

    // Search in winning proposals
    if (sources.includes('winning_proposal')) {
      try {
        let winningQuery = sql`
          SELECT
            id,
            title,
            content,
            industry,
            project_type,
            win_rate,
            tags,
            company_size,
            deal_value,
            metadata,
            1 - (embedding <=> ${queryVector}::vector) as similarity
          FROM winning_proposals
          WHERE 1 - (embedding <=> ${queryVector}::vector) > ${minSimilarity}
        `;

        if (filters.industry) {
          winningQuery = sql`${winningQuery} AND industry = ${filters.industry}`;
        }

        if (filters.projectType) {
          winningQuery = sql`${winningQuery} AND project_type = ${filters.projectType}`;
        }

        if (filters.minWinRate) {
          winningQuery = sql`${winningQuery} AND win_rate >= ${filters.minWinRate}`;
        }

        if (filters.companySize) {
          winningQuery = sql`${winningQuery} AND company_size = ${filters.companySize}`;
        }

        winningQuery = sql`
          ${winningQuery}
          ORDER BY embedding <=> ${queryVector}::vector
          LIMIT ${topK}
        `;

        const winningResults: any = await db.execute(winningQuery);

        for (const row of winningResults.rows || []) {
          results.push({
            id: row.id,
            content: row.content,
            similarity: parseFloat(row.similarity),
            metadata: {
              title: row.title,
              industry: row.industry,
              projectType: row.project_type,
              winRate: row.win_rate,
              tags: row.tags,
              companySize: row.company_size,
              dealValue: row.deal_value,
              ...row.metadata,
            },
            source: 'winning_proposal',
          });
        }

        console.log(`Found ${winningResults.rows.length} winning proposal results`);
      } catch (error) {
        console.error('Error searching winning proposals:', error);
      }
    }

    // Sort all results by similarity and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);

    // Update usage counts
    for (const result of topResults) {
      try {
        if (result.source === 'document_chunk') {
          await db
            .update(documentChunks)
            .set({
              usageCount: sql`${documentChunks.usageCount} + 1`,
            })
            .where(eq(documentChunks.id, result.id));
        } else if (result.source === 'winning_proposal') {
          await db
            .update(winningProposals)
            .set({
              timesReferenced: sql`${winningProposals.timesReferenced} + 1`,
            })
            .where(eq(winningProposals.id, result.id));
        }
      } catch (error) {
        console.error('Failed to update usage count:', error);
      }
    }

    console.log(`Returning ${topResults.length} total results`);
    return topResults;
  }

  /**
   * Build context from search results for AI generation
   */
  buildContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return '';
    }

    let context = 'Relevant examples from past proposals:\n\n';

    searchResults.forEach((result, index) => {
      context += `Example ${index + 1} (similarity: ${(result.similarity * 100).toFixed(1)}%):\n`;

      if (result.source === 'winning_proposal' && result.metadata?.title) {
        context += `Title: ${result.metadata.title}\n`;
      }

      if (result.metadata?.industry) {
        context += `Industry: ${result.metadata.industry}\n`;
      }

      if (result.metadata?.winRate) {
        context += `Success Rate: ${result.metadata.winRate}%\n`;
      }

      context += `Content:\n${result.content}\n\n`;
      context += '---\n\n';
    });

    return context;
  }

  /**
   * Get statistics about indexed content
   */
  async getStats(): Promise<{
    totalChunks: number;
    totalWinningProposals: number;
    topIndustries: Array<{ industry: string; count: number }>;
    topProjectTypes: Array<{ projectType: string; count: number }>;
  }> {
    const [chunksCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documentChunks);

    const [winningCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(winningProposals);

    const industries: any = await db.execute(sql`
      SELECT industry, COUNT(*)::int as count
      FROM winning_proposals
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10
    `);

    const projectTypes: any = await db.execute(sql`
      SELECT project_type, COUNT(*)::int as count
      FROM winning_proposals
      WHERE project_type IS NOT NULL
      GROUP BY project_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      totalChunks: chunksCount?.count || 0,
      totalWinningProposals: winningCount?.count || 0,
      topIndustries: (industries.rows || []).map((r: any) => ({
        industry: r.industry,
        count: r.count,
      })),
      topProjectTypes: (projectTypes.rows || []).map((r: any) => ({
        projectType: r.project_type,
        count: r.count,
      })),
    };
  }
}

export const ragService = new RAGService();
