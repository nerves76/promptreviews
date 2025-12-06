/**
 * Geo Grid Rank Tracker
 *
 * Feature for tracking Google Maps/Local Pack visibility
 * across geographic points around a business location.
 *
 * @module features/geo-grid
 */

// ============================================
// Types
// ============================================
export * from './utils/types';

// ============================================
// Utilities
// ============================================
export * from './utils/transforms';

// ============================================
// Services
// ============================================
export { default as pointCalculator } from './services/point-calculator';
export {
  calculateDestinationPoint,
  calculateGridPoints,
  calculateDistance,
  getBearingForPoint,
  getPointLabel,
  validateCoordinates,
  validateRadius,
  validateCheckPoints,
  validateGridConfig,
} from './services/point-calculator';

export { default as rankChecker } from './services/rank-checker';
export {
  runRankChecks,
  getLatestResults,
  getCurrentState,
} from './services/rank-checker';
export type { RankCheckOptions, RankCheckBatchResult } from './services/rank-checker';

export { default as summaryAggregator } from './services/summary-aggregator';
export {
  generateDailySummary,
  getDailySummaries,
  getLatestSummary,
  calculateCurrentSummary,
  calculateTrend,
} from './services/summary-aggregator';
export type { GenerateSummaryOptions, GenerateSummaryResult } from './services/summary-aggregator';

// ============================================
// API Client
// ============================================
export { default as dataForSEOClient } from './api/dataforseo-client';
export {
  searchGoogleMaps,
  checkRankForBusiness,
  batchCheckRanks,
  testConnection,
} from './api/dataforseo-client';
export type { MapsSearchParams, MapsSearchResult, RankCheckResult } from './api/dataforseo-client';

// ============================================
// Hooks (Client-side)
// ============================================
export {
  useGeoGridConfig,
  useGeoGridResults,
  useGeoGridSummary,
  useTrackedKeywords,
  getTrendDescription,
  getTrendColor,
  getTrendIcon,
} from './hooks';
export type {
  UseGeoGridConfigOptions,
  UseGeoGridConfigReturn,
  SaveConfigData,
  UseGeoGridResultsOptions,
  UseGeoGridResultsReturn,
  CurrentSummary,
  PointSummary,
  RunCheckResult,
  UseGeoGridSummaryOptions,
  UseGeoGridSummaryReturn,
  TrendData,
  SummaryWithTrend,
  UseTrackedKeywordsOptions,
  UseTrackedKeywordsReturn,
  AddKeywordsResult,
} from './hooks';

// ============================================
// Components (Client-side)
// ============================================
export {
  GeoGridSetupWizard,
  GeoGridMap,
  GeoGridGoogleMap,
  GeoGridPointModal,
  GeoGridResultsTable,
  GeoGridTrendCard,
  GeoGridKeywordPicker,
} from './components';
export type { ViewAsBusiness } from './components';
