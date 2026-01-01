/**
 * Validation utilities for Google Business Page
 * Pure functions that can be used across components/hooks.
 */

import type { CTAType } from '../types/google-business';

/**
 * Character limit for GBP post content
 */
export const POST_CHARACTER_LIMIT = 1500;

/**
 * Get character count for post content
 */
export function getCharacterCount(content: string): number {
  return content.length;
}

/**
 * Get the character limit for posts
 */
export function getCharacterLimit(): number {
  return POST_CHARACTER_LIMIT;
}

/**
 * Check if content exceeds character limit
 */
export function isOverLimit(content: string): boolean {
  return getCharacterCount(content) > getCharacterLimit();
}

/**
 * Validate URL based on CTA type
 * - CALL CTA allows tel: links
 * - Other CTAs require valid HTTP(S) URLs
 */
export function isValidUrl(url: string, ctaType: CTAType): boolean {
  try {
    // Allow tel: links for CALL CTA
    if (ctaType === 'CALL' && url.startsWith('tel:')) {
      return url.length > 4; // Must have something after 'tel:'
    }
    // Standard URL validation for other CTA types
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that post has required content
 */
export function isValidPostContent(content: string): boolean {
  return content.trim().length > 0 && !isOverLimit(content);
}

/**
 * Get remaining characters before limit
 */
export function getRemainingCharacters(content: string): number {
  return getCharacterLimit() - getCharacterCount(content);
}
