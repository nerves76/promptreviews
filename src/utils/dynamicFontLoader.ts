/**
 * Dynamic Font Loader Utility
 * 
 * Efficiently loads Google Fonts on-demand rather than loading all fonts upfront.
 * This significantly improves initial page load times while maintaining font availability.
 */

import { useState, useEffect } from 'react';

// Cache to track loaded fonts and prevent duplicate loads
const loadedFonts = new Set<string>();
const fontLoadPromises = new Map<string, Promise<void>>();

// Google Fonts that require special URL formatting
const FONT_URL_MAP: Record<string, string> = {
  'Open Sans': 'Open+Sans',
  'Source Sans 3': 'Source+Sans+3', 
  'Playfair Display': 'Playfair+Display',
  'Roboto Slab': 'Roboto+Slab',
  'PT Sans': 'PT+Sans',
  'Roboto Condensed': 'Roboto+Condensed',
  'Source Serif 4': 'Source+Serif+4',
  'Noto Sans': 'Noto+Sans',
  'Work Sans': 'Work+Sans',
  'Josefin Sans': 'Josefin+Sans',
  'IBM Plex Sans': 'IBM+Plex+Sans',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans',
  'Courier Prime': 'Courier+Prime',
  'IBM Plex Mono': 'IBM+Plex+Mono',
  'Trebuchet MS': 'Trebuchet+MS',
  'Times New Roman': 'Times+New+Roman',
  'Lucida Console': 'Lucida+Console',
  'Press Start 2P': 'Press+Start+2P',
};

// System fonts that don't need loading
const SYSTEM_FONTS = new Set([
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'Times New Roman', 'Georgia', 'Courier New', 'Lucida Console',
  'Palatino', 'Garamond'
]);

// Pre-loaded fonts from the main layout (no need to load these dynamically)
const PRELOADED_FONTS = new Set(['Inter']);

/**
 * Loads a Google Font dynamically if not already loaded
 * @param fontFamily - The font family name (e.g., "Inter", "Open Sans")
 * @param weights - Font weights to load (default: [400, 600, 700])
 * @returns Promise that resolves when font is loaded
 */
export async function loadFont(
  fontFamily: string,
  weights: number[] = [400, 600, 700]
): Promise<void> {
  // Skip system fonts and preloaded fonts
  if (SYSTEM_FONTS.has(fontFamily) || PRELOADED_FONTS.has(fontFamily)) {
    return Promise.resolve();
  }

  // Skip if already loaded
  const fontKey = `${fontFamily}-${weights.join(',')}`;
  if (loadedFonts.has(fontKey)) {
    return Promise.resolve();
  }

  // Return existing promise if currently loading
  if (fontLoadPromises.has(fontKey)) {
    return fontLoadPromises.get(fontKey)!;
  }

  // Create new loading promise
  const loadPromise = new Promise<void>((resolve, reject) => {
    const linkId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Check if link already exists
    if (document.getElementById(linkId)) {
      loadedFonts.add(fontKey);
      resolve();
      return;
    }

    // Format font URL
    const fontUrl = FONT_URL_MAP[fontFamily] || fontFamily.replace(/\s+/g, '+');
    const weightsStr = weights.join(';');
    
    // Create font link element
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontUrl}:wght@${weightsStr}&display=swap`;
    
    // Add load/error handlers
    link.onload = () => {
      loadedFonts.add(fontKey);
      fontLoadPromises.delete(fontKey);
      resolve();
    };
    
    link.onerror = () => {
      fontLoadPromises.delete(fontKey);
      console.warn(`Failed to load font: ${fontFamily}`);
      reject(new Error(`Failed to load font: ${fontFamily}`));
    };

    // Add to document head
    document.head.appendChild(link);
  });

  fontLoadPromises.set(fontKey, loadPromise);
  return loadPromise;
}

/**
 * Preloads fonts that are likely to be used based on user preferences
 * @param primaryFont - User's primary font selection
 * @param secondaryFont - User's secondary font selection
 */
export function preloadUserFonts(primaryFont?: string, secondaryFont?: string): void {
  if (typeof window === 'undefined') return;

  const fontsToPreload = [
    primaryFont,
    secondaryFont,
    'Inter' // Always ensure Inter is available as fallback
  ].filter((font): font is string => Boolean(font));

  // Preload fonts without waiting
  fontsToPreload.forEach(font => {
    loadFont(font).catch(err => 
      console.warn(`Failed to preload font ${font}:`, err)
    );
  });
}

/**
 * Gets the CSS font-family string with proper fallbacks
 * @param fontFamily - The primary font family
 * @returns CSS font-family string with fallbacks
 */
export function getFontFamilyCSS(fontFamily: string): string {
  if (SYSTEM_FONTS.has(fontFamily)) {
    // System fonts with appropriate fallbacks
    const fallbacks: Record<string, string> = {
      'Arial': 'Arial, -apple-system, BlinkMacSystemFont, sans-serif',
      'Helvetica': 'Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif',
      'Times New Roman': '"Times New Roman", Times, serif',
      'Georgia': 'Georgia, Times, serif',
      'Courier New': '"Courier New", Courier, monospace',
      'Verdana': 'Verdana, Geneva, sans-serif',
      'Tahoma': 'Tahoma, Geneva, sans-serif',
    };
    return fallbacks[fontFamily] || `${fontFamily}, sans-serif`;
  }

  // Google Fonts with system fallbacks
  const serifFonts = ['Playfair Display', 'Merriweather', 'Roboto Slab', 'Source Serif 4'];
  const monoFonts = ['Courier Prime', 'IBM Plex Mono'];
  
  if (serifFonts.includes(fontFamily)) {
    return `"${fontFamily}", Georgia, Times, serif`;
  }
  
  if (monoFonts.includes(fontFamily)) {
    return `"${fontFamily}", "Courier New", Courier, monospace`;
  }
  
  return `"${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}

/**
 * Hook for React components to load fonts
 * @param fontFamily - Font to load
 * @param weights - Font weights
 * @returns Object with loading state and font family CSS
 */
export function useDynamicFont(fontFamily?: string, weights?: number[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!fontFamily || SYSTEM_FONTS.has(fontFamily)) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    loadFont(fontFamily, weights)
      .then(() => {
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setIsLoaded(true); // Still mark as loaded to prevent infinite loading
      });
  }, [fontFamily, weights?.join(',')]);

  return {
    isLoading,
    isLoaded,
    fontFamily: getFontFamilyCSS(fontFamily || 'Inter')
  };
} 