/**
 * localStorage key constants for Google Business Page
 * Centralizing these prevents typos and makes it easy to find all storage keys.
 */

// Connection state
export const STORAGE_KEY_CONNECTED = 'google-business-connected';
export const STORAGE_KEY_LOCATIONS = 'google-business-locations';
export const STORAGE_KEY_SELECTED_LOCATIONS = 'google-business-selected-locations';
export const STORAGE_KEY_FETCH_ATTEMPTED = 'google-business-fetch-attempted';

// Overview/analytics data
export const STORAGE_KEY_OVERVIEW_DATA = 'google-business-overview-data';

// Post content autosave
export const STORAGE_KEY_POST_CONTENT = 'googleBusinessPostContent';

/**
 * All storage keys used by the Google Business page.
 * Useful for bulk cleanup operations.
 */
export const ALL_STORAGE_KEYS = [
  STORAGE_KEY_CONNECTED,
  STORAGE_KEY_LOCATIONS,
  STORAGE_KEY_SELECTED_LOCATIONS,
  STORAGE_KEY_FETCH_ATTEMPTED,
  STORAGE_KEY_OVERVIEW_DATA,
  STORAGE_KEY_POST_CONTENT,
] as const;

/**
 * Clear all Google Business localStorage data.
 * Used when disconnecting or resetting state.
 */
export function clearAllGoogleBusinessStorage(): void {
  if (typeof window === 'undefined') return;

  ALL_STORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
}
