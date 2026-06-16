import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestId, auditMiddleware } from './middleware/audit.js';
import routes from './routes/index.js';
import authRoutes from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production',
  }));
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(auditMiddleware);

  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      requestId: (req as { requestId?: string }).requestId,
      ip: req.ip,
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      const { prisma } = await import('./config/database.js');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not ready' });
    }
  });

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Htask API',
        version: '1.0.0',
        description: 'Enterprise Task & Workflow Management System API',
      },
      servers: [{ url: `http://localhost:${config.PORT}${config.API_PREFIX}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(`${config.API_PREFIX}/auth`, authRoutes);
  app.use(config.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
