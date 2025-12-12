/**
 * Rank Tracking Data Transformers
 *
 * Transform database rows (snake_case) to API response format (camelCase).
 * Follows the pattern established in geo-grid transforms.
 */

import {
  RankKeywordGroup,
  RankGroupKeyword,
  RankCheck,
  GroupSummary,
  SerpFeatures,
  Competitor,
  ScheduleFrequency,
  DeviceType,
} from './types';

// ============================================
// Group Transforms
// ============================================

/**
 * Transform database rank_keyword_groups row to API response format
 */
export function transformGroupToResponse(row: {
  id: string;
  account_id: string;
  name: string;
  device: string;
  location_code: number;
  location_name: string;
  schedule_frequency: string | null;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  schedule_hour: number;
  next_scheduled_at: string | null;
  last_scheduled_run_at: string | null;
  last_checked_at: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  keyword_count?: number;
  avg_position?: number;
}): RankKeywordGroup {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    device: row.device as DeviceType,
    locationCode: row.location_code,
    locationName: row.location_name,
    scheduleFrequency: row.schedule_frequency as ScheduleFrequency | null,
    scheduleDayOfWeek: row.schedule_day_of_week,
    scheduleDayOfMonth: row.schedule_day_of_month,
    scheduleHour: row.schedule_hour,
    nextScheduledAt: row.next_scheduled_at,
    lastScheduledRunAt: row.last_scheduled_run_at,
    lastCheckedAt: row.last_checked_at,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    keywordCount: row.keyword_count,
    avgPosition: row.avg_position,
  };
}

// ============================================
// Group Keyword Transforms
// ============================================

/**
 * Transform database rank_group_keywords row to API response format
 */
export function transformGroupKeywordToResponse(row: {
  id: string;
  group_id: string;
  keyword_id: string;
  account_id: string;
  target_url: string | null;
  is_enabled: boolean;
  created_at: string;
  // Joined from keywords table
  keywords?: {
    phrase: string;
    search_query: string | null;
    review_phrase: string | null;
  };
  // Computed from latest check
  latest_position?: number | null;
  latest_url?: string | null;
  position_change?: number | null;
}): RankGroupKeyword {
  return {
    id: row.id,
    groupId: row.group_id,
    keywordId: row.keyword_id,
    accountId: row.account_id,
    targetUrl: row.target_url,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    phrase: row.keywords?.phrase,
    searchQuery: row.keywords?.search_query ?? undefined,
    reviewPhrase: row.keywords?.review_phrase ?? undefined,
    latestPosition: row.latest_position,
    latestUrl: row.latest_url ?? undefined,
    positionChange: row.position_change,
  };
}

// ============================================
// Check Results Transforms
// ============================================

/**
 * Transform database rank_checks row to API response format
 */
export function transformCheckToResponse(row: {
  id: string;
  account_id: string;
  group_id: string;
  keyword_id: string;
  search_query_used: string;
  position: number | null;
  found_url: string | null;
  matched_target_url: boolean | null;
  serp_features: Record<string, boolean> | null;
  top_competitors: Competitor[] | null;
  api_cost_usd: string | number | null;
  checked_at: string;
  created_at: string;
  // Joined
  keywords?: {
    phrase: string;
  };
}): RankCheck {
  return {
    id: row.id,
    accountId: row.account_id,
    groupId: row.group_id,
    keywordId: row.keyword_id,
    searchQueryUsed: row.search_query_used,
    position: row.position,
    foundUrl: row.found_url,
    matchedTargetUrl: row.matched_target_url,
    serpFeatures: (row.serp_features as unknown) as SerpFeatures | null,
    topCompetitors: row.top_competitors || [],
    apiCostUsd: row.api_cost_usd !== null ? parseFloat(String(row.api_cost_usd)) : 0,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    keywordPhrase: row.keywords?.phrase,
  };
}

// ============================================
// Summary Calculation Helpers
// ============================================

/**
 * Calculate group summary from a list of check results
 *
 * Uses the latest check for each keyword to calculate stats.
 * Returns counts for different position ranges.
 */
export function calculateGroupSummary(checks: RankCheck[]): GroupSummary {
  // Group by keyword and find latest check for each
  const keywordLatestCheck = new Map<string, RankCheck>();

  for (const check of checks) {
    const existing = keywordLatestCheck.get(check.keywordId);
    if (!existing || new Date(check.checkedAt) > new Date(existing.checkedAt)) {
      keywordLatestCheck.set(check.keywordId, check);
    }
  }

  const summary: GroupSummary = {
    totalKeywords: keywordLatestCheck.size,
    keywordsRanking: 0,
    avgPosition: null,
    inTop3: 0,
    inTop10: 0,
    inTop50: 0,
    inTop100: 0,
    notFound: 0,
  };

  let totalPosition = 0;
  let rankingCount = 0;

  keywordLatestCheck.forEach((check) => {
    if (check.position !== null && check.position > 0) {
      summary.keywordsRanking++;
      totalPosition += check.position;
      rankingCount++;

      if (check.position <= 3) {
        summary.inTop3++;
      }
      if (check.position <= 10) {
        summary.inTop10++;
      }
      if (check.position <= 50) {
        summary.inTop50++;
      }
      if (check.position <= 100) {
        summary.inTop100++;
      }
    } else {
      summary.notFound++;
    }
  });

  if (rankingCount > 0) {
    summary.avgPosition = Math.round((totalPosition / rankingCount) * 10) / 10;
  }

  return summary;
}

/**
 * Calculate position change between two checks
 *
 * Returns positive number for improvement (moved up in rankings),
 * negative for decline (moved down), null if no comparison possible.
 */
export function calculatePositionChange(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null) {
    return null;
  }

  // Lower position number is better, so we invert the math
  // Position 3 -> 1 = +2 (improved)
  // Position 1 -> 3 = -2 (declined)
  return previous - current;
}

/**
 * Format position for display
 *
 * Returns human-readable position string with ordinal suffix
 */
export function formatPosition(position: number | null): string {
  if (position === null || position <= 0) {
    return 'Not ranking';
  }

  const suffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${position}${suffix(position)}`;
}

/**
 * Format position change for display
 *
 * Returns human-readable change string with arrow and color
 */
export function formatPositionChange(change: number | null): {
  text: string;
  color: 'green' | 'red' | 'gray';
  icon: '↑' | '↓' | '—';
} {
  if (change === null || change === 0) {
    return { text: 'No change', color: 'gray', icon: '—' };
  }

  if (change > 0) {
    return {
      text: `+${change} positions`,
      color: 'green',
      icon: '↑',
    };
  }

  return {
    text: `${change} positions`,
    color: 'red',
    icon: '↓',
  };
}
