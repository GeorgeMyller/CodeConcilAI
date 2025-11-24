import * as Sentry from '@sentry/node';

export const initSentry = (app: any) => {
  if (!process.env.SENTRY_DSN) return Sentry;

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend: (event, hint) => {
        if (event.exception) {
          const error = hint?.originalException as Error | undefined;
          if (error && error.message.includes('ECONNREFUSED')) return null;
        }
        return event;
      }
    });

    // Attach handlers if available
    if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
      app.use(Sentry.Handlers.requestHandler());
    }
    if (Sentry.Handlers && Sentry.Handlers.tracingHandler) {
      app.use(Sentry.Handlers.tracingHandler());
    }
  } catch (err) {
    console.warn('Sentry initialization skipped:', err);
  }

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
