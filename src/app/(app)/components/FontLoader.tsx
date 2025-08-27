/**
 * FontLoader Component
 * 
 * Dynamically loads fonts for prompt pages based on user's style preferences.
 * This component should be used in prompt pages to ensure the correct fonts are loaded.
 */

"use client";

import { useEffect } from 'react';
import { loadFont, preloadUserFonts } from '@/utils/dynamicFontLoader';

interface FontLoaderProps {
  /** Primary font to load */
  primaryFont?: string;
  /** Secondary font to load */
  secondaryFont?: string;
  /** Whether to preload fonts (default: true) */
  preload?: boolean;
  /** Additional fonts to load */
  additionalFonts?: string[];
}

export default function FontLoader({ 
  primaryFont, 
  secondaryFont, 
  preload = true,
  additionalFonts = []
}: FontLoaderProps) {
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preload user's preferred fonts
    if (preload) {
      preloadUserFonts(primaryFont, secondaryFont);
    }

    // Load additional fonts if specified
    if (additionalFonts.length > 0) {
      additionalFonts.forEach(font => {
        loadFont(font).catch(err => 
          console.warn(`Failed to load additional font ${font}:`, err)
        );
      });
    }
  }, [primaryFont, secondaryFont, preload, additionalFonts]);

  // This component doesn't render anything
  return null;
} 