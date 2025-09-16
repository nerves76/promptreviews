/**
 * Next.js instrumentation file for Sentry server-side initialization
 * This file initializes Sentry for server-side error tracking
 */

export function register() {
  // Completely skip all Sentry code in development or when disabled
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    console.log('📴 Sentry completely disabled - skipping all initialization');
    return;
  }

  // Only execute Sentry code in production when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('🔧 Initializing Sentry for production...');
    
    // Dynamic import to prevent loading Sentry in disabled environments
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        
        // Minimal performance monitoring
        tracesSampleRate: 0.1,
        
        // Environment configuration
        environment: process.env.NODE_ENV,
        
        // Disable all auto-instrumentations to prevent OpenTelemetry noise
        defaultIntegrations: false,
        
        // Only enable essential integrations
        integrations: [
          // Core error tracking only
          Sentry.httpIntegration(),
          Sentry.consoleIntegration(),
        ],
        
        // Disable performance monitoring completely
        beforeSend(event) {
          // Only send errors, not performance data
          if (event.type === 'transaction') {
            return null;
          }
          return event;
        },
        
        // Filter out noise
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'ChunkLoadError',
          'Loading chunk',
          'Network request failed'
        ],
      });
      
      console.log('✅ Sentry initialized successfully for production');
    }).catch((error) => {
      console.error('❌ Failed to initialize Sentry:', error);
    });
  }
} 