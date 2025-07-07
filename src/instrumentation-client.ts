/**
 * Next.js instrumentation client file for Sentry client-side initialization
 * This file initializes Sentry for client-side error tracking
 */

// Completely disable Sentry in development to prevent performance issues
export function register() {
  // Early return if Sentry is disabled
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    console.log('Sentry disabled via DISABLE_SENTRY environment variable or development mode');
    return; // No-op when Sentry is disabled
  }

  // Only import Sentry when actually needed
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance monitoring - reduced sampling for better performance
    tracesSampleRate: 0.2,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    
    // Disable debug mode in all environments for better performance
    debug: false,
    
    // Before send hook to filter errors
    beforeSend(event: any, hint: any) {
      // Filter out common non-actionable errors
      const error = hint.originalException;
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as any).message === 'string'
      ) {
        // Filter out common client-side errors that don't need tracking
        if ((error as any).message.includes('ResizeObserver') || 
            (error as any).message.includes('Script error')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add client context
    beforeSendTransaction(event: any) {
      // Add client-specific context
      return event;
    },
  });
} 