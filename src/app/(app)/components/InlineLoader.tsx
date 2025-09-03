"use client";

/**
 * InlineLoader Component
 * 
 * Lightweight loading spinner for inline content areas (cards, sections, etc.)
 * Does not take full screen space like AppLoader
 * 
 * @param size - Size of the spinner (default: 14)
 * @param showText - Whether to show "Loading..." text (default: false) 
 * @param className - Additional classes for the container
 */

import FiveStarSpinner from "./FiveStarSpinner";

interface InlineLoaderProps {
  size?: number;
  showText?: boolean;
  className?: string;
  text?: string;
}

export default function InlineLoader({ 
  size = 14, 
  showText = false,
  className = "",
  text = "Loading..."
}: InlineLoaderProps = {}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <FiveStarSpinner size={size} />
      {showText && (
        <div className="mt-3 text-sm text-white font-medium">{text}</div>
      )}
    </div>
  );
}