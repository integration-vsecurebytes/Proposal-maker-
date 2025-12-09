export type AIProvider = 'gemini' | 'openai' | 'grok';

export interface AIConfig {
  providers: {
    content: {
      provider: AIProvider;
      model: string;
      fallback?: {
        provider: AIProvider;
        model: string;
      };
    };
    qa: {
      provider: AIProvider;
      model: string;
    };
    embeddings: {
      provider: 'gemini' | 'openai';
      model: string;
    };
    diagrams: {
      provider: AIProvider;
      model: string;
    };
  };
  enableFallback: boolean;
  retryOnError: boolean;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

// Latest stable AI models (December 2024)
export const LATEST_STABLE_MODELS = {
  gemini: {
    pro: 'gemini-2.5-pro', // Gemini 2.5 Pro
    flash: 'gemini-2.5-flash', // Gemini 2.5 Flash (faster responses)
    embedding: 'text-embedding-004', // Latest embedding model
  },
  openai: {
    gpt4: 'gpt-4o', // GPT-4o (stable, latest and most capable)
    gpt4o: 'gpt-4o', // GPT-4o (stable, multimodal)
    embedding: 'text-embedding-3-large', // Best embedding quality
  },
  grok: {
    latest: 'grok-2-1212', // Grok 2 (stable, December 12, 2024 - latest)
  },
} as const;
