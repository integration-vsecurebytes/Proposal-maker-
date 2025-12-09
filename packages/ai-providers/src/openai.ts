import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { GenerateOptions, LATEST_STABLE_MODELS } from '@proposal-gen/shared';

export class OpenAIProvider extends BaseAIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const modelName = options?.model || LATEST_STABLE_MODELS.openai.gpt4o;

    const response = await this.client.chat.completions.create({
      model: modelName,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: LATEST_STABLE_MODELS.openai.gpt4o,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\nRespond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
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
      input: texts, // OpenAI supports batch embedding
    });

    return response.data.map(item => item.embedding);
  }

  async generateDiagram(description: string): Promise<string> {
    const prompt = `Generate a Mermaid diagram for: ${description}

Return ONLY the Mermaid code. No markdown, no explanations.`;

    const systemPrompt = 'You are a technical architect. Generate clean Mermaid diagrams.';

    return this.generateText(prompt, systemPrompt, {
      temperature: 0.3,
    });
  }
}
