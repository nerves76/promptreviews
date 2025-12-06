/**
 * Geo Grid Hooks
 *
 * React hooks for geo grid rank tracking functionality.
 */

export { useGeoGridConfig } from './useGeoGridConfig';
export type {
  UseGeoGridConfigOptions,
  UseGeoGridConfigReturn,
  SaveConfigData,
} from './useGeoGridConfig';

export { useGeoGridResults } from './useGeoGridResults';
export type {
  UseGeoGridResultsOptions,
  UseGeoGridResultsReturn,
  CurrentSummary,
  PointSummary,
  RunCheckResult,
} from './useGeoGridResults';

export { useGeoGridSummary, getTrendDescription, getTrendColor, getTrendIcon } from './useGeoGridSummary';
export type {
  UseGeoGridSummaryOptions,
  UseGeoGridSummaryReturn,
  TrendData,
  SummaryWithTrend,
} from './useGeoGridSummary';

export { useTrackedKeywords } from './useTrackedKeywords';
export type {
  UseTrackedKeywordsOptions,
  UseTrackedKeywordsReturn,
  AddKeywordsResult,
} from './useTrackedKeywords';
