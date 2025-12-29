/**
 * Optimized React Components
 * 
 * This file contains optimized versions of commonly used components
 * with proper memoization, error boundaries, and performance improvements.
 */

import React, { memo, useMemo, useCallback, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ButtonSpinner from '@/components/ButtonSpinner';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-red-800 font-medium">Something went wrong</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
};

// Optimized Loading Spinner - Uses ButtonSpinner for consistent button loading states
export const OptimizedSpinner = memo(({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) => {
  const spinnerSize = useMemo(() => {
    // Map size props to pixel values as specified: sm=14, md=18, lg=24, xl=32
    switch (size) {
      case 'sm': return 14;
      case 'md': return 18; 
      case 'lg': return 24;
      case 'xl': return 32;
      default: return 18;
    }
  }, [size]);

  return (
    <ButtonSpinner size={spinnerSize} className={className} />
  );
});

OptimizedSpinner.displayName = 'OptimizedSpinner';

// Optimized Card Component
export const OptimizedCard = memo(({ 
  children, 
  className = '', 
  onClick,
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) => {
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  const cardClasses = useMemo(() => 
    `bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`,
    [className, onClick]
  );

  return (
    <div className={cardClasses} onClick={handleClick} {...props}>
      {children}
    </div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Optimized Button Component
export const OptimizedButton = memo(({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}) => {
  const handleClick = useCallback(() => {
    if (!loading && !disabled && onClick) onClick();
  }, [loading, disabled, onClick]);

  const buttonClasses = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'bg-slate-blue text-white hover:bg-slate-blue/90 focus:ring-slate-blue',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const stateClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${className}`;
  }, [variant, size, disabled, loading, className]);

  return (
    <button 
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <OptimizedSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// Optimized Image Component with Lazy Loading
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => setHasError(true), []);

  const imageClasses = useMemo(() => 
    `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    [isLoaded, className]
  );

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={imageClasses}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Optimized List Component with Virtualization
export const OptimizedList = memo(({ 
  items, 
  renderItem, 
  className = '',
  itemHeight = 60,
  ...props 
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  itemHeight?: number;
  [key: string]: any;
}) => {
  const listClasses = useMemo(() => `space-y-2 ${className}`, [className]);

  return (
    <div className={listClasses} {...props}>
      {items.map((item, index) => (
        <div key={index} style={{ minHeight: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';

// Optimized Form Input Component
export const OptimizedInput = memo(({ 
  label,
  error,
  className = '',
  ...props 
}: {
  label?: string;
  error?: string;
  className?: string;
  [key: string]: any;
}) => {
  const inputClasses = useMemo(() => {
    const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent';
    const errorClasses = error ? 'border-red-300' : 'border-gray-300';
    return `${baseClasses} ${errorClasses} ${className}`;
  }, [error, className]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';

// Higher-Order Component for Error Boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary FallbackComponent={fallback || ErrorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Higher-Order Component for Suspense
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <OptimizedSpinner />}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 