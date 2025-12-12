/**
 * Rank Tracking Feature Module
 *
 * Central export point for all rank tracking functionality.
 * Provides types, transforms, and services for Google SERP rank tracking.
 */

// ============================================
// Types
// ============================================

export type {
  RankKeywordGroup,
  RankGroupKeyword,
  RankCheck,
  SerpFeatures,
  Competitor,
  GroupSummary,
  DiscoveryResult,
  DiscoverySuggestion,
  RankCheckBatchResult,
  RankCheckOptions,
  GetHistoryOptions,
  ScheduleFrequency,
  DeviceType,
} from './utils/types';

// ============================================
// Transforms
// ============================================

export {
  transformGroupToResponse,
  transformGroupKeywordToResponse,
  transformCheckToResponse,
  calculateGroupSummary,
  calculatePositionChange,
  formatPosition,
  formatPositionChange,
} from './utils/transforms';

// ============================================
// Services
// ============================================

export {
  runRankChecks,
  getLatestResults,
  getCurrentState,
  getKeywordHistory,
  rankChecker,
} from './services/rank-checker';

export {
  calculateRankCheckCost,
  checkRankTrackingCredits,
  debitRankCheckCredits,
  rankTrackingCredits,
} from './services/credits';

// ============================================
// Hooks (Client-side only)
// ============================================

export {
  useRankGroups,
  useGroupKeywords,
  useRankHistory,
  useLocations,
  useKeywordDiscovery,
} from './hooks';

export type {
  UseRankGroupsReturn,
  CreateGroupData,
  UseGroupKeywordsReturn,
  UseRankHistoryReturn,
  UseLocationsReturn,
  Location,
  UseKeywordDiscoveryReturn,
  KeywordSuggestion,
} from './hooks';

// ============================================
// Components (Client-side only)
// ============================================

export {
  RankGroupCard,
  RankKeywordsTable,
  CreateGroupModal,
  AddKeywordsModal,
  ScheduleSettings,
  LocationPicker,
} from './components';
