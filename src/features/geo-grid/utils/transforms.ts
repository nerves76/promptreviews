/**
 * Geo Grid Data Transformers
 *
 * Transform database rows to API response format.
 * Follows the pattern established in keywordUtils.ts
 */

import {
  GGConfig,
  GGTrackedKeyword,
  GGCheckResult,
  GGDailySummary,
  GGCompetitor,
  GGPointSummary,
  CheckPoint,
  PositionBucket,
  ScheduleFrequency,
} from './types';

// ============================================
// Config Transforms
// ============================================

/**
 * Transform database gg_configs row to API response format
 */
export function transformConfigToResponse(row: {
  id: string;
  account_id: string;
  google_business_location_id: string | null;
  center_lat: string | number;
  center_lng: string | number;
  radius_miles: string | number;
  check_points: string[] | CheckPoint[];
  target_place_id: string | null;
  is_enabled: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
  // Scheduling fields (may not exist in old records)
  schedule_frequency?: string | null;
  schedule_day_of_week?: number | null;
  schedule_day_of_month?: number | null;
  schedule_hour?: number | null;
  next_scheduled_at?: string | null;
  last_scheduled_run_at?: string | null;
}): GGConfig {
  return {
    id: row.id,
    accountId: row.account_id,
    googleBusinessLocationId: row.google_business_location_id,
    centerLat: parseFloat(String(row.center_lat)),
    centerLng: parseFloat(String(row.center_lng)),
    radiusMiles: parseFloat(String(row.radius_miles)),
    checkPoints: row.check_points as CheckPoint[],
    targetPlaceId: row.target_place_id,
    isEnabled: row.is_enabled,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Scheduling fields
    scheduleFrequency: (row.schedule_frequency as ScheduleFrequency) || null,
    scheduleDayOfWeek: row.schedule_day_of_week ?? null,
    scheduleDayOfMonth: row.schedule_day_of_month ?? null,
    scheduleHour: row.schedule_hour ?? 9,
    nextScheduledAt: row.next_scheduled_at ?? null,
    lastScheduledRunAt: row.last_scheduled_run_at ?? null,
  };
}

// ============================================
// Tracked Keywords Transforms
// ============================================

/**
 * Transform database gg_tracked_keywords row to API response format
 */
export function transformTrackedKeywordToResponse(row: {
  id: string;
  config_id: string;
  keyword_id: string;
  account_id: string;
  is_enabled: boolean;
  created_at: string;
  keywords?: {
    phrase: string;
    normalized_phrase: string;
    review_usage_count?: number | null;
  };
}): GGTrackedKeyword {
  return {
    id: row.id,
    configId: row.config_id,
    keywordId: row.keyword_id,
    accountId: row.account_id,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    phrase: row.keywords?.phrase,
    normalizedPhrase: row.keywords?.normalized_phrase,
    reviewUsageCount: row.keywords?.review_usage_count ?? 0,
  };
}

// ============================================
// Check Results Transforms
// ============================================

/**
 * Transform database gg_checks row to API response format
 */
export function transformCheckToResponse(row: {
  id: string;
  account_id: string;
  config_id: string;
  keyword_id: string;
  check_point: string;
  point_lat: string | number;
  point_lng: string | number;
  position: number | null;
  position_bucket: string | null;
  business_found: boolean;
  top_competitors: GGCompetitor[] | null;
  our_rating: string | number | null;
  our_review_count: number | null;
  our_place_id: string | null;
  checked_at: string;
  api_cost_usd: string | number | null;
  created_at: string;
  keywords?: {
    phrase: string;
  };
}): GGCheckResult {
  return {
    id: row.id,
    accountId: row.account_id,
    configId: row.config_id,
    keywordId: row.keyword_id,
    checkPoint: row.check_point as CheckPoint,
    pointLat: parseFloat(String(row.point_lat)),
    pointLng: parseFloat(String(row.point_lng)),
    position: row.position,
    positionBucket: (row.position_bucket || 'none') as PositionBucket,
    businessFound: row.business_found,
    topCompetitors: row.top_competitors || [],
    ourRating: row.our_rating !== null ? parseFloat(String(row.our_rating)) : null,
    ourReviewCount: row.our_review_count,
    ourPlaceId: row.our_place_id,
    checkedAt: row.checked_at,
    apiCostUsd: row.api_cost_usd !== null ? parseFloat(String(row.api_cost_usd)) : null,
    createdAt: row.created_at,
    keywordPhrase: row.keywords?.phrase,
  };
}

// ============================================
// Daily Summary Transforms
// ============================================

/**
 * Transform database gg_daily_summary row to API response format
 */
