/**
 * Next.js instrumentation client file for Sentry client-side initialization
 * This file initializes Sentry for client-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: 1.0,
    
    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
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
        // Filter out network errors that are common
        if ((error as any).message.includes('Network Error') || 
            (error as any).message.includes('Failed to fetch')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add user context when available
    beforeSendTransaction(event) {
      // Add custom context for transactions
      return event;
    },
  });
}

// Export router transition hook for navigation tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart; 