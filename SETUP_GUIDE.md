# Setup Guide - Proposal Generator

## 🎉 Slice 1 Complete!

You've successfully completed **Slice 1: Foundation + Basic Template System**

### ✅ What's Been Built

#### Backend
- ✅ Monorepo structure with pnpm + Turbo
- ✅ Docker services (PostgreSQL 16 + pgvector, Redis)
- ✅ Express.js API with TypeScript
- ✅ Drizzle ORM with complete database schema
- ✅ AI provider abstraction (Gemini, OpenAI, Grok) with **latest stable models**
- ✅ Template service and API routes
- ✅ Linkfields template schema

#### Frontend
- ✅ React 18 + Vite + TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ API client with axios
- ✅ Zustand store for state management
- ✅ Template selector and card components

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create `.env` file in the root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# AI API Keys (Gemini is PRIMARY)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
XAI_API_KEY=your_xai_api_key_here
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL 16 with pgvector on port 5432
- Redis on port 6379

### 4. Push Database Schema

```bash
pnpm db:push
```

This will create all tables in PostgreSQL.

### 5. Start Development Servers

```bash
pnpm dev
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000

## 📋 Verify Installation

1. **Check Docker services are running:**
   ```bash
   docker ps
   ```
   You should see `proposal-postgres` and `proposal-redis` running.

2. **Test the API:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Test templates endpoint:**
   ```bash
   curl http://localhost:3001/api/templates
   ```
   Should return the Linkfields template.

4. **Open the frontend:**
   Navigate to http://localhost:3000
   You should see the template selector with the Linkfields template card.

## 🧪 Testing the System

### Backend API Tests

```bash
# Health check
curl http://localhost:3001/health

# List templates
curl http://localhost:3001/api/templates

# Get specific template
curl http://localhost:3001/api/templates/linkfields
```

### Frontend Tests

1. Open http://localhost:3000
2. You should see "Proposal Generator" header
3. Template selector should display the Linkfields template
4. Click on the template card to select it
5. Selected template should be highlighted

## 📊 Database Access

### View database with Drizzle Studio:

```bash
pnpm --filter api db:studio
```

Opens Drizzle Studio at http://localhost:4983

### Direct PostgreSQL access:

```bash
docker exec -it proposal-postgres psql -U postgres -d proposals
```

Then run SQL commands:
```sql
-- List tables
\dt

-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- View templates
SELECT * FROM templates;
```

## 🎯 What's Working

### ✅ Backend Features
- Express API server running on port 3001
- Health check endpoint
- Template CRUD endpoints
- Drizzle ORM connected to PostgreSQL
- pgvector extension enabled
- Template service loading Linkfields from file system

### ✅ Frontend Features
- Vite dev server running on port 3000
- Template selector component
- Template cards with branding colors
- Zustand state management
- API integration
- Responsive design with Tailwind CSS

### ✅ AI Providers (Latest Stable Models)
- **Gemini**: `gemini-1.5-pro-latest`, `gemini-1.5-flash-latest`, `text-embedding-004`
- **OpenAI**: `gpt-4o`, `gpt-4-turbo-2024-04-09`, `text-embedding-3-large`
- **Grok**: `grok-2-latest`

## 🔧 Common Issues & Solutions

### Issue: Docker containers won't start
```bash
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Issue: Database connection error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs proposal-postgres

# Ensure DATABASE_URL is correct in .env
```

### Issue: Frontend can't connect to API
- Check API is running on port 3001
- Check CORS settings in `apps/api/src/index.ts`
- Check proxy settings in `apps/web/vite.config.ts`

### Issue: pnpm install fails
```bash
# Clear cache
pnpm store prune

# Try again
pnpm install
```

## 📁 Project Structure

```
proposal-generator/
├── apps/
│   ├── api/                    # Backend Express API
│   │   ├── src/
│   │   │   ├── db/            # Database schema & connection
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   └── index.ts       # Express app
│   │   └── package.json
│   │
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── lib/           # Utilities & API client
│       │   ├── pages/         # Page components
│       │   ├── stores/        # Zustand stores
│       │   └── main.tsx       # App entry
│       └── package.json
│
├── packages/
│   ├── ai-providers/          # AI model abstraction
│   └── shared/                # Shared types
│
├── templates/
│   └── linkfields/            # Linkfields template
│
├── docker-compose.yml
├── package.json
└── turbo.json
```

## 🎓 Next Steps

Now that Slice 1 is complete, you're ready for **Slice 2: Template Upload & Extraction**

This will add:
- DOCX file upload
- Template extraction from uploaded files
- Structure parsing
- Logo and asset extraction
- Template schema generation

Would you like to continue with Slice 2?

## 📚 Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Gemini API Docs](https://ai.google.dev/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🆘 Need Help?

If you encounter any issues:
1. Check Docker logs: `docker logs proposal-postgres` or `docker logs proposal-redis`
2. Check API logs in the terminal where `pnpm dev` is running
3. Check browser console for frontend errors
4. Verify environment variables in `.env`
