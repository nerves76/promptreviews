/**
 * Centralized loader configuration to ensure consistency across the app
 */

export const LOADER_VARIANTS = {
  // Full-page loaders (initial page load, auth states)
  FULL_PAGE: 'centered' as const,
  
  // Dashboard content loaders (when content is loading within dashboard)
  DASHBOARD_CONTENT: 'centered' as const,
  
  // Modal/overlay loaders
  MODAL: 'centered' as const,
  
  // Inline content loaders (loading within a card or section)
  INLINE: 'centered' as const,
} as const;

export type LoaderVariant = 'default' | 'centered' | 'compact';

/**
 * Get the appropriate loader variant for a given context
 */
export function getLoaderVariant(context: keyof typeof LOADER_VARIANTS): LoaderVariant {
  return LOADER_VARIANTS[context];
}