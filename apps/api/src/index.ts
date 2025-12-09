import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './lib/config';
import templateRoutes from './routes/templates';
import uploadRoutes from './routes/upload';
import conversationRoutes from './routes/conversations';
import ragRoutes from './routes/rag';
import proposalRoutes from './routes/proposals';
import exportRoutes from './routes/export';
import assetRoutes from './routes/assets';
import visualizationRoutes from './routes/visualizations';
import wizardRoutes from './routes/wizard';
import graphicsRoutes from './routes/graphics';
import aiDesignRoutes from './routes/ai-design';

const app = express();

// Middleware
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files as static assets
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const uploadPath = path.resolve(UPLOAD_DIR);
console.log(`📁 Serving uploads from: ${uploadPath}`);
app.use('/uploads', express.static(uploadPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes - Dynamic prefix from config
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/templates`, templateRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/conversations`, conversationRoutes);
app.use(`${apiPrefix}/rag`, ragRoutes);
app.use(`${apiPrefix}/proposals`, proposalRoutes);
app.use(`${apiPrefix}/export`, exportRoutes);
app.use(`${apiPrefix}/assets`, assetRoutes);
app.use(`${apiPrefix}/visualizations`, visualizationRoutes);
app.use(`${apiPrefix}/wizard`, wizardRoutes);
app.use(`${apiPrefix}/graphics`, graphicsRoutes);
app.use(`${apiPrefix}/ai-design`, aiDesignRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 API server running on ${config.api.baseUrl}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Prefix: ${config.api.prefix}`);
  console.log(`📌 API Version: ${config.api.version}`);
  console.log(`🌐 CORS origin: ${config.cors.origin}`);
});
