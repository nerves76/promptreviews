'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import Icon from '@/components/Icon';

export interface SectionErrorBoundaryProps {
  /** The section name for error messages */
  sectionName: string;
  /** The children to render */
  children: ReactNode;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * SectionErrorBoundary Component
 *
 * Wraps sidebar sections to catch and display errors gracefully.
 * Prevents one broken section from crashing the entire sidebar.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.sectionName} section:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50/80 border border-red-100/50 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Icon name="FaExclamationTriangle" className="w-4 h-4" />
            <span className="text-sm font-medium">{this.props.sectionName} error</span>
          </div>
          <p className="text-xs text-red-500 mb-3">
            Something went wrong loading this section.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
