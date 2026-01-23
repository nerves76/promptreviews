/**
 * Rank Tracking Hooks
 *
 * Export all React hooks for the rank tracking feature.
 */

export { useLocations } from './useLocations';
export type { UseLocationsReturn, Location } from './useLocations';

export { useKeywordDiscovery } from './useKeywordDiscovery';
export type {
  UseKeywordDiscoveryReturn,
  KeywordSuggestion,
  DiscoveryResult,
  SearchIntent,
  TrendPercentage,
} from './useKeywordDiscovery';

// Note: useRankTrackingTermGroups is intentionally NOT exported here
// to avoid pulling client-side code into server-side cron routes.
// Import directly from './useRankTrackingTermGroups' when needed.
