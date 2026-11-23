import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.routes';

export const createApp = () => {
  const app = express();

  // Security Headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // allow flexible static serving in development
    crossOriginEmbedderPolicy: false
  }));

  // CORS restriction
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5055', 'http://127.0.0.1:5055', 'http://localhost:5000'];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or test environment
      if (!origin || process.env.NODE_ENV === 'test' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true
  }));

  // General rate limiter for API (protect against abuse)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 10000 : 500, // generous for integration testing
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
  });

  // Strict rate limiter for Authentication
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 30, // strict in production
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts, please try again after 15 minutes.' }
  });

  app.use(express.json({ limit: '10mb' }));

  // Request logging middleware with query token redaction
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedUrl = req.url.replace(/([?&]token=)[^&]+/i, '$1[REDACTED]');
      console.log(`[API] ${req.method} ${sanitizedUrl}`);
    }
    next();
  });

  // Apply rate limiters
  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/admin-login', authLimiter);
  app.use('/api/auth/salesman-mobile-login', authLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', system: 'ZenLyft Manufacturing OS', timestamp: new Date() });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Static serving for built client in standalone or production mode
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // Central error handling middleware - never leaks stack traces in production
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[Unhandled Error]', err);
    }
    const statusCode = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
    const responsePayload: Record<string, any> = {
      success: false,
      error: err.message || 'Internal server error'
    };

    if (process.env.NODE_ENV !== 'production' && err.stack) {
      responsePayload.devStack = err.stack;
    }

    res.status(statusCode).json(responsePayload);
  });

  return app;
};
