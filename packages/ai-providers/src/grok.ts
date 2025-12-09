import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { GenerateOptions, LATEST_STABLE_MODELS } from '@proposal-gen/shared';

export class GrokProvider extends BaseAIProvider {
  name = 'grok';
  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({
      baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
      apiKey: apiKey || process.env.XAI_API_KEY,
    });
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const modelName = options?.model || LATEST_STABLE_MODELS.grok.latest;

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
    const response = await this.generateText(
      prompt + '\n\nRespond with valid JSON only.',
      systemPrompt,
      { maxTokens: 8000 }
    );

    const cleaned = this.cleanJSONResponse(response);
    return JSON.parse(cleaned);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Grok does not support embeddings. Use Gemini or OpenAI instead.');
  }

  async generateDiagram(description: string): Promise<string> {
    const prompt = `Generate a Mermaid diagram for: ${description}

Return ONLY the Mermaid code starting with the diagram type.
No markdown code blocks, no explanations, just the raw Mermaid code.

Use latest Mermaid syntax and make it professional and clear.`;

    const systemPrompt = `You are an expert technical architect specializing in diagram generation.
Generate clean, professional Mermaid diagrams using the latest syntax.`;

    return this.generateText(prompt, systemPrompt, {
      temperature: 0.3,
    });
  }
}