export function transformDailySummaryToResponse(row: {
  id: string;
  account_id: string;
  config_id: string;
  check_date: string;
  total_keywords_checked: number;
  keywords_in_top3: number;
  keywords_in_top10: number;
  keywords_in_top20: number;
  keywords_not_found: number;
  point_summaries: Record<string, GGPointSummary> | null;
  total_api_cost_usd: string | number | null;
  created_at: string;
}): GGDailySummary {
  return {
    id: row.id,
    accountId: row.account_id,
    configId: row.config_id,
    checkDate: row.check_date,
    totalKeywordsChecked: row.total_keywords_checked,
    keywordsInTop3: row.keywords_in_top3,
    keywordsInTop10: row.keywords_in_top10,
    keywordsInTop20: row.keywords_in_top20,
    keywordsNotFound: row.keywords_not_found,
    pointSummaries: (row.point_summaries || {}) as Record<CheckPoint, GGPointSummary>,
    totalApiCostUsd: row.total_api_cost_usd !== null ? parseFloat(String(row.total_api_cost_usd)) : null,
    createdAt: row.created_at,
  };
}

// ============================================
// Summary Calculation Helpers
// ============================================

/**
 * Calculate bundle summary from a list of check results
 *
 * Groups by unique keyword and uses the BEST ranking for each keyword
 * across all grid points. This gives a per-keyword view, not per-check.
 *
 * Example: 2 keywords tracked
 * - "keyword A" ranks #1 at all 5 points → counted as "Top 3" (1 keyword)
 * - "keyword B" not found at any point → counted as "Not Ranking" (1 keyword)
 * Returns: { totalChecked: 2, inTop3: 1, inTop10: 1, inTop20: 1, notFound: 1 }
 */
export function calculateBundleSummary(checks: GGCheckResult[]): {
  totalChecked: number;
  inTop3: number;
  inTop10: number;
  inTop20: number;
  notFound: number;
} {
  // Group checks by keyword and find best position for each
  const keywordBestBucket = new Map<string, PositionBucket>();

  const BUCKET_PRIORITY: Record<PositionBucket, number> = {
    'top3': 1,
    'top10': 2,
    'top20': 3,
    'none': 4,
  };

  for (const check of checks) {
    const currentBest = keywordBestBucket.get(check.keywordId);
    const currentPriority = currentBest ? BUCKET_PRIORITY[currentBest] : 999;
    const checkPriority = BUCKET_PRIORITY[check.positionBucket];

    if (checkPriority < currentPriority) {
      keywordBestBucket.set(check.keywordId, check.positionBucket);
    }
  }

  const summary = {
    totalChecked: keywordBestBucket.size,
    inTop3: 0,
    inTop10: 0,
    inTop20: 0,
    notFound: 0,
  };

  for (const [, bestBucket] of keywordBestBucket) {
    switch (bestBucket) {
      case 'top3':
        summary.inTop3++;
        summary.inTop10++;
        summary.inTop20++;
        break;
      case 'top10':
        summary.inTop10++;
        summary.inTop20++;
        break;
      case 'top20':
        summary.inTop20++;
        break;
      case 'none':
        summary.notFound++;
        break;
    }
  }

  return summary;
}

/**
 * Calculate per-point summaries from a list of check results
 */
export function calculatePointSummaries(
  checks: GGCheckResult[]
): Record<CheckPoint, GGPointSummary> {
  const summaries: Record<string, GGPointSummary> = {};

  for (const check of checks) {
    const point = check.checkPoint;

    if (!summaries[point]) {
      summaries[point] = { top3: 0, top10: 0, top20: 0, none: 0 };
    }

    switch (check.positionBucket) {
      case 'top3':
        summaries[point].top3++;
        summaries[point].top10++;
        summaries[point].top20++;
        break;
      case 'top10':
        summaries[point].top10++;
        summaries[point].top20++;
        break;
      case 'top20':
        summaries[point].top20++;
        break;
      case 'none':
        summaries[point].none++;
        break;
    }
  }

  return summaries as Record<CheckPoint, GGPointSummary>;
}

/**
 * Format visibility as a human-readable string
 * Example: "8/12 phrases visible (Top-20)"
 */
export function formatVisibilitySummary(
  visibleCount: number,
  totalCount: number,
  bucket: 'top3' | 'top10' | 'top20'
): string {
  const bucketLabel = bucket === 'top3' ? 'Top-3' : bucket === 'top10' ? 'Top-10' : 'Top-20';
  return `${visibleCount}/${totalCount} phrases visible (${bucketLabel})`;
}
