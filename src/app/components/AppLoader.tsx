"use client";

/**
 * AppLoader Component
 * 
 * Global loading spinner component that displays a centered animated five-star spinner
 * and loading text. Always vertically centered for consistency.
 * 
 * @param size - Size of the spinner (default: 18)
 * @param variant - DEPRECATED - kept for backward compatibility but always uses centered
 * @param showText - Whether to show "Loading..." text (default: true)
 * @param className - Additional classes for the container
 */

import FiveStarSpinner from "./FiveStarSpinner";

interface AppLoaderProps {
  size?: number;
  variant?: 'default' | 'centered' | 'compact'; // Deprecated - always centered
  showText?: boolean;
  className?: string;
}

export default function AppLoader({ 
  size = 18, 
  variant = 'centered', // Always default to centered
  showText = true,
  className = ""
}: AppLoaderProps = {}) {
  // Use static classes to avoid hydration mismatches
  // Don't use template literals or dynamic class construction
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center transition-opacity duration-300 ease-in-out animate-pulse">
      <FiveStarSpinner size={size} />
      {showText && (
        <div className="mt-4 text-lg text-white font-semibold">Loading…</div>
      )}
    </div>
  );
}
// Cache bust: 1755900095
