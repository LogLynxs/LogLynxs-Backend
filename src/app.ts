import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

import { errorHandler } from './core/errorHandler';
import { logger } from './core/logger';
import { authMiddleware } from './core/authMiddleware';
import { initializeFirebase } from './firebase/admin';

// Import routes
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import bikeRoutes from './modules/bikes/routes';
import componentRoutes from './modules/components/routes';
import serviceLogRoutes from './modules/serviceLogs/routes';
import qrCodeRoutes from './modules/qrcodes/routes';
import stravaRoutes from './modules/strava/routes';
import notificationRoutes from './modules/notifications/routes';

// Load environment variables
dotenv.config();

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LogLynx API',
      version: '1.0.0',
      description: 'REST API for LogLynx cycling companion app',
      contact: {
        name: 'LogLynx Team',
        email: 'support@loglynx.app'
      }
    },
    servers: [],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/modules/**/*.ts', './src/core/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
  skip: (req) => {
    const path = req.originalUrl || req.url || '';
    return (
      path.startsWith('/api/v1/auth') ||
      path.startsWith('/health') ||
      path.startsWith('/api-docs')
    );
  },
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root route - helpful in serverless envs
app.get('/', (req, res) => {
  res.json({
    name: 'LogLynx API',
    status: 'OK',
    routes: {
      health: '/health',
      docs: '/api-docs',
      docsJson: '/api-docs.json',
      apiBase: '/api/v1'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/bikes', authMiddleware, bikeRoutes);
app.use('/api/v1/components', authMiddleware, componentRoutes);
app.use('/api/v1/service-logs', authMiddleware, serviceLogRoutes);
app.use('/api/v1/qr-codes', authMiddleware, qrCodeRoutes);
app.use('/api/v1/strava', authMiddleware, stravaRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: { code: 'ENDPOINT_NOT_FOUND', message: `Endpoint ${req.method} ${req.originalUrl} not found` } });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Firebase (safe to call in serverless too; it guards internally)
try {
  initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
}

export default app;


