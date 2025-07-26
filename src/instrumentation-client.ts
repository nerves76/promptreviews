/**
 * Next.js instrumentation client file for Sentry client-side initialization
 * This file initializes Sentry for client-side error tracking
 */

export function register() {
  // Completely skip all Sentry code in development or when disabled
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    console.log('📴 Sentry client completely disabled - skipping all initialization');
    return;
  }

  // Only execute Sentry code in production when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('🔧 Initializing Sentry client for production...');
    
    // Dynamic import to prevent loading Sentry in disabled environments
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        
        // Very minimal client-side monitoring
        tracesSampleRate: 0.01,
        
        // Environment configuration
        environment: process.env.NODE_ENV,
        
        // Disable all auto-instrumentations
        defaultIntegrations: false,
        
        // Only essential client integrations
        integrations: [
          Sentry.browserTracingIntegration({ enableLongTask: false }),
          Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        
        // Filter out client-side noise
        beforeSend(event) {
          // Skip performance transactions
          if (event.type === 'transaction') {
            return null;
          }
          
          // Filter out common client errors
          const errorMessage = event.exception?.values?.[0]?.value || '';
          if (errorMessage.includes('Script error') ||
              errorMessage.includes('Network request failed') ||
              errorMessage.includes('Loading chunk')) {
            return null;
          }
          
          return event;
        },
      });
      
      console.log('✅ Sentry client initialized successfully for production');
    }).catch((error) => {
      console.error('❌ Failed to initialize Sentry client:', error);
    });
  }
}

// Export router transition hook for Sentry navigation instrumentation
export function onRouterTransitionStart() {
  // Only execute if Sentry is enabled and in production
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    return;
  }

  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Dynamic import to prevent loading Sentry in disabled environments
    import('@sentry/nextjs').then((Sentry) => {
      return Sentry.captureRouterTransitionStart;
    }).catch(() => {
      // Silent fail if Sentry is not available
    });
  }
} 