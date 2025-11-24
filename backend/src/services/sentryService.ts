import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';

export const initSentry = (app: any) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        app: true,
        request: true,
        serverName: true,
        transaction: true,
        user: ['id', 'email', 'name'],
        authenticated: true,
        cachingHeaders: true,
        ignoredUrls: ['/health', '/api/auth/google/callback']
      })
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend: (event, hint) => {
      // Filter out noisy errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignore specific error types
          if (error.message.includes('ECONNREFUSED')) {
            return null;
          }
        }
      }
      return event;
    }
  });

  // Capture request/response
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: { custom: context }
    });
  } else {
    console.error('❌ Sentry Error:', error, context);
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
};

export const withErrorTracking = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, { args });
      throw error;
    }
  };
};

export default Sentry;
