/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Security headers & basic rate limiting guard
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // CORS configuration
  app.use(
    cors({
      origin: process.env.APP_URL || true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  // Body parser
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Structured request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(`[API ${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Mount Frontend (Vite in dev, static dist in prod)
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[NEXUS Server Error]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: isProd ? 'An unexpected server error occurred.' : err.message,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`NEXUS — Trust Fabric for the AI Economy`);
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${isProd ? 'Production' : 'Development (Vite Mounted)'}`);
    console.log(`PayPal Sandbox Base: ${process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]', err);
  process.exit(1);
});
