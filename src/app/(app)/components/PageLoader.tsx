"use client";

/**
 * PageLoader Component
 * 
 * Loading state for dashboard pages - shows stars on gradient background
 * without the white PageCard wrapper
 * 
 * @param size - Size of the spinner (default: 16)
 * @param showText - Whether to show "Loading..." text (default: true)
 * @param text - Custom loading text (default: "Loading...")
 */

import FiveStarSpinner from "./FiveStarSpinner";

interface PageLoaderProps {
  size?: number;
  showText?: boolean;
  text?: string;
}

export default function PageLoader({ 
  size = 16, 
  showText = true,
  text = "Loading..."
}: PageLoaderProps = {}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <FiveStarSpinner size={size} />
      {showText && (
        <div className="mt-4 text-base text-white/90 font-medium">{text}</div>
      )}
    </div>
  );
}