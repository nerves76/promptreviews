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
      
      // Performance monitoring - reduced sampling for better performance
      tracesSampleRate: 0.2,
      
      // Environment configuration
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      
      // Disable debug mode in all environments for better performance
      debug: false,
    });
  } catch (error) {
    console.log('Sentry initialization failed:', error);
  }
} 