/**
 * Next.js instrumentation client file for Sentry client-side initialization
 * This file initializes Sentry for client-side error tracking
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
      tracesSampleRate: 0.05, // Very low for client-side
      
      // Environment configuration
      environment: process.env.NODE_ENV,
      
      // **MINIMAL CLIENT INTEGRATIONS**
      integrations: [
        // Only essential client-side tracking
        Sentry.httpClientIntegration({ tracing: false }),
        Sentry.consoleIntegration(),
        Sentry.linkedErrorsIntegration(),
      ],
      
      // Disable automatic instrumentation discovery
      defaultIntegrations: false, // This stops client-side noise too
      
      // Client-specific filtering
      beforeSend: (event) => {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        // Filter out noisy client errors
        const errorMessage = event.exception?.values?.[0]?.value || '';
        
        if (errorMessage.includes('ResizeObserver loop limit exceeded') ||
            errorMessage.includes('Script error') ||
            errorMessage.includes('Network Error') ||
            errorMessage.includes('Non-Error promise rejection captured')) {
          return null;
        }
        
        return event;
      },
      
      // Reduce noise from user interactions
      beforeSendTransaction: (transaction) => {
        // Only send important transactions in production
        if (transaction.name?.includes('pageload') || transaction.name?.includes('navigation')) {
          return transaction;
        }
        return null; // Skip most client transactions to reduce noise
      },
    });
  } catch (error) {
    console.log('Sentry initialization failed:', error);
  }
} 