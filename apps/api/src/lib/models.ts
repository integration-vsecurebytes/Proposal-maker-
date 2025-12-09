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
    latest: 'grok-3', // Grok 3 (latest)
  },
} as const;
