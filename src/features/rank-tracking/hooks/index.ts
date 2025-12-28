/**
 * Rank Tracking Hooks
 *
 * Export all React hooks for the rank tracking feature.
 */

export { useRankGroups } from './useRankGroups';
export type { UseRankGroupsReturn, CreateGroupData } from './useRankGroups';

export { useGroupKeywords } from './useGroupKeywords';
export type { UseGroupKeywordsReturn } from './useGroupKeywords';

export { useRankHistory } from './useRankHistory';
export type { UseRankHistoryReturn } from './useRankHistory';

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
