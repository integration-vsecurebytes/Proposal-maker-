# 🚀 COMPLETE PROPOSAL GENERATION SYSTEM - CLAUDE CLI PROJECT PROMPT

## PROJECT OVERVIEW

Build an end-to-end AI-powered proposal generation system with:
- **RAG** (Retrieval Augmented Generation) using PostgreSQL + pgvector
- **Multi-Model AI** support (Claude, GPT-4, Gemini, Grok)
- **Interactive Q&A** to gather proposal requirements
- **Template-based generation** matching exact document designs
- **Dynamic diagrams** (Mermaid) and **tables** charts and grphsa
- **DOCX/PDF export** with professional formatting

---

## CLAUDE CLI MASTER PROMPT

Copy and paste this into Claude CLI to start the project:

```
claude --chat

You are building a complete AI-powered Proposal Generation System. This is a full-stack application with the following architecture:

## TECH STACK

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL 16 with pgvector extension
- **ORM**: Drizzle ORM or Prisma
- **Vector Store**: pgvector for RAG embeddings
- **Queue**: BullMQ with Redis for async jobs

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand or React Query
- **Editor**: TipTap or Slate.js for rich text
- **Diagrams**: Mermaid.js for flowcharts

### AI Models (Multi-Provider)
- **Claude** (Anthropic) - Primary for proposal generation
- **GPT-4** (OpenAI) - Fallback and comparison
- **Gemini** (Google) - Alternative option
- **Grok** (xAI) - For diagram generation

### Document Generation
- **docx** - Word document creation
- **pdfkit** or **puppeteer** - PDF generation
- **sharp** - Image processing

---

## PROJECT STRUCTURE

Create this folder structure:

```
proposal-generator/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── chat/       # Interactive Q&A chat
│   │   │   │   ├── editor/     # Proposal editor
│   │   │   │   ├── preview/    # Live preview
│   │   │   │   ├── templates/  # Template selector
│   │   │   │   └── ui/         # shadcn components
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   └── stores/
│   │   └── package.json
│   │
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   │   ├── ai/         # Multi-model AI service
│       │   │   ├── rag/        # RAG pipeline
│       │   │   ├── templates/  # Template engine
│       │   │   └── documents/  # DOCX/PDF generation
│       │   ├── db/
│       │   │   ├── schema.ts
│       │   │   └── migrations/
│       │   └── lib/
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types and schemas
│   │   ├── src/
│   │   │   ├── types/
│   │   │   └── schemas/
│   │   └── package.json
│   │
│   └── ai-providers/           # AI model abstraction
│       ├── src/
│       │   ├── claude.ts
│       │   ├── openai.ts
│       │   ├── gemini.ts
│       │   ├── grok.ts
│       │   └── index.ts
│       └── package.json
│
├── templates/                  # Proposal templates
│   ├── linkfields/
│   │   ├── schema.json
│   │   ├── styles.json
│   │   └── assets/
│   ├── enterprise/
│   └── minimal/
│
├── docker-compose.yml
├── package.json
└── turbo.json
```

---

## PHASE 1: DATABASE SETUP

### 1.1 PostgreSQL with pgvector

Create `apps/api/src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid, vector, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

// Templates table
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  schema: jsonb('schema').notNull(), // TemplateSchema JSON
  styles: jsonb('styles').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Proposals table
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id),
  clientName: text('client_name').notNull(),
  clientCompany: text('client_company').notNull(),
  projectTitle: text('project_title').notNull(),
  projectType: text('project_type'),
  scope: text('scope'),
  objectives: text('objectives'),
  budget: text('budget'),
  timeline: text('timeline'),
  technologies: jsonb('technologies').$type<string[]>(),
  generatedContent: jsonb('generated_content'),
  status: text('status').default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// RAG: Document chunks for retrieval
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embeddings
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RAG: Winning proposals index
export const winningProposals = pgTable('winning_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  industry: text('industry'),
  projectType: text('project_type'),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  winRate: integer('win_rate'), // percentage
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Conversation history for interactive Q&A
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  messages: jsonb('messages').$type<Array<{role: string, content: string}>>(),
  extractedData: jsonb('extracted_data'),
  isComplete: boolean('is_complete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// User feedback for learning
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type'),
  rating: integer('rating'), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 1.2 Vector Index Migration

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector indexes for similarity search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON winning_proposals USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## PHASE 2: AI PROVIDER ABSTRACTION

### 2.1 Multi-Model Interface

Create `packages/ai-providers/src/index.ts`:

```typescript
export interface AIProvider {
  name: string;
  generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string>;
  generateJSON<T>(prompt: string, systemPrompt: string, schema?: any): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
  generateDiagram(description: string): Promise<string>;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

// Factory function
export function createAIProvider(provider: 'claude' | 'openai' | 'gemini' | 'grok'): AIProvider {
  switch (provider) {
    case 'claude': return new ClaudeProvider();
    case 'openai': return new OpenAIProvider();
    case 'gemini': return new GeminiProvider();
    case 'grok': return new GrokProvider();
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### 2.2 Claude Provider

Create `packages/ai-providers/src/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, GenerateOptions } from './index';

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
    const response = await this.generateText(
      prompt + '\n\nRespond with valid JSON only.',
      systemPrompt,
      { maxTokens: 8000 }
    );

    // Clean and parse JSON
    let cleaned = response;
    if (cleaned.includes('```json')) {
      cleaned = cleaned.split('```json')[1].split('```')[0];
    } else if (cleaned.includes('```')) {
      cleaned = cleaned.split('```')[1].split('```')[0];
    }

    return JSON.parse(cleaned.trim());
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Claude doesn't have embeddings, use OpenAI for this
    throw new Error('Use OpenAI for embeddings');
  }

  async generateDiagram(description: string): Promise<string> {
    const prompt = `Generate a Mermaid diagram for: ${description}
    
Return ONLY the Mermaid code starting with the diagram type (graph TD, flowchart LR, etc).
No markdown, no explanation.`;

    return this.generateText(prompt, 'You are a technical architect. Generate clean Mermaid diagrams.');
  }
}
```

### 2.3 OpenAI Provider (for embeddings + GPT-4)

Create `packages/ai-providers/src/openai.ts`:

```typescript
import OpenAI from 'openai';
import { AIProvider, GenerateOptions } from './index';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      max_tokens: options?.maxTokens || 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\nRespond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateDiagram(description: string): Promise<string> {
    return this.generateText(
      `Generate a Mermaid diagram for: ${description}\n\nReturn ONLY the Mermaid code.`,
      'You are a technical architect.'
    );
  }
}
```

### 2.4 Gemini Provider

Create `packages/ai-providers/src/gemini.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, GenerateOptions } from './index';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: options?.model || 'gemini-pro',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateJSON<T>(prompt: string, systemPrompt: string): Promise<T> {
    const response = await this.generateText(
      prompt + '\n\nRespond with valid JSON only.',
      systemPrompt
    );

    let cleaned = response;
    if (cleaned.includes('```json')) {
      cleaned = cleaned.split('```json')[1].split('```')[0];
    }

    return JSON.parse(cleaned.trim());
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateDiagram(description: string): Promise<string> {
    return this.generateText(
      `Generate a Mermaid diagram for: ${description}\n\nReturn ONLY the Mermaid code.`,
      'You are a technical architect.'
    );
  }
}
```

### 2.5 Grok Provider

Create `packages/ai-providers/src/grok.ts`:

```typescript
import OpenAI from 'openai';
import { AIProvider, GenerateOptions } from './index';

export class GrokProvider implements AIProvider {
  name = 'grok';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    });
  }

  async generateText(prompt: string, systemPrompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'grok-2-latest',
      max_tokens: options?.maxTokens || 4096,
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

    let cleaned = response;
    if (cleaned.includes('```json')) {
      cleaned = cleaned.split('```json')[1].split('```')[0];
    }

    return JSON.parse(cleaned.trim());
  }

  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Grok does not support embeddings, use OpenAI');
  }

  async generateDiagram(description: string): Promise<string> {
    return this.generateText(
      `Generate a Mermaid diagram for: ${description}\n\nReturn ONLY the Mermaid code.`,
      'You are a technical architect. Generate clean, professional Mermaid diagrams.'
    );
  }
}
```

---

## PHASE 3: RAG PIPELINE

### 3.1 RAG Service

Create `apps/api/src/services/rag/index.ts`:

```typescript
import { db } from '../../db';
import { documentChunks, winningProposals } from '../../db/schema';
import { cosineDistance, desc, sql } from 'drizzle-orm';
import { createAIProvider } from '@proposal-gen/ai-providers';

const openai = createAIProvider('openai'); // For embeddings

export interface RAGContext {
  relevantChunks: Array<{
    content: string;
    sectionType: string;
    similarity: number;
  }>;
  winningExamples: Array<{
    title: string;
    content: string;
    industry: string;
    similarity: number;
  }>;
}

export class RAGService {
  // Index a new document chunk
  async indexChunk(proposalId: string, sectionType: string, content: string, metadata?: any) {
    const embedding = await openai.generateEmbedding(content);

    await db.insert(documentChunks).values({
      proposalId,
      sectionType,
      content,
      embedding,
      metadata,
    });
  }

  // Index a winning proposal
  async indexWinningProposal(title: string, content: string, industry: string, projectType: string, winRate: number) {
    const embedding = await openai.generateEmbedding(content);

    await db.insert(winningProposals).values({
      title,
      content,
      industry,
      projectType,
      embedding,
      winRate,
    });
  }

  // Retrieve relevant context
  async retrieveContext(query: string, limit: number = 5): Promise<RAGContext> {
    const queryEmbedding = await openai.generateEmbedding(query);

    // Get relevant chunks
    const chunks = await db
      .select({
        content: documentChunks.content,
        sectionType: documentChunks.sectionType,
        similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(documentChunks)
      .orderBy(desc(sql`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`))
      .limit(limit);

    // Get winning examples
    const examples = await db
      .select({
        title: winningProposals.title,
        content: winningProposals.content,
        industry: winningProposals.industry,
        similarity: sql<number>`1 - (${winningProposals.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(winningProposals)
      .orderBy(desc(sql`1 - (${winningProposals.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`))
      .limit(3);

    return {
      relevantChunks: chunks,
      winningExamples: examples,
    };
  }

  // Build context string for AI prompt
  buildContextPrompt(context: RAGContext): string {
    let prompt = '';

    if (context.relevantChunks.length > 0) {
      prompt += '\n## RELEVANT CONTEXT FROM PAST PROPOSALS:\n';
      context.relevantChunks.forEach((chunk, i) => {
        prompt += `\n### Example ${i + 1} (${chunk.sectionType}):\n${chunk.content}\n`;
      });
    }

    if (context.winningExamples.length > 0) {
      prompt += '\n## WINNING PROPOSAL EXAMPLES:\n';
      context.winningExamples.forEach((ex, i) => {
        prompt += `\n### ${ex.title} (${ex.industry}):\n${ex.content.substring(0, 500)}...\n`;
      });
    }

    return prompt;
  }
}

export const ragService = new RAGService();
```

---

## PHASE 4: INTERACTIVE Q&A SYSTEM

### 4.1 Conversation Service

Create `apps/api/src/services/conversation/index.ts`:

```typescript
import { db } from '../../db';
import { conversations, proposals } from '../../db/schema';
import { createAIProvider } from '@proposal-gen/ai-providers';
import { eq } from 'drizzle-orm';

const claude = createAIProvider('claude');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedData {
  clientName?: string;
  clientCompany?: string;
  projectTitle?: string;
  projectType?: string;
  scope?: string;
  objectives?: string;
  budget?: string;
  timeline?: string;
  technologies?: string[];
  industry?: string;
  teamSize?: number;
  integrations?: string[];
  painPoints?: string[];
  successCriteria?: string[];
}

const CONVERSATION_SYSTEM_PROMPT = `You are an expert proposal consultant gathering requirements for a business proposal.

Your goal is to have a natural conversation to extract ALL the information needed to generate a comprehensive proposal.

## INFORMATION TO GATHER:

### REQUIRED (Must have before proposal can be generated):
1. **Client Information**: Company name, contact person, industry
2. **Project Title**: Clear, descriptive title
3. **Project Type**: Software development, consulting, implementation, etc.
4. **Scope**: What needs to be built/delivered
5. **Objectives**: Business goals and expected outcomes
6. **Budget Range**: Approximate budget or "TBD"
7. **Timeline**: Expected duration or deadlines

### IMPORTANT (Ask about these):
8. **Technologies**: Preferred tech stack or platforms
9. **Team Size**: How many users/stakeholders
10. **Integrations**: Existing systems to integrate with
11. **Pain Points**: Current challenges they face
12. **Success Criteria**: How will success be measured

## CONVERSATION RULES:

1. Start with a warm greeting and ask about their project
2. Ask ONE question at a time (don't overwhelm)
3. Acknowledge their answers before asking the next question
4. Use their previous answers to ask relevant follow-up questions
5. Summarize what you've learned periodically
6. When you have enough information, confirm with a summary
7. If they're vague, ask clarifying questions

## RESPONSE FORMAT:

After gathering enough information, output a JSON block with extracted data:

\`\`\`json
{
  "status": "complete" | "gathering",
  "nextQuestion": "Your next question here",
  "extractedData": {
    "clientName": "...",
    "clientCompany": "...",
    // ... all extracted fields
  },
  "missingRequired": ["field1", "field2"],
  "conversationSummary": "Brief summary of what you know"
}
\`\`\`

Be conversational and helpful. Make it feel like talking to a human consultant, not filling out a form.`;

export class ConversationService {
  async startConversation(proposalId: string): Promise<{ conversationId: string; message: string }> {
    const result = await db.insert(conversations).values({
      proposalId,
      messages: [],
      extractedData: {},
      isComplete: false,
    }).returning();

    const conversationId = result[0].id;

    const openingMessage = `Hello! I'm here to help you create a winning proposal. 

I'll ask you a few questions to understand your project better. Let's start with the basics:

**What's the name of the company or client you're creating this proposal for?**`;

    // Save the opening message
    await this.addMessage(conversationId, 'assistant', openingMessage);

    return { conversationId, message: openingMessage };
  }

  async chat(conversationId: string, userMessage: string): Promise<{
    message: string;
    isComplete: boolean;
    extractedData: ExtractedData;
  }> {
    // Get conversation history
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conv) throw new Error('Conversation not found');

    // Add user message
    const messages = [...(conv.messages as Message[]), { role: 'user' as const, content: userMessage }];

    // Build conversation context
    const conversationContext = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Get AI response
    const response = await claude.generateJSON<{
      status: 'complete' | 'gathering';
      nextQuestion: string;
      extractedData: ExtractedData;
      missingRequired: string[];
      conversationSummary: string;
    }>(
      `Conversation so far:\n\n${conversationContext}\n\nContinue the conversation to gather proposal requirements.`,
      CONVERSATION_SYSTEM_PROMPT
    );

    // Update conversation in database
    const updatedMessages = [...messages, { role: 'assistant' as const, content: response.nextQuestion }];
    
    await db.update(conversations)
      .set({
        messages: updatedMessages,
        extractedData: response.extractedData,
        isComplete: response.status === 'complete',
      })
      .where(eq(conversations.id, conversationId));

    // If complete, update the proposal with extracted data
    if (response.status === 'complete' && conv.proposalId) {
      await db.update(proposals)
        .set({
          clientName: response.extractedData.clientName,
          clientCompany: response.extractedData.clientCompany,
          projectTitle: response.extractedData.projectTitle,
          projectType: response.extractedData.projectType,
          scope: response.extractedData.scope,
          objectives: response.extractedData.objectives,
          budget: response.extractedData.budget,
          timeline: response.extractedData.timeline,
          technologies: response.extractedData.technologies,
        })
        .where(eq(proposals.id, conv.proposalId));
    }

    return {
      message: response.nextQuestion,
      isComplete: response.status === 'complete',
      extractedData: response.extractedData,
    };
  }

  private async addMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (conv) {
      const messages = [...(conv.messages as Message[]), { role, content }];
      await db.update(conversations)
        .set({ messages })
        .where(eq(conversations.id, conversationId));
    }
  }
}

export const conversationService = new ConversationService();
```

---

## PHASE 5: TEMPLATE-BASED GENERATION

### 5.1 Template Engine

Create `apps/api/src/services/templates/index.ts`:

```typescript
import { db } from '../../db';
import { templates } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface TemplateSchema {
  template_name: string;
  style: 'formal' | 'modern' | 'creative' | 'minimal';
  branding: {
    primary_color: string;
    secondary_color: string;
    heading_font: string;
    body_font: string;
  };
  sections: Array<{
    order: number;
    id: string;
    number?: string;
    title: string;
    type: 'heading1' | 'heading2' | 'heading3' | 'special' | 'auto_generated';
    content_type?: 'paragraphs' | 'bullets' | 'table' | 'mixed';
    has_subsections?: boolean;
    required?: boolean;
    purpose?: string;
  }>;
  table_styles: {
    header_bg_color: string;
    header_text_color: string;
    alternating_rows: boolean;
  };
  signature_block?: {
    required: boolean;
    parties: number;
    copies_per_party: number;
  };
}

// Predefined templates
export const LINKFIELDS_TEMPLATE: TemplateSchema = {
  template_name: "Linkfields IT Proposal",
  style: "formal",
  branding: {
    primary_color: "#F7941D",
    secondary_color: "#0066B3",
    heading_font: "Arial",
    body_font: "Arial"
  },
  sections: [
    { order: 1, id: "cover_page", title: "Cover Page", type: "special", required: true },
    { order: 2, id: "toc", title: "Table of Contents", type: "auto_generated", required: true },
    { order: 3, id: "executive_summary", number: "1", title: "Executive Summary", type: "heading1", content_type: "mixed", required: true },
    { order: 4, id: "scope", number: "2", title: "Scope of the Project", type: "heading1", has_subsections: true, content_type: "bullets", required: true },
    { order: 5, id: "solution_overview", number: "3", title: "Solution Overview", type: "heading1", has_subsections: true, content_type: "mixed", required: true },
    { order: 6, id: "delivery_framework", number: "4", title: "Delivery Framework", type: "heading1", content_type: "bullets", required: true },
    { order: 7, id: "work_breakdown", number: "5", title: "Work Breakdown Structure", type: "heading1", content_type: "mixed", required: true },
    { order: 8, id: "pricing", number: "6", title: "Pricing", type: "heading1", content_type: "table", required: true },
    { order: 9, id: "payment_schedule", number: "6.2", title: "Payment Schedule", type: "heading2", content_type: "table", required: true },
    { order: 10, id: "governance", number: "7", title: "Governance and Risk Management", type: "heading1", content_type: "mixed", required: true },
    { order: 11, id: "assumptions", number: "8", title: "Assumptions", type: "heading1", content_type: "bullets", required: true },
    { order: 12, id: "customer_obligations", number: "9", title: "Customer Obligations", type: "heading1", content_type: "bullets", required: true },
    { order: 13, id: "acceptance", number: "10", title: "Acceptance", type: "heading1", content_type: "table", required: true },
    { order: 14, id: "legal", number: "11", title: "Legal Notices", type: "heading1", has_subsections: true, content_type: "paragraphs", required: true }
  ],
  table_styles: {
    header_bg_color: "#F7941D",
    header_text_color: "#FFFFFF",
    alternating_rows: true
  },
  signature_block: {
    required: true,
    parties: 2,
    copies_per_party: 2
  }
};

export class TemplateService {
  async getTemplate(slug: string): Promise<TemplateSchema | null> {
    // Check database first
    const dbTemplate = await db.query.templates.findFirst({
      where: eq(templates.slug, slug),
    });

    if (dbTemplate) {
      return dbTemplate.schema as TemplateSchema;
    }

    // Fall back to predefined templates
    const predefined: Record<string, TemplateSchema> = {
      linkfields: LINKFIELDS_TEMPLATE,
      // Add more predefined templates
    };

    return predefined[slug] || null;
  }

  async saveTemplate(name: string, slug: string, schema: TemplateSchema) {
    await db.insert(templates).values({
      name,
      slug,
      schema,
      styles: schema.branding,
    });
  }

  async listTemplates() {
    return db.query.templates.findMany({
      where: eq(templates.isActive, true),
    });
  }
}

export const templateService = new TemplateService();
```

---

## PHASE 6: PROPOSAL GENERATION SERVICE

### 6.1 Main Generation Service

Create `apps/api/src/services/proposal/generator.ts`:

```typescript
import { createAIProvider } from '@proposal-gen/ai-providers';
import { ragService } from '../rag';
import { templateService, TemplateSchema } from '../templates';
import { db } from '../../db';
import { proposals } from '../../db/schema';
import { eq } from 'drizzle-orm';

const claude = createAIProvider('claude');
const grok = createAIProvider('grok');

// Universal system prompt for proposal generation
const PROPOSAL_SYSTEM_PROMPT = `You are an Expert Proposal Generator. Generate professional proposal content in JSON format that matches the provided template structure exactly.

## OUTPUT RULES
1. Output ONLY valid JSON - no markdown, no explanations
2. Follow the template section structure exactly
3. Generate professional, specific content
4. All arrays must have at least 3 items
5. Percentages must sum to 100%

## SECTION CONTENT RULES

### EXECUTIVE SUMMARY
- problem_statement: 2-3 sentences on client's challenge
- solution_overview: 2-3 sentences on proposed solution
- technologies: Array of "Technology - description" strings

### SCOPE OF PROJECT
- sections: Array of {number, title, items[]}
- Items can be strings OR {main, sub[]} for nested lists
- out_of_scope: Array of exclusions (3-5 items)

### SOLUTION OVERVIEW
- components: Array of {number, title, key_components[], technical_flow[]}

### DELIVERY FRAMEWORK
Always include 7 phases: Analysis, Design, Development, Testing, Training, Deployment, Support
Each phase: {name, points[]} with 2-4 bullet points

### WORK BREAKDOWN
- phases: Array of {phase_number, phase_name, activities[], deliverables[]}

### PRICING
{
  "currency": "R|$|€|£",
  "items": [{phase, duration, amount}],
  "total": "X,XXX,XXX",
  "notes": "Excluding VAT..."
}

### PAYMENT SCHEDULE
{
  "milestones": [
    {id: "M1", description: "Discovery and Design", percentage: 30},
    {id: "M2", description: "Development", percentage: 40},
    {id: "M3", description: "Testing", percentage: 20},
    {id: "M4", description: "Deployment", percentage: 10}
  ]
}

### GOVERNANCE & RISKS
{
  "intro": "Governance paragraph...",
  "governance_points": [{title, description}],
  "risks": [{risk, mitigation}]
}

### ASSUMPTIONS
Array of 10-15 strings

### CUSTOMER OBLIGATIONS
Array of 7-10 client responsibilities

### LEGAL SECTIONS
{
  "client_info": "...",
  "limitation_of_scope": "...",
  "confidentiality": "...",
  "legal_notice": "..."
}`;

export interface GeneratedContent {
  metadata: {
    client_name: string;
    company_name: string;
    project_title: string;
    date: string;
  };
  executive_summary: {
    problem_statement: string;
    solution_overview: string;
    technologies: string[];
  };
  scope: {
    sections: Array<{ number: string; title: string; items: any[] }>;
    out_of_scope: string[];
  };
  solution_overview: {
    components: Array<{
      number: string;
      title: string;
      key_components: string[];
      technical_flow?: string[];
    }>;
  };
  delivery_framework: {
    phases: Array<{ name: string; points: string[] }>;
  };
  work_breakdown: {
    phases: Array<{
      phase_number: string;
      phase_name: string;
      activities: string[];
      deliverables: string[];
    }>;
  };
  pricing: {
    currency: string;
    items: Array<{ phase: string; duration: string; amount: string }>;
    total: string;
    notes: string;
  };
  payment_schedule: {
    milestones: Array<{ id: string; description: string; percentage: number }>;
  };
  governance: {
    intro: string;
    governance_points: Array<{ title: string; description: string }>;
    risks: Array<{ risk: string; mitigation: string }>;
  };
  assumptions: string[];
  customer_obligations: string[];
  legal: {
    client_info: string;
    limitation_of_scope: string;
    confidentiality: string;
    legal_notice: string;
  };
  diagrams?: {
    architecture?: string;
    flow?: string;
    timeline?: string;
  };
}

export class ProposalGeneratorService {
  async generate(
    proposalId: string,
    templateSlug: string = 'linkfields',
    useRAG: boolean = true
  ): Promise<GeneratedContent> {
    // Get proposal data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    });

    if (!proposal) throw new Error('Proposal not found');

    // Get template
    const template = await templateService.getTemplate(templateSlug);
    if (!template) throw new Error('Template not found');

    // Get RAG context
    let ragContext = '';
    if (useRAG) {
      const context = await ragService.retrieveContext(
        `${proposal.projectTitle} ${proposal.scope} ${proposal.objectives}`
      );
      ragContext = ragService.buildContextPrompt(context);
    }

    // Build generation prompt
    const userPrompt = `GENERATE PROPOSAL:

TEMPLATE SCHEMA:
${JSON.stringify(template, null, 2)}

PROJECT DETAILS:
- Client Company: ${proposal.clientCompany}
- Client Contact: ${proposal.clientName}
- Project Title: ${proposal.projectTitle}
- Project Type: ${proposal.projectType}
- Scope: ${proposal.scope}
- Objectives: ${proposal.objectives}
- Technologies: ${(proposal.technologies as string[])?.join(', ') || 'Based on requirements'}
- Timeline: ${proposal.timeline || 'To be determined'}
- Budget: ${proposal.budget || 'To be determined'}
- Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

${ragContext}

Generate complete, professional proposal content matching the template structure exactly.`;

    // Generate content
    const content = await claude.generateJSON<GeneratedContent>(
      userPrompt,
      PROPOSAL_SYSTEM_PROMPT
    );

    // Generate diagrams
    const diagrams = await this.generateDiagrams(proposal);
    content.diagrams = diagrams;

    // Save generated content
    await db.update(proposals)
      .set({ generatedContent: content })
      .where(eq(proposals.id, proposalId));

    // Index for future RAG
    await this.indexProposal(proposalId, content);

    return content;
  }

  private async generateDiagrams(proposal: any): Promise<{
    architecture?: string;
    flow?: string;
    timeline?: string;
  }> {
    const diagrams: any = {};

    try {
      // Architecture diagram
      const archDiagram = await grok.generateDiagram(
        `System architecture for ${proposal.projectTitle}: ${proposal.scope}`
      );
      diagrams.architecture = this.cleanMermaidCode(archDiagram);

      // Flow diagram
      const flowDiagram = await grok.generateDiagram(
        `Data/process flow for ${proposal.projectType}: ${proposal.objectives}`
      );
      diagrams.flow = this.cleanMermaidCode(flowDiagram);

      // Timeline diagram
      const timelineDiagram = await grok.generateDiagram(
        `Project timeline Gantt chart for ${proposal.timeline || '6 month'} project with phases: Analysis, Design, Development, Testing, Training, Deployment`
      );
      diagrams.timeline = this.cleanMermaidCode(timelineDiagram);

    } catch (error) {
      console.error('Error generating diagrams:', error);
    }

    return diagrams;
  }

  private cleanMermaidCode(code: string): string {
    return code
      .replace(/```mermaid/g, '')
      .replace(/```/g, '')
      .trim();
  }

  private async indexProposal(proposalId: string, content: GeneratedContent) {
    // Index each section for future RAG
    const sections = [
      { type: 'executive_summary', content: JSON.stringify(content.executive_summary) },
      { type: 'scope', content: JSON.stringify(content.scope) },
      { type: 'solution_overview', content: JSON.stringify(content.solution_overview) },
      { type: 'pricing', content: JSON.stringify(content.pricing) },
      { type: 'governance', content: JSON.stringify(content.governance) },
    ];

    for (const section of sections) {
      await ragService.indexChunk(proposalId, section.type, section.content);
    }
  }
}

export const proposalGenerator = new ProposalGeneratorService();
```

---

## PHASE 7: DOCUMENT GENERATION

### 7.1 DOCX Generator

Create `apps/api/src/services/documents/docx-generator.ts`:

```typescript
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, TableOfContents, LevelFormat
} from 'docx';
import * as fs from 'fs';
import { TemplateSchema } from '../templates';
import { GeneratedContent } from '../proposal/generator';

export class DocxGenerator {
  private template: TemplateSchema;
  private content: GeneratedContent;

  constructor(template: TemplateSchema, content: GeneratedContent) {
    this.template = template;
    this.content = content;
  }

  async generate(outputPath: string, logos?: { company?: string; client?: string }): Promise<Buffer> {
    const doc = new Document({
      styles: this.getStyles(),
      numbering: this.getNumberingConfig(),
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: this.createHeader(logos?.company)
        },
        footers: {
          default: this.createFooter()
        },
        children: [
          ...this.createCoverPage(logos?.client),
          ...this.createTOC(),
          ...this.createExecutiveSummary(),
          ...this.createScope(),
          ...this.createSolutionOverview(),
          ...this.createDeliveryFramework(),
          ...this.createWorkBreakdown(),
          ...this.createPricing(),
          ...this.createPaymentSchedule(),
          ...this.createGovernance(),
          ...this.createAssumptions(),
          ...this.createCustomerObligations(),
          ...this.createAcceptance(),
          ...this.createLegal(),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, buffer);
    }

    return buffer;
  }

  private getStyles() {
    const { branding } = this.template;
    
    return {
      default: {
        document: {
          run: { font: branding.body_font, size: 22 }
        }
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, color: branding.primary_color.replace('#', ''), font: branding.heading_font },
          paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, color: branding.secondary_color.replace('#', ''), font: branding.heading_font },
          paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, color: branding.secondary_color.replace('#', ''), font: branding.heading_font },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
        }
      ]
    };
  }

  private getNumberingConfig() {
    return {
      config: [
        {
          reference: "bullet-list",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: "numbered-list",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    };
  }

  private createHeader(companyLogoPath?: string): Header {
    const children: Paragraph[] = [];

    if (companyLogoPath && fs.existsSync(companyLogoPath)) {
      children.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new ImageRun({
          type: 'png',
          data: fs.readFileSync(companyLogoPath),
          transformation: { width: 150, height: 50 }
        })]
      }));
    } else {
      children.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({
          text: this.content.metadata.company_name,
          size: 20,
          color: this.template.branding.secondary_color.replace('#', '')
        })]
      }));
    }

    return new Header({ children });
  }

  private createFooter(): Footer {
    return new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Confidential | ", size: 18 }),
            new TextRun({ text: "Page ", size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
            new TextRun({ text: " of ", size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })
          ]
        })
      ]
    });
  }

  private createCoverPage(clientLogoPath?: string): Paragraph[] {
    const elements: Paragraph[] = [];
    const { branding } = this.template;
    const { metadata } = this.content;

    // Client logo if provided
    if (clientLogoPath && fs.existsSync(clientLogoPath)) {
      elements.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000 },
        children: [new ImageRun({
          type: 'png',
          data: fs.readFileSync(clientLogoPath),
          transformation: { width: 200, height: 100 }
        })]
      }));
    }

    // Client name
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [new TextRun({
        text: metadata.client_name,
        size: 56,
        bold: true,
        color: branding.primary_color.replace('#', '')
      })]
    }));

    // Project title
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({
        text: metadata.project_title,
        size: 40,
        bold: true,
        color: branding.secondary_color.replace('#', '')
      })]
    }));

    // "Proposal" text
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({
        text: "Proposal",
        size: 48,
        bold: true
      })]
    }));

    // Date
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({
        text: metadata.date,
        size: 24
      })]
    }));

    // Page break
    elements.push(new Paragraph({ children: [new PageBreak()] }));

    return elements;
  }

  private createTOC(): Paragraph[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Table of Contents" })]
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3"
      }),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createExecutiveSummary(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { executive_summary } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "1. Executive Summary" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ text: executive_summary.problem_statement })]
    }));

    elements.push(new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: executive_summary.solution_overview })]
    }));

    elements.push(new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: "Key Technologies:", bold: true })]
    }));

    executive_summary.technologies.forEach(tech => {
      elements.push(new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: tech })]
      }));
    });

    return elements;
  }

  private createScope(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { scope } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "2. Scope of the Project" })]
    }));

    scope.sections.forEach(section => {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${section.number} ${section.title}` })]
      }));

      section.items.forEach(item => {
        if (typeof item === 'string') {
          elements.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: item })]
          }));
        } else if (item.main) {
          elements.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: item.main })]
          }));
          item.sub?.forEach((sub: string) => {
            elements.push(new Paragraph({
              indent: { left: 1440 },
              children: [new TextRun({ text: `○ ${sub}` })]
            }));
          });
        }
      });
    });

    // Out of Scope
    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: `2.${scope.sections.length + 1} Out of Scope` })]
    }));

    scope.out_of_scope.forEach(item => {
      elements.push(new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: item })]
      }));
    });

    return elements;
  }

  private createSolutionOverview(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { solution_overview } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "3. Solution Overview" })]
    }));

    solution_overview.components.forEach(comp => {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${comp.number} ${comp.title}` })]
      }));

      elements.push(new Paragraph({
        children: [new TextRun({ text: "Key Components:", bold: true })]
      }));

      comp.key_components.forEach(kc => {
        elements.push(new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun({ text: kc })]
        }));
      });

      if (comp.technical_flow && comp.technical_flow.length > 0) {
        elements.push(new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Technical Flow:", bold: true })]
        }));

        comp.technical_flow.forEach((step, i) => {
          elements.push(new Paragraph({
            numbering: { reference: "numbered-list", level: 0 },
            children: [new TextRun({ text: step })]
          }));
        });
      }
    });

    return elements;
  }

  private createDeliveryFramework(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { delivery_framework } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "4. Delivery Framework" })]
    }));

    delivery_framework.phases.forEach(phase => {
      elements.push(new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({ text: phase.name, bold: true })]
      }));

      phase.points.forEach(point => {
        elements.push(new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun({ text: point })]
        }));
      });
    });

    return elements;
  }

  private createWorkBreakdown(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { work_breakdown } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "5. Detailed Work Breakdown Structure" })]
    }));

    work_breakdown.phases.forEach(phase => {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${phase.phase_number}: ${phase.phase_name}` })]
      }));

      if (phase.activities.length > 0) {
        elements.push(new Paragraph({
          children: [new TextRun({ text: "Activities:", bold: true })]
        }));
        phase.activities.forEach(a => {
          elements.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: a })]
          }));
        });
      }

      if (phase.deliverables.length > 0) {
        elements.push(new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Deliverables:", bold: true })]
        }));
        phase.deliverables.forEach(d => {
          elements.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: d })]
          }));
        });
      }
    });

    return elements;
  }

  private createPricing(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { pricing } = this.content;
    const { table_styles } = this.template;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "6. Pricing" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ 
        text: `The total project cost is ${pricing.currency} ${pricing.total} (${pricing.notes}).` 
      })]
    }));

    // Create pricing table
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Project Phase', 'Duration', `Total Cost (${pricing.currency})`].map(text =>
        new TableCell({
          borders: cellBorders,
          shading: { fill: table_styles.header_bg_color.replace('#', ''), type: ShadingType.CLEAR },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, color: table_styles.header_text_color.replace('#', '') })]
          })]
        })
      )
    });

    const dataRows = pricing.items.map((item, i) =>
      new TableRow({
        children: [item.phase, item.duration, `${pricing.currency} ${item.amount}`].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: table_styles.alternating_rows && i % 2 === 1 
              ? { fill: "F5F5F5", type: ShadingType.CLEAR } 
              : undefined,
            children: [new Paragraph({ children: [new TextRun({ text })] })]
          })
        )
      })
    );

    // Total row
    const totalRow = new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          columnSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })]
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: `${pricing.currency} ${pricing.total}`, bold: true })] })]
        })
      ]
    });

    elements.push(new Table({
      columnWidths: [4000, 2500, 2860],
      rows: [headerRow, ...dataRows, totalRow]
    }));

    return elements;
  }

  private createPaymentSchedule(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { payment_schedule } = this.content;
    const { table_styles } = this.template;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "6.2 Payment Schedule" })]
    }));

    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Milestone', 'Description', 'Percentage %'].map(text =>
        new TableCell({
          borders: cellBorders,
          shading: { fill: table_styles.header_bg_color.replace('#', ''), type: ShadingType.CLEAR },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, color: table_styles.header_text_color.replace('#', '') })]
          })]
        })
      )
    });

    const dataRows = payment_schedule.milestones.map((m, i) =>
      new TableRow({
        children: [m.id, m.description, `${m.percentage}%`].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: table_styles.alternating_rows && i % 2 === 1 
              ? { fill: "F5F5F5", type: ShadingType.CLEAR } 
              : undefined,
            children: [new Paragraph({ children: [new TextRun({ text: String(text) })] })]
          })
        )
      })
    );

    const totalRow = new TableRow({
      children: [
        new TableCell({ borders: cellBorders, columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
        new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "100%", bold: true })] })] })
      ]
    });

    elements.push(new Table({
      columnWidths: [2000, 5360, 2000],
      rows: [headerRow, ...dataRows, totalRow]
    }));

    return elements;
  }

  private createGovernance(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { governance } = this.content;
    const { table_styles } = this.template;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "7. Governance and Risk Management" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ text: governance.intro })]
    }));

    // Governance points
    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "7.1 Governance" })]
    }));

    governance.governance_points.forEach(gp => {
      elements.push(new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [
          new TextRun({ text: `${gp.title}: `, bold: true }),
          new TextRun({ text: gp.description })
        ]
      }));
    });

    // Risks table
    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "7.2 Risks and Mitigations" })]
    }));

    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Risk', 'Mitigation'].map(text =>
        new TableCell({
          borders: cellBorders,
          shading: { fill: table_styles.header_bg_color.replace('#', ''), type: ShadingType.CLEAR },
          children: [new Paragraph({
            children: [new TextRun({ text, bold: true, color: table_styles.header_text_color.replace('#', '') })]
          })]
        })
      )
    });

    const dataRows = governance.risks.map((r, i) =>
      new TableRow({
        children: [r.risk, r.mitigation].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: table_styles.alternating_rows && i % 2 === 1 
              ? { fill: "F5F5F5", type: ShadingType.CLEAR } 
              : undefined,
            children: [new Paragraph({ children: [new TextRun({ text })] })]
          })
        )
      })
    );

    elements.push(new Table({
      columnWidths: [4680, 4680],
      rows: [headerRow, ...dataRows]
    }));

    return elements;
  }

  private createAssumptions(): Paragraph[] {
    const elements: Paragraph[] = [];

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "8. Assumptions" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ text: "The following are the underlying assumptions for this Scope of Work:" })]
    }));

    this.content.assumptions.forEach(a => {
      elements.push(new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: a })]
      }));
    });

    return elements;
  }

  private createCustomerObligations(): Paragraph[] {
    const elements: Paragraph[] = [];

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "9. Customer Obligations" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ 
        text: `The following are the obligations of ${this.content.metadata.client_name} for this Scope of Work:` 
      })]
    }));

    this.content.customer_obligations.forEach(o => {
      elements.push(new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: o })]
      }));
    });

    return elements;
  }

  private createAcceptance(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { signature_block } = this.template;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "10. Acceptance" })]
    }));

    elements.push(new Paragraph({
      children: [new TextRun({ text: "The agreement is executed for and on behalf of:" })]
    }));

    // Create signature blocks
    const parties = [this.content.metadata.client_name, this.content.metadata.company_name];
    const copies = signature_block?.copies_per_party || 2;

    parties.forEach(party => {
      for (let i = 0; i < copies; i++) {
        elements.push(...this.createSignatureBlock(party));
        elements.push(new Paragraph({ spacing: { after: 400 } }));
      }
    });

    return elements;
  }

  private createSignatureBlock(partyName: string): Paragraph[] {
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    const rows = [
      ['Signed at:', ''],
      ['Date:', ''],
      ['For and on behalf of', partyName],
      ['Signature', ''],
      ['Full Name', ''],
      ['Position', '']
    ].map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 3000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: label })] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6360, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: value, bold: value ? true : false })] })]
          })
        ]
      })
    );

    // Add authorization row
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          columnSpan: 2,
          children: [new Paragraph({
            children: [new TextRun({
              text: "By signing above, I warrant that I have been duly authorized to sign this Agreement",
              italics: true,
              size: 20
            })]
          })]
        })
      ]
    }));

    return [
      new Table({ columnWidths: [3000, 6360], rows })
    ];
  }

  private createLegal(): Paragraph[] {
    const elements: Paragraph[] = [];
    const { legal } = this.content;

    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "11. Notice of Proprietary Information" })]
    }));

    if (legal.client_info) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "11.1 Client Information" })]
      }));
      elements.push(new Paragraph({
        children: [new TextRun({ text: legal.client_info })]
      }));
    }

    if (legal.limitation_of_scope) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "11.2 Limitation of Scope" })]
      }));
      elements.push(new Paragraph({
        children: [new TextRun({ text: legal.limitation_of_scope })]
      }));
    }

    if (legal.confidentiality) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "11.3 Confidentiality" })]
      }));
      elements.push(new Paragraph({
        children: [new TextRun({ text: legal.confidentiality })]
      }));
    }

    if (legal.legal_notice) {
      elements.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "11.4 Legal Notice" })]
      }));
      elements.push(new Paragraph({
        children: [new TextRun({ text: legal.legal_notice })]
      }));
    }

    return elements;
  }
}
```

---

## PHASE 8: API ROUTES

Create `apps/api/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { conversationService } from '../services/conversation';
import { proposalGenerator } from '../services/proposal/generator';
import { DocxGenerator } from '../services/documents/docx-generator';
import { templateService } from '../services/templates';
import { ragService } from '../services/rag';
import { db } from '../db';
import { proposals } from '../db/schema';

const router = Router();

// Start new proposal conversation
router.post('/proposals/start', async (req, res) => {
  const { templateSlug } = req.body;
  
  const [proposal] = await db.insert(proposals).values({
    clientName: '',
    clientCompany: '',
    projectTitle: '',
    status: 'draft'
  }).returning();

  const { conversationId, message } = await conversationService.startConversation(proposal.id);

  res.json({ proposalId: proposal.id, conversationId, message });
});

// Chat with conversation
router.post('/conversations/:id/chat', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const response = await conversationService.chat(id, message);
  res.json(response);
});

// Generate proposal content
router.post('/proposals/:id/generate', async (req, res) => {
  const { id } = req.params;
  const { templateSlug = 'linkfields', useRAG = true } = req.body;

  const content = await proposalGenerator.generate(id, templateSlug, useRAG);
  res.json(content);
});

// Export to DOCX
router.post('/proposals/:id/export/docx', async (req, res) => {
  const { id } = req.params;
  const { templateSlug = 'linkfields' } = req.body;

  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, id)
  });

  if (!proposal || !proposal.generatedContent) {
    return res.status(400).json({ error: 'Proposal not generated yet' });
  }

  const template = await templateService.getTemplate(templateSlug);
  const generator = new DocxGenerator(template!, proposal.generatedContent as any);
  const buffer = await generator.generate('');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${proposal.projectTitle || 'proposal'}.docx"`);
  res.send(buffer);
});

// List templates
router.get('/templates', async (req, res) => {
  const templates = await templateService.listTemplates();
  res.json(templates);
});

// Index winning proposal for RAG
router.post('/rag/index', async (req, res) => {
  const { title, content, industry, projectType, winRate } = req.body;
  await ragService.indexWinningProposal(title, content, industry, projectType, winRate);
  res.json({ success: true });
});

export default router;
```

---

## PHASE 9: FRONTEND COMPONENTS

### 9.1 Chat Interface

Create `apps/web/src/components/chat/ProposalChat.tsx`:

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProposalChatProps {
  proposalId: string;
  conversationId: string;
  onComplete: (extractedData: any) => void;
}

export function ProposalChat({ proposalId, conversationId, onComplete }: ProposalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.isComplete) {
        setIsComplete(true);
        onComplete(data.extractedData);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal Assistant</h2>
        {isComplete && (
          <span className="flex items-center text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Requirements gathered
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your response..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isComplete}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || isComplete}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 9.2 Proposal Preview with Mermaid Diagrams

Create `apps/web/src/components/preview/ProposalPreview.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface ProposalPreviewProps {
  content: any;
  template: any;
}

export function ProposalPreview({ content, template }: ProposalPreviewProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    mermaid.contentLoaded();
  }, [content.diagrams]);

  const primaryColor = template.branding.primary_color;
  const secondaryColor = template.branding.secondary_color;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Cover Page Preview */}
      <div className="p-8 text-center border-b-4" style={{ borderColor: primaryColor }}>
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          {content.metadata.client_name}
        </h1>
        <h2 className="text-xl mt-2" style={{ color: secondaryColor }}>
          {content.metadata.project_title}
        </h2>
        <p className="text-gray-500 mt-4">{content.metadata.date}</p>
      </div>

      {/* Executive Summary */}
      <section className="p-6 border-b">
        <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
          1. Executive Summary
        </h2>
        <p className="mb-4">{content.executive_summary.problem_statement}</p>
        <p className="mb-4">{content.executive_summary.solution_overview}</p>
        <h4 className="font-semibold mb-2">Key Technologies:</h4>
        <ul className="list-disc list-inside">
          {content.executive_summary.technologies.map((tech: string, i: number) => (
            <li key={i}>{tech}</li>
          ))}
        </ul>
      </section>

      {/* Architecture Diagram */}
      {content.diagrams?.architecture && (
        <section className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            System Architecture
          </h2>
          <div className="mermaid" ref={mermaidRef}>
            {content.diagrams.architecture}
          </div>
        </section>
      )}

      {/* Pricing Table */}
      <section className="p-6 border-b">
        <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
          6. Pricing
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor }}>
              <th className="border p-2 text-white text-left">Phase</th>
              <th className="border p-2 text-white text-left">Duration</th>
              <th className="border p-2 text-white text-left">Cost</th>
            </tr>
          </thead>
          <tbody>
            {content.pricing.items.map((item: any, i: number) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border p-2">{item.phase}</td>
                <td className="border p-2">{item.duration}</td>
                <td className="border p-2">{content.pricing.currency} {item.amount}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-100">
              <td className="border p-2" colSpan={2}>Total</td>
              <td className="border p-2">{content.pricing.currency} {content.pricing.total}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Timeline Diagram */}
      {content.diagrams?.timeline && (
        <section className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            Project Timeline
          </h2>
          <div className="mermaid">
            {content.diagrams.timeline}
          </div>
        </section>
      )}

      {/* Risk Table */}
      <section className="p-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
          7. Risks and Mitigations
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor }}>
              <th className="border p-2 text-white text-left">Risk</th>
              <th className="border p-2 text-white text-left">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {content.governance.risks.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border p-2">{r.risk}</td>
                <td className="border p-2">{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

---

## PHASE 10: DOCKER SETUP

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: proposals
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/proposals
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      XAI_API_KEY: ${XAI_API_KEY}
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

## QUICK START COMMANDS

```bash
# 1. Clone/setup project
mkdir proposal-generator && cd proposal-generator

# 2. Initialize monorepo
pnpm init
pnpm add -D turbo typescript @types/node

# 3. Create apps
mkdir -p apps/api apps/web packages/shared packages/ai-providers

# 4. Start Docker services
docker-compose up -d postgres redis

# 5. Run migrations
pnpm --filter api db:migrate

# 6. Start development
pnpm dev
```

---

Now build this complete system step by step. Start with Phase 1 (Database Setup), then proceed through each phase. Ask me if you need clarification on any component.
```

---

## SUMMARY

This is a complete project specification for Claude CLI. The system includes:

1. **PostgreSQL + pgvector** for RAG storage
2. **Multi-model AI** (Claude, GPT-4, Gemini, Grok)
3. **Interactive Q&A** chat to gather requirements
4. **Template-based generation** matching exact designs
5. **Mermaid diagrams** (architecture, flow, timeline)
6. **Professional tables** with template styling
7. **DOCX export** with full formatting
8. **React frontend** with live preview

Copy the entire prompt above into Claude CLI to build the project step by step.
