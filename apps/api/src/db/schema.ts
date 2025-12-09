import { pgTable, text, timestamp, uuid, jsonb, integer, boolean, real, customType } from 'drizzle-orm/pg-core';

// Custom vector type for pgvector
const vector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: any): number[] {
    if (typeof value === 'string') {
      // pgvector returns vectors as strings like '[1,2,3]'
      return JSON.parse(value.replace(/\[|\]/g, match => match === '[' ? '[' : ']'));
    }
    return value;
  },
});

// Templates table
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  schema: jsonb('schema').notNull(), // TemplateSchema JSON
  styles: jsonb('styles'),
  assets: jsonb('assets'),
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
  extractedData: jsonb('extracted_data'), // Data from conversation
  generatedContent: jsonb('generated_content'),
  placeholders: jsonb('placeholders'),
  branding: jsonb('branding'), // Customizable branding settings
  designMetadata: jsonb('design_metadata'), // Design system (colors + fonts)
  status: text('status').default('draft'), // draft, in_progress, generated, reviewed, sent
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Conversations table (for Q&A)
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  messages: jsonb('messages').$type<Array<{ role: string; content: string; timestamp?: Date }>>(),
  extractedData: jsonb('extracted_data'),
  currentPhase: text('current_phase'), // client_info, project_details, scope, timeline, budget, visualization_preferences, complete
  isComplete: boolean('is_complete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Document chunks with vector embeddings (for RAG)
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }), // Vector embedding (Gemini text-embedding-004)
  metadata: jsonb('metadata'), // Industry, tags, project type, etc.
  relevanceScore: real('relevance_score'), // User feedback on relevance
  usageCount: integer('usage_count').default(0), // How often this chunk was retrieved
  createdAt: timestamp('created_at').defaultNow(),
});

// Winning proposals index (for RAG)
export const winningProposals = pgTable('winning_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  industry: text('industry'),
  projectType: text('project_type'),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }), // Vector embedding (Gemini text-embedding-004)
  winRate: integer('win_rate'), // Success percentage (0-100)
  tags: jsonb('tags').$type<string[]>(),
  companySize: text('company_size'), // SMB, Mid-Market, Enterprise
  dealValue: text('deal_value'),
  metadata: jsonb('metadata'),
  timesReferenced: integer('times_referenced').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Visualizations table (charts and diagrams)
export const visualizations = pgTable('visualizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id).notNull(),
  sectionId: text('section_id').notNull(),
  type: text('type').notNull(), // 'chart' | 'diagram'
  config: jsonb('config').notNull(), // ChartConfig | DiagramConfig
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Assets table (logos, images)
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  type: text('type').notNull(), // company_logo, client_logo, cover_image, diagram, chart
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size'), // File size in bytes
  url: text('url'), // If stored externally
  data: text('data'), // Base64 encoded data or file path
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User AI preferences
export const userAIPreferences = pgTable('user_ai_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'), // For future auth integration
  contentProvider: text('content_provider').default('gemini'), // gemini, openai, grok
  contentModel: text('content_model').default('gemini-1.5-pro-latest'),
  qaProvider: text('qa_provider').default('gemini'),
  qaModel: text('qa_model').default('gemini-1.5-flash-latest'),
  embeddingProvider: text('embedding_provider').default('gemini'),
  embeddingModel: text('embedding_model').default('text-embedding-004'),
  diagramProvider: text('diagram_provider').default('grok'),
  diagramModel: text('diagram_model').default('grok-2-latest'),
  fallbackProvider: text('fallback_provider').default('openai'),
  fallbackModel: text('fallback_model').default('gpt-4o'),
  enableFallback: boolean('enable_fallback').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Proposal generation tracking (which model generated each section)
export const proposalGeneration = pgTable('proposal_generation', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type'),
  modelUsed: text('model_used'), // e.g., "gemini-1.5-pro-latest"
  provider: text('provider'), // gemini, openai, grok
  tokensUsed: integer('tokens_used'),
  generationTime: integer('generation_time'), // milliseconds
  generatedAt: timestamp('generated_at').defaultNow(),
});

// RAG usage tracking
export const ragUsage = pgTable('rag_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type'),
  retrievedChunks: jsonb('retrieved_chunks'), // Array of chunk IDs and scores
  similarityScores: jsonb('similarity_scores'),
  userFeedback: text('user_feedback'), // helpful, not_helpful, neutral
  createdAt: timestamp('created_at').defaultNow(),
});

// Feedback table for learning
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  sectionType: text('section_type'),
  rating: integer('rating'), // 1-5 stars
  comment: text('comment'),
  improvementSuggestion: text('improvement_suggestion'),
  createdAt: timestamp('created_at').defaultNow(),
});

// PDF cache table (for caching generated PDFs)
export const pdfCache = pgTable('pdf_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'cascade' }),
  cacheKey: text('cache_key').unique().notNull(),
  method: text('method').notNull(), // puppeteer, libreoffice
  filePath: text('file_path').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  metadata: jsonb('metadata'),
  generatedAt: timestamp('generated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  accessCount: integer('access_count').default(0),
  expiresAt: timestamp('expires_at'),
});

// Export all tables
export const schema = {
  templates,
  proposals,
  conversations,
  documentChunks,
  winningProposals,
  visualizations,
  assets,
  userAIPreferences,
  proposalGeneration,
  ragUsage,
  feedback,
  pdfCache,
};
