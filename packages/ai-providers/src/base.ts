import { GenerateOptions } from '@proposal-gen/shared';

export interface AIProvider {
  name: string;
  generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string>;
  generateJSON<T>(prompt: string, systemPrompt: string, schema?: any): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
  generateDiagram(description: string): Promise<string>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;

  abstract generateText(
    prompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string>;

  abstract generateJSON<T>(prompt: string, systemPrompt: string, schema?: any): Promise<T>;

  abstract generateEmbedding(text: string): Promise<number[]>;

  abstract generateDiagram(description: string): Promise<string>;

  protected cleanJSONResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code blocks
    if (cleaned.includes('```json')) {
      cleaned = cleaned.split('```json')[1].split('```')[0];
    } else if (cleaned.includes('```')) {
      cleaned = cleaned.split('```')[1].split('```')[0];
    }

    return cleaned.trim();
  }
}
