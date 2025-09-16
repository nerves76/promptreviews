/**
 * Global error handler for React rendering errors
 * This component catches React rendering errors and reports them to Sentry
 */

'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only import and use Sentry if not disabled
    if (process.env.DISABLE_SENTRY !== 'true' && process.env.NODE_ENV !== 'development') {
      const Sentry = require('@sentry/nextjs');
      // Report the error to Sentry
        Sentry.captureException(error, {
        tags: {
          errorType: 'global-error',
          component: 'GlobalError',
        },
        contexts: {
          error: {
            digest: error.digest,
            message: error.message,
            stack: error.stack,
          },
        },
      });
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error.message || 'An unexpected error occurred'}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="mt-8 space-y-6">
              <button
                onClick={reset}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 