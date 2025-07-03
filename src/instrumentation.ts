/**
 * Next.js instrumentation file for Sentry server-side initialization
 * This file initializes Sentry for server-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

export function register() {
  // Skip Sentry initialization if disabled or in development
  if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
    console.log('Sentry disabled via DISABLE_SENTRY environment variable or development mode');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance monitoring - reduced sampling for better performance
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 0.1 : 0.2,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    
    // Disable debug mode in all environments for better performance
    debug: false,
    
    // Before send hook to filter errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      
      // Filter out common non-actionable errors
      const error = hint.originalException;
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as any).message === 'string'
      ) {
        // Filter out common database connection errors
        if ((error as any).message.includes('connection') || 
            (error as any).message.includes('timeout')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add server context
    beforeSendTransaction(event) {
      // Add server-specific context
      return event;
    },
  });
} 