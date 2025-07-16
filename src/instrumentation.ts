/**
 * Next.js instrumentation file for Sentry server-side initialization
 * This file initializes Sentry for server-side error tracking
 */

export function register() {
  // Completely disable Sentry in development to prevent performance issues
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    console.log('Sentry disabled via DISABLE_SENTRY environment variable or development mode');
    return; // No-op when Sentry is disabled
  }

  try {
    // Only import Sentry when actually needed
    const Sentry = require('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Minimal performance monitoring to reduce overhead
      tracesSampleRate: 0.1, // Reduced from 0.2
      
      // Environment configuration
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      
      // Disable debug mode in all environments for better performance
      debug: false,
      
      // **MINIMAL INTEGRATIONS - ONLY WHAT YOU NEED**
      integrations: [
        // Essential error tracking
        new Sentry.Integrations.Http({ tracing: false }), // Disable HTTP tracing
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.LinkedErrors(),
        
        // Skip all database instrumentations since you use Supabase
        // Skip Redis, MongoDB, MySQL, etc. since you don't use them
      ],
      
      // **DISABLE ALL AUTO-INSTRUMENTATIONS TO ELIMINATE WARNINGS**
      defaultIntegrations: false, // This stops the OpenTelemetry spam
      autoInstrumentMiddleware: false,
      autoInstrumentServerFunctions: false,
      
      // Only capture what matters
      beforeSend: (event) => {
        // Filter out noisy errors
        const errorMessage = event.exception?.values?.[0]?.value || '';
        
        // Skip common non-critical errors
        if (errorMessage.includes('ResizeObserver loop limit exceeded') ||
            errorMessage.includes('Non-Error promise rejection captured') ||
            errorMessage.includes('Script error')) {
          return null;
        }
        
        return event;
      },
    });
  } catch (error) {
    console.log('Sentry initialization failed:', error);
  }
} 