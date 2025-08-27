/**
 * Enhanced Error Boundary component with Sentry integration
 * This component catches React errors and reports them to Sentry
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DEBUG] Uncaught error:', error, errorInfo);
    
    let eventId: string | undefined;
    
    // Only report to Sentry in production when enabled
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.DISABLE_SENTRY !== 'true') {
      try {
        // Dynamic import to prevent loading Sentry in disabled environments
        import('@sentry/nextjs').then((Sentry) => {
          eventId = Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
            tags: {
              errorBoundary: 'true',
              component: 'ErrorBoundary',
            },
            extra: {
              errorInfo,
              errorBoundaryProps: this.props,
            },
          });
          
          // Update state with error ID for user feedback
          this.setState({ errorId: eventId });
        }).catch((importError) => {
          console.warn('Failed to import Sentry for error reporting:', importError);
        });
      } catch (sentryError) {
        console.warn('Error reporting to Sentry:', sentryError);
      }
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {this.state.errorId && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
            <div className="mt-8 space-y-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Try Again
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorId: undefined })}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 