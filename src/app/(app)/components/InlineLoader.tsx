"use client";

/**
 * InlineLoader Component
 * 
 * Lightweight loading spinner for inline content areas (cards, sections, etc.)
 * Now uses StandardLoader for consistency across the app.
 * 
 * @param size - DEPRECATED - kept for backward compatibility (StandardLoader uses fixed 18px size)
 * @param showText - DEPRECATED - kept for backward compatibility (StandardLoader always shows text)  
 * @param className - DEPRECATED - kept for backward compatibility
 * @param text - DEPRECATED - kept for backward compatibility (StandardLoader uses "Loading..." text)
 */

import StandardLoader from "./StandardLoader";

interface InlineLoaderProps {
  size?: number; // Deprecated
  showText?: boolean; // Deprecated
  className?: string; // Deprecated
  text?: string; // Deprecated
}

export default function InlineLoader({ 
  size = 14, // Ignored - kept for compatibility
  showText = false, // Ignored - kept for compatibility
  className = "", // Ignored - kept for compatibility
  text = "Loading..." // Ignored - kept for compatibility
}: InlineLoaderProps = {}) {
  // Always use StandardLoader inline mode for consistency
  return <StandardLoader isLoading={true} mode="inline" />;
}