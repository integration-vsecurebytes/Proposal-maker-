import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { GenerateOptions, LATEST_STABLE_MODELS } from '@proposal-gen/shared';

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey || process.env.GOOGLE_AI_API_KEY || '');
  }

  async generateText(
    prompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const modelName = options?.model || LATEST_STABLE_MODELS.gemini.pro;

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 8192,
        temperature: options?.temperature || 0.7,
      },
    });

    const response = result.response;
    return response.text();
  }

  async generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
    const model = this.client.getGenerativeModel({
      model: LATEST_STABLE_MODELS.gemini.pro,
      systemInstruction: systemPrompt + '\n\nRespond with valid JSON only.',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback: try to clean and parse
      const cleaned = this.cleanJSONResponse(response);
      return JSON.parse(cleaned);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({
      model: LATEST_STABLE_MODELS.gemini.embedding,
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({
      model: LATEST_STABLE_MODELS.gemini.embedding,
    });

    // Generate embeddings for all texts
    const embeddings: number[][] = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      embeddings.push(result.embedding.values);
    }

    return embeddings;
  }

  async generateDiagram(description: string): Promise<string> {
    const prompt = `Generate a Mermaid diagram for: ${description}

Return ONLY the Mermaid code starting with the diagram type (graph TD, flowchart LR, gantt, sequenceDiagram, etc).
No markdown code blocks, no explanations, just the raw Mermaid code.`;

    const systemPrompt =
      'You are a technical architect. Generate clean, professional Mermaid diagrams using latest Mermaid syntax.';

    return this.generateText(prompt, systemPrompt, {
      temperature: 0.3,
    });
  }
}
