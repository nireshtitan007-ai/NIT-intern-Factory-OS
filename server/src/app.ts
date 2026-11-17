import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', system: 'ZenLyft Manufacturing OS', timestamp: new Date() });
  });

  return app;
};

