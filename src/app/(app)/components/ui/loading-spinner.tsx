import * as React from "react";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
} as const;

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
} as const;

export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: "xs" | "sm" | "md" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * Centralized loading spinner wrapping FaSpinner + animate-spin.
 *
 * Usage:
 * ```tsx
 * <LoadingSpinner />                          // default md, inherits text color
 * <LoadingSpinner size="sm" />                // small
 * <LoadingSpinner size="lg" className="text-slate-blue" />
 * ```
 */
export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  return (
    <Icon
      name="FaSpinner"
      size={iconSizes[size]}
      className={cn("animate-spin", sizeClasses[size], className)}
      aria-label={label}
    />
  );
}
