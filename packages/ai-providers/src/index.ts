import { AIProvider as AIProviderType } from '@proposal-gen/shared';
import { AIProvider } from './base.ts';
import { GeminiProvider } from './gemini.ts';
import { OpenAIProvider } from './openai.ts';
import { GrokProvider } from './grok.ts';

export { AIProvider } from './base.ts';
export { GeminiProvider } from './gemini.ts';
export { OpenAIProvider } from './openai.ts';
export { GrokProvider } from './grok.ts';

/**
 * Factory function to create an AI provider instance
 * @param provider - The AI provider to use ('gemini', 'openai', or 'grok')
 * @param apiKey - Optional API key (will use env var if not provided)
 * @returns An instance of the requested AI provider
 */
export function createAIProvider(provider: AIProviderType, apiKey?: string): AIProvider {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'grok':
      return new GrokProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get the default AI provider (Gemini)
 * @returns A Gemini provider instance
 */
export function getDefaultProvider(): AIProvider {
  return new GeminiProvider();
}
