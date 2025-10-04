import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './config/logger';
import { CSRF } from './middleware/csrf';

const app = express();

// Behind proxies (docker/nginx), trust proxy for secure cookies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token', 'X-Requested-With'],
  credentials: true,
};
app.use(cors(corsOptions));
// Explicitly handle preflight requests without wildcard route patterns
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
const isDevelopment = env.NODE_ENV === 'development';
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && (allowedOrigins.includes(origin) || (isDevelopment && /^http:\/\/localhost:\d+$/.test(origin)))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, x-csrf-token, X-Requested-With');
  res.header('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(env.RATE_LIMIT.split('/')[0]), // Extract number from "100/minute"
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In development, skip limiter to avoid noisy 429s from SSR re-renders
  skip: (req) => {
    if (env.NODE_ENV === 'development') return true;
    // Also skip public product listing endpoints to allow storefront traffic
    if (req.method === 'GET' && req.path.startsWith('/api/v1/products')) return true;
    return false;
  },
});
app.use(limiter);

// Request logging: ensure our requestId is set first, then pino-http, and morgan in dev
app.use(requestLogger);
app.use(pinoHttp({
  logger,
  genReqId: (req) => (req as any).requestId || undefined,
  autoLogging: true,
}));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Issue CSRF cookie and verify for unsafe methods
app.use(CSRF.issueCsrfCookie);
app.use(CSRF.verifyCsrf);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Import routes
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { tagRoutes } from './routes/tags';
import { reviewRoutes } from './routes/reviews';
import { orderRoutes } from './routes/orders';
import { analyticsRoutes } from './routes/analytics';
import { imageRoutes } from './routes/images';

// API routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/images', imageRoutes);

// API info endpoint
app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'E-commerce API v1',
    version: '1.0.0',
    endpoints: {
      admin: {
        register: 'POST /api/v1/admin/register',
        login: 'POST /api/v1/admin/login',
        logout: 'POST /api/v1/admin/logout',
        profile: 'GET /api/v1/admin/profile',
        refreshToken: 'POST /api/v1/admin/refresh-token',
      },
      products: {
        list: 'GET /api/v1/products',
        search: 'GET /api/v1/products/search?q={query}',
        getById: 'GET /api/v1/products/:id',
        admin: {
          list: 'GET /api/v1/products/admin',
          create: 'POST /api/v1/products/admin',
          update: 'PUT /api/v1/products/admin/:id',
          delete: 'DELETE /api/v1/products/admin/:id',
          updateStock: 'PUT /api/v1/products/admin/:id/stock',
        },
      },
      categories: {
        list: 'GET /api/v1/categories',
        getById: 'GET /api/v1/categories/:id',
        admin: {
          create: 'POST /api/v1/categories/admin',
          update: 'PUT /api/v1/categories/admin/:id',
          delete: 'DELETE /api/v1/categories/admin/:id',
        },
      },
      tags: {
        list: 'GET /api/v1/tags',
        getById: 'GET /api/v1/tags/:id',
        admin: {
          create: 'POST /api/v1/tags/admin',
          update: 'PUT /api/v1/tags/admin/:id',
          delete: 'DELETE /api/v1/tags/admin/:id',
        },
      },
      reviews: {
        list: 'GET /api/v1/reviews?productId={id}',
        getById: 'GET /api/v1/reviews/:id',
        create: 'POST /api/v1/reviews',
        productRating: 'GET /api/v1/reviews/product/:productId/rating',
        admin: {
          listAll: 'GET /api/v1/reviews/admin/all',
          statistics: 'GET /api/v1/reviews/admin/statistics',
          update: 'PUT /api/v1/reviews/admin/:id',
          delete: 'DELETE /api/v1/reviews/admin/:id',
        },
      },
      orders: {
        create: 'POST /api/v1/orders/create',
        track: 'GET /api/v1/orders/track/:orderNumber',
        admin: {
          list: 'GET /api/v1/orders/admin',
          getById: 'GET /api/v1/orders/admin/:id',
          statistics: 'GET /api/v1/orders/admin/statistics',
          updateStatus: 'PUT /api/v1/orders/admin/:id/status',
        },
      },
      analytics: {
        dashboard: 'GET /api/v1/analytics/dashboard',
        sales: 'GET /api/v1/analytics/sales?days={days}',
        topProducts: 'GET /api/v1/analytics/top-products?limit={limit}',
        revenueByCategory: 'GET /api/v1/analytics/revenue-by-category',
        orderStatus: 'GET /api/v1/analytics/order-status',
        lowStock: 'GET /api/v1/analytics/low-stock?threshold={threshold}',
        recentReviews: 'GET /api/v1/analytics/recent-reviews?limit={limit}',
      },
      cart: '/api/v1/cart (coming soon)',
      health: '/health',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export { app };
