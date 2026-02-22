"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for the dashboard layout.
 *
 * Catches React rendering errors inside the dashboard, shows a
 * user-friendly fallback with a retry button, and reports the
 * error to Sentry (if available) without leaking internal details.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always log server-side / console for debugging
    console.error("[DashboardErrorBoundary] Uncaught error:", error, errorInfo);

    // Report to Sentry when available
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      import("@sentry/nextjs")
        .then((Sentry) => {
          Sentry.captureException(error, {
            contexts: {
              react: { componentStack: errorInfo.componentStack },
            },
            tags: { errorBoundary: "DashboardErrorBoundary" },
          });
        })
        .catch(() => {
          // Sentry unavailable; already logged to console above
        });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-gray-100">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-7 w-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An unexpected error occurred while loading this page. You can try
            again or refresh the page.
          </p>

          {/* Show error message only in development */}
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-left text-red-700 overflow-auto max-h-32 border border-gray-200">
              {this.state.error.message}
            </pre>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default DashboardErrorBoundary;
