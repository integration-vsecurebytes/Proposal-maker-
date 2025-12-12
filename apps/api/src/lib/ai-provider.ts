import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { LATEST_STABLE_MODELS } from './models';

/**
 * Simplified AI Provider - Local implementation
 * Avoids ESM module issues by keeping everything in the API package
 */

export type AIProviderType = 'gemini' | 'openai' | 'grok';

export interface GenerateTextOptions {
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string, options?: GenerateTextOptions): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string, systemPrompt?: string, options?: GenerateTextOptions): Promise<string> {
    const generationConfig: any = {};

    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }
    if (options?.temperature !== undefined) {
      generationConfig.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = options.maxTokens;
    }

    const model = this.client.getGenerativeModel({
      model: LATEST_STABLE_MODELS.gemini.pro,
      systemInstruction: systemPrompt,
      generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({
      model: LATEST_STABLE_MODELS.gemini.embedding,
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt: string, systemPrompt?: string, options?: GenerateTextOptions): Promise<string> {
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const requestOptions: any = {
      model: LATEST_STABLE_MODELS.openai.gpt4o,
      messages,
    };

    if (options?.jsonMode) {
      requestOptions.response_format = { type: 'json_object' };
    }
    if (options?.temperature !== undefined) {
      requestOptions.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      requestOptions.max_tokens = options.maxTokens;
    }

    const completion = await this.client.chat.completions.create(requestOptions);

    return completion.choices[0]?.message?.content || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: LATEST_STABLE_MODELS.openai.embedding,
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: LATEST_STABLE_MODELS.openai.embedding,
      input: texts,
    });

    return response.data.map(item => item.embedding);
  }
}

class GrokProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI_API_KEY is required for Grok');
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async generateText(prompt: string, systemPrompt?: string, options?: GenerateTextOptions): Promise<string> {
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const requestOptions: any = {
      model: LATEST_STABLE_MODELS.grok.latest,
      messages,
    };

    if (options?.jsonMode) {
      requestOptions.response_format = { type: 'json_object' };
    }
    if (options?.temperature !== undefined) {
      requestOptions.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      requestOptions.max_tokens = options.maxTokens;
    }

    const completion = await this.client.chat.completions.create(requestOptions);

    return completion.choices[0]?.message?.content || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Grok does not support embeddings. Use Gemini or OpenAI.');
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    throw new Error('Grok does not support embeddings. Use Gemini or OpenAI.');
  }
}

/**
 * Factory function to create an AI provider instance
 */
export function createAIProvider(provider: AIProviderType, modelOverride?: string): AIProvider {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'grok':
      return new GrokProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get the default AI provider (Gemini)
 */
export function getDefaultProvider(): AIProvider {
  return new GeminiProvider();
}
