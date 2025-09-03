"use client";

/**
 * PageLoader Component
 * 
 * Loading state for dashboard pages - now wraps StandardLoader for consistency.
 * Provides backward compatibility while ensuring standardized behavior.
 * 
 * @param size - DEPRECATED - kept for backward compatibility (StandardLoader uses fixed size)
 * @param showText - DEPRECATED - kept for backward compatibility (StandardLoader always shows text)
 * @param text - DEPRECATED - kept for backward compatibility (StandardLoader uses fixed text)
 */

import StandardLoader from "./StandardLoader";

interface PageLoaderProps {
  size?: number; // Deprecated
  showText?: boolean; // Deprecated
  text?: string; // Deprecated
}

export default function PageLoader({ 
  size = 16, // Ignored - kept for compatibility
  showText = true, // Ignored - kept for compatibility
  text = "Loading..." // Ignored - kept for compatibility
}: PageLoaderProps = {}) {
  // Always use inline mode - PageLoader is for in-page loading states
  return <StandardLoader isLoading={true} mode="inline" />;
}