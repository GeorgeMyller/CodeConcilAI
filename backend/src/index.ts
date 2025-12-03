import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initSentry } from './services/sentryService.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import geminiRoutes from './routes/gemini.js';
import stripeWebhookRoutes from './routes/stripeWebhook.js';
import subscriptionRoutes from './routes/subscriptions.js';
import adminRoutes from './routes/admin.js';
import rateLimitRoutes from './routes/rateLimit.js';
import metricsRoutes from './routes/metrics.js';
import agentRoutes from './routes/agents.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Sentry
initSentry(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(metricsMiddleware);
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook must be raw, before JSON parsing
app.use('/api/billing/stripe/webhook', stripeWebhookRoutes);

// Apply rate limiting to all requests
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/admin', adminRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/agents', agentRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ CodeCouncil AI Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend: ${FRONTEND_URL}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
