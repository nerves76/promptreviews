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
      
      // Performance monitoring - reduced sampling for better performance
      tracesSampleRate: 0.2,
      
      // Environment configuration
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      
      // Disable debug mode in all environments for better performance
      debug: false,
      
      // **CLIENT-SIDE INTEGRATIONS**
      // Only enable browser-specific integrations
      integrations: [
        // Essential browser integrations
        new Sentry.Integrations.GlobalHandlers(),
        new Sentry.Integrations.TryCatch(),
        new Sentry.Integrations.Breadcrumbs(),
        new Sentry.Integrations.LinkedErrors(),
        new Sentry.Integrations.HttpContext(),
        new Sentry.Integrations.Dedupe(),
        
        // Browser-specific error tracking
        ...(typeof window !== 'undefined' ? [
          new Sentry.Integrations.BrowserTracing({
            tracingOrigins: ['localhost', 'promptreviews.app', /^\//],
          }),
        ] : []),
      ],
      
      // Disable automatic instrumentation discovery
      defaultIntegrations: false,
      
      // Client-specific configuration
      beforeSend: (event) => {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  } catch (error) {
    console.log('Sentry initialization failed:', error);
  }
} 