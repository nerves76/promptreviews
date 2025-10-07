/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with size variants
 */

'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div role="status" className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-white/30 border-t-white rounded-full animate-spin`}
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
