/**
 * Utility functions for extracting and formatting styles for share review images
 * Extracts styling from Prompt Pages and Business settings for quote card generation
 */

import { businesses, prompt_pages } from '@/generated/prisma';

export interface ShareImageStyles {
  // Background styling
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  gradientStart?: string;
  gradientMiddle?: string;
  gradientEnd?: string;

  // Text colors
  primaryColor: string;
  secondaryColor: string;
  textColor: string;

  // Fonts
  primaryFont: string;
  secondaryFont: string;

  // Branding
  logoUrl?: string;
  businessName: string;

  // Star rating color
  starColor: string;
}

/**
 * Extract styling configuration from Prompt Page and Business data
 * Priority: Prompt Page settings > Business defaults > App defaults
 */
export function extractShareImageStyles(
  promptPage: Partial<prompt_pages>,
  business: Partial<businesses>
): ShareImageStyles {
  // Extract background settings
  const backgroundType = (business.background_type as 'solid' | 'gradient') || 'gradient';
  const backgroundColor = business.background_color || '#FFFFFF';
  const gradientStart = business.gradient_start || '#4F46E5';
  const gradientMiddle = business.gradient_middle || '#818CF8';
  const gradientEnd = business.gradient_end || '#C7D2FE';

  // Extract color settings
  const primaryColor = business.primary_color || '#4F46E5';
  const secondaryColor = business.secondary_color || '#818CF8';
  const textColor = business.text_color || '#1F2937';

  // Extract font settings
  const primaryFont = business.primary_font || 'Inter';
  const secondaryFont = business.secondary_font || 'Inter';

  // Extract branding
  const logoUrl = business.logo_url || undefined;
  const businessName = business.name || 'Customer Review';

  // Star color typically matches primary color
  const starColor = primaryColor;

  return {
    backgroundColor,
    backgroundType,
    gradientStart: backgroundType === 'gradient' ? gradientStart : undefined,
    gradientMiddle: backgroundType === 'gradient' ? gradientMiddle : undefined,
    gradientEnd: backgroundType === 'gradient' ? gradientEnd : undefined,
    primaryColor,
    secondaryColor,
    textColor,
    primaryFont,
    secondaryFont,
    logoUrl,
    businessName,
    starColor,
  };
}

/**
 * Truncate review text to specified length with ellipsis
 */
export function truncateReviewText(text: string, maxLength: number = 180): string {
  if (!text) return '';

  // Remove extra whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ');

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Try to break at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    // If we found a space reasonably close to the end, use it
    return truncated.substring(0, lastSpace) + '...';
  }

  // Otherwise just hard truncate
  return truncated + '...';
}

/**
 * Generate background style string for OG image
 */
export function getBackgroundStyle(styles: ShareImageStyles): string {
  if (styles.backgroundType === 'gradient' && styles.gradientStart) {
    return `linear-gradient(135deg, ${styles.gradientStart} 0%, ${styles.gradientMiddle || styles.gradientStart} 50%, ${styles.gradientEnd || styles.gradientStart} 100%)`;
  }

  return styles.backgroundColor;
}

/**
 * Get font family string for OG image
 * Note: OG image generation has limited font support
 */
export function getFontFamily(fontName: string): string {
  // Map custom fonts to web-safe fallbacks for OG generation
  const fontMap: Record<string, string> = {
    'Inter': 'sans-serif',
    'Roboto': 'sans-serif',
    'Open Sans': 'sans-serif',
    'Lato': 'sans-serif',
    'Montserrat': 'sans-serif',
    'Poppins': 'sans-serif',
    'Playfair Display': 'serif',
    'Merriweather': 'serif',
    'Georgia': 'serif',
    'Times New Roman': 'serif',
  };

  return fontMap[fontName] || 'sans-serif';
}

/**
 * Generate CSS style object for the quote card
 */
export function getQuoteCardStyles(styles: ShareImageStyles) {
  return {
    background: getBackgroundStyle(styles),
    color: styles.textColor,
    fontFamily: getFontFamily(styles.primaryFont),
  };
}

/**
 * Validate that a color string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Ensure color has valid format, return default if invalid
 */
export function sanitizeColor(color: string | undefined | null, defaultColor: string): string {
  if (!color) return defaultColor;
  if (isValidHexColor(color)) return color;
  return defaultColor;
}
