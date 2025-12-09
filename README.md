# AI-Powered Proposal Generation System

An end-to-end proposal generation system powered by AI with RAG (Retrieval Augmented Generation) capabilities.

## Features

- 📝 **Template Upload & Extraction** - Upload DOCX templates and automatically extract structure
- 💬 **Interactive Q&A** - Conversational interface to gather proposal requirements
- 🤖 **Multi-Model AI** - Support for Gemini, OpenAI GPT-4, and xAI Grok
- 🧠 **RAG System** - Learn from past successful proposals
- 📊 **Charts & Graphs** - Dynamic Chart.js visualizations
- 🎨 **Diagrams** - Mermaid diagrams (architecture, flow, Gantt)
- 🎯 **Smart Generation** - AI generates content matching exact template designs
- 📤 **Export** - Professional DOCX and PDF outputs

## Tech Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js
- PostgreSQL 16 with pgvector
- Drizzle ORM
- Redis + BullMQ

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Chart.js & Mermaid.js
- Zustand

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to `.env`:
   - `GOOGLE_AI_API_KEY` (Gemini - primary)
   - `OPENAI_API_KEY` (fallback)
   - `XAI_API_KEY` (for diagrams)

5. Start Docker services:
   ```bash
   docker-compose up -d
   ```

6. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

7. Start development servers:
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:3001`
The frontend will be available at `http://localhost:3000`

## Project Structure

```
proposal-generator/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # React frontend
├── packages/
│   ├── ai-providers/ # AI model abstraction
│   └── shared/       # Shared types and schemas
├── templates/        # Predefined proposal templates
└── docker-compose.yml
```

## Development

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:push` - Push schema changes to database

## License

MIT
