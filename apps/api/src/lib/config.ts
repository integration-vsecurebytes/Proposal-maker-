import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_PORT = parseInt(process.env.CLIENT_PORT || '4000', 10);

export const config = {
  port: PORT,
  clientPort: CLIENT_PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${PORT}`,
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
  },
  client: {
    baseUrl: process.env.CLIENT_BASE_URL || `http://localhost:${CLIENT_PORT}`,
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/proposals',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  ai: {
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    xaiApiKey: process.env.XAI_API_KEY || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || `http://localhost:${CLIENT_PORT}`,
  },
  uploads: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10), // 50MB default
    allowedTypes: (process.env.ALLOWED_UPLOAD_TYPES || 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml')
      .split(',')
      .map(t => t.trim()),
  },
};
