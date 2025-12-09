import { createAIProvider } from '../../lib/ai-provider';
import { LATEST_STABLE_MODELS } from '../../lib/models';

/**
 * Embedding Service
 * Generates vector embeddings for text using AI providers
 */
export class EmbeddingService {
  private primaryProvider: any;
  private fallbackProvider: any;

  constructor() {
    // Use Gemini text-embedding-004 as primary
    this.primaryProvider = createAIProvider('gemini', LATEST_STABLE_MODELS.gemini.embedding);
    // Use OpenAI text-embedding-3-large as fallback
    this.fallbackProvider = createAIProvider('openai', LATEST_STABLE_MODELS.openai.embedding);
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      // Try primary provider (Gemini)
      const embedding = await this.primaryProvider.generateEmbedding(text);
      return embedding;
    } catch (error) {
      console.error('Primary embedding provider failed, using fallback:', error);

      try {
        // Fallback to OpenAI
        const embedding = await this.fallbackProvider.generateEmbedding(text);
        return embedding;
      } catch (fallbackError) {
        console.error('Fallback embedding provider also failed:', fallbackError);
        throw new Error('Failed to generate embedding with all providers');
      }
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generateEmbedding multiple times
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);

    if (validTexts.length === 0) {
      return [];
    }

    try {
      // Try batch generation with primary provider
      const embeddings = await this.primaryProvider.generateEmbeddings(validTexts);
      return embeddings;
    } catch (error) {
      console.error('Batch embedding failed, falling back to individual generation:', error);

      // Fallback: generate one by one
      const embeddings: number[][] = [];
      for (const text of validTexts) {
        try {
          const embedding = await this.generateEmbedding(text);
          embeddings.push(embedding);
        } catch (err) {
          console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, err);
          // Use zero vector as placeholder for failed embeddings (768 dimensions for Gemini)
          embeddings.push(new Array(768).fill(0));
        }
      }
      return embeddings;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Chunk text into smaller pieces for embedding
   * Useful for long documents
   */
  chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]\s+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        // Add overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5)); // Approximate word count
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

export const embeddingService = new EmbeddingService();
