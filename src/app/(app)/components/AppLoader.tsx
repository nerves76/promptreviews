"use client";

/**
 * AppLoader Component
 * 
 * Global loading spinner component - now wraps StandardLoader for consistency.
 * Provides backward compatibility while ensuring standardized behavior.
 * 
 * @param size - DEPRECATED - kept for backward compatibility (StandardLoader uses fixed size)
 * @param variant - DEPRECATED - kept for backward compatibility but ignored
 * @param showText - DEPRECATED - kept for backward compatibility (StandardLoader always shows text)
 * @param className - DEPRECATED - kept for backward compatibility but ignored
 */

import StandardLoader from "./StandardLoader";

interface AppLoaderProps {
  size?: number; // Deprecated
  variant?: 'default' | 'centered' | 'compact'; // Deprecated
  showText?: boolean; // Deprecated
  className?: string; // Deprecated
}

export default function AppLoader({ 
  size = 18, // Ignored - kept for compatibility
  variant = 'centered', // Ignored - kept for compatibility
  showText = true, // Ignored - kept for compatibility
  className = "" // Ignored - kept for compatibility
}: AppLoaderProps = {}) {
  // Always use fullPage mode - AppLoader is for full-page loading states
  return <StandardLoader isLoading={true} mode="fullPage" />;
}
// Cache bust: 1755900095
