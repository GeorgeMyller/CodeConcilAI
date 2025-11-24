import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics for CodeCouncil
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const subscriptionCreated = new promClient.Counter({
  name: 'subscription_created_total',
  help: 'Total subscriptions created',
  labelNames: ['plan'],
  registers: [register]
});

export const subscriptionCanceled = new promClient.Counter({
  name: 'subscription_canceled_total',
  help: 'Total subscriptions canceled',
  registers: [register]
});

export const stripePaymentSucceeded = new promClient.Counter({
  name: 'stripe_payment_succeeded_total',
  help: 'Total successful Stripe payments',
  labelNames: ['amount_tier'],
  registers: [register]
});

export const stripePaymentFailed = new promClient.Counter({
  name: 'stripe_payment_failed_total',
  help: 'Total failed Stripe payments',
  labelNames: ['error_code'],
  registers: [register]
});

export const analysisRunTotal = new promClient.Counter({
  name: 'analysis_run_total',
  help: 'Total analysis runs',
  labelNames: ['tier'],
  registers: [register]
});

export const analysisRunDuration = new promClient.Histogram({
  name: 'analysis_run_duration_seconds',
  help: 'Duration of analysis runs in seconds',
  labelNames: ['tier'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register]
});

export const dbConnectionPoolUsed = new promClient.Gauge({
  name: 'db_connection_pool_used',
  help: 'Database connection pool connections in use',
  registers: [register]
});

export const dbConnectionPoolAvailable = new promClient.Gauge({
  name: 'db_connection_pool_available',
  help: 'Database connection pool available connections',
  registers: [register]
});

export const rateLimitExceeded = new promClient.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total rate limit exceeded errors',
  labelNames: ['tier', 'limit_type'],
  registers: [register]
});

export const getMetricsRegistry = () => register;
