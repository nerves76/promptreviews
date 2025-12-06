/**
 * Geo Grid Summary Aggregator Service
 *
 * Generates daily summaries from individual rank checks.
 * Summaries are used for trend display and reduce query load.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  GGCheckResult,
  GGDailySummary,
  GGPointSummary,
  CheckPoint,
} from '../utils/types';
import {
  transformCheckToResponse,
  transformDailySummaryToResponse,
  calculateBundleSummary,
  calculatePointSummaries,
} from '../utils/transforms';

// Use generic SupabaseClient type to avoid strict typing issues
type ServiceSupabase = SupabaseClient<any, any, any>;

// ============================================
// Types
// ============================================

export interface GenerateSummaryOptions {
  /** Date to generate summary for (defaults to today) */
  date?: Date;
  /** Force regeneration even if summary exists */
  force?: boolean;
}

export interface GenerateSummaryResult {
  success: boolean;
  summary?: GGDailySummary;
  error?: string;
  alreadyExists?: boolean;
}

// ============================================
// Service Functions
// ============================================

/**
 * Generate a daily summary for a config
 *
 * Aggregates all checks from a given date into a single summary row.
 * Used for trend display and to reduce query load on historical data.
 */
export async function generateDailySummary(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: GenerateSummaryOptions = {}
): Promise<GenerateSummaryResult> {
  const { date = new Date(), force = false } = options;

  // Format date as YYYY-MM-DD
  const checkDate = date.toISOString().split('T')[0];

  // Check if summary already exists
  if (!force) {
    const { data: existing } = await serviceSupabase
      .from('gg_daily_summary')
      .select('id')
      .eq('config_id', configId)
      .eq('account_id', accountId)
      .eq('check_date', checkDate)
      .single();

    if (existing) {
      return {
        success: true,
        alreadyExists: true,
      };
    }
  }

  // Get all checks for this date
  const startOfDay = `${checkDate}T00:00:00.000Z`;
  const endOfDay = `${checkDate}T23:59:59.999Z`;

  const { data: checks, error: checksError } = await serviceSupabase
    .from('gg_checks')
    .select('*')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .gte('checked_at', startOfDay)
    .lte('checked_at', endOfDay);

  if (checksError) {
    return {
      success: false,
      error: `Failed to fetch checks: ${checksError.message}`,
    };
  }

  if (!checks || checks.length === 0) {
    return {
      success: false,
      error: `No checks found for date ${checkDate}`,
    };
  }

  // Transform checks to response format
  const transformedChecks = checks.map((row) => transformCheckToResponse(row));

  // Calculate summaries
  const bundleSummary = calculateBundleSummary(transformedChecks);
  const pointSummaries = calculatePointSummaries(transformedChecks);

  // Calculate total cost
  const totalCost = transformedChecks.reduce(
    (sum, check) => sum + (check.apiCostUsd || 0),
    0
  );

  // Upsert summary
  const summaryData = {
    account_id: accountId,
    config_id: configId,
    check_date: checkDate,
    total_keywords_checked: bundleSummary.totalChecked,
    keywords_in_top3: bundleSummary.inTop3,
    keywords_in_top10: bundleSummary.inTop10,
    keywords_in_top20: bundleSummary.inTop20,
    keywords_not_found: bundleSummary.notFound,
    point_summaries: pointSummaries,
    total_api_cost_usd: totalCost,
  };

  const { data: inserted, error: insertError } = await serviceSupabase
    .from('gg_daily_summary')
    .upsert(summaryData, {
      onConflict: 'account_id,check_date',
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      error: `Failed to save summary: ${insertError.message}`,
    };
  }

  return {
    success: true,
    summary: transformDailySummaryToResponse(inserted),
  };
}

/**
 * Get daily summaries for a config
 */
export async function getDailySummaries(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<{ summaries: GGDailySummary[]; error?: string }> {
  const { startDate, endDate, limit = 30 } = options;

  let query = serviceSupabase
    .from('gg_daily_summary')
    .select('*')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .order('check_date', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('check_date', startDate);
  }

  if (endDate) {
    query = query.lte('check_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return { summaries: [], error: error.message };
  }

  const summaries = (data || []).map((row) => transformDailySummaryToResponse(row));

  return { summaries };
}

/**
 * Get the latest summary for a config
 */
export async function getLatestSummary(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<{ summary?: GGDailySummary; error?: string }> {
  const { data, error } = await serviceSupabase
    .from('gg_daily_summary')
    .select('*')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .order('check_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { error: error.message };
  }

  if (!data) {
    return {};
  }

  return { summary: transformDailySummaryToResponse(data) };
}

/**
 * Calculate a real-time summary from current checks
 * (without storing in database)
 */
export async function calculateCurrentSummary(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<{
  totalChecked: number;
  inTop3: number;
  inTop10: number;
  inTop20: number;
  notFound: number;
  pointSummaries: Record<CheckPoint, GGPointSummary>;
  totalCost: number;
  lastCheckedAt: string | null;
  error?: string;
}> {
  // Get the most recent batch of checks
  const { data: latestCheck } = await serviceSupabase
    .from('gg_checks')
    .select('checked_at')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single();

  if (!latestCheck) {
    return {
      totalChecked: 0,
      inTop3: 0,
      inTop10: 0,
      inTop20: 0,
      notFound: 0,
      pointSummaries: {} as Record<CheckPoint, GGPointSummary>,
      totalCost: 0,
      lastCheckedAt: null,
    };
  }

  const { data: checks, error } = await serviceSupabase
    .from('gg_checks')
    .select('*')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .eq('checked_at', latestCheck.checked_at);

  if (error) {
    return {
      totalChecked: 0,
      inTop3: 0,
      inTop10: 0,
      inTop20: 0,
      notFound: 0,
      pointSummaries: {} as Record<CheckPoint, GGPointSummary>,
      totalCost: 0,
      lastCheckedAt: null,
      error: error.message,
    };
  }

  const transformedChecks = (checks || []).map((row) => transformCheckToResponse(row));
  const bundleSummary = calculateBundleSummary(transformedChecks);
  const pointSummaries = calculatePointSummaries(transformedChecks);
  const totalCost = transformedChecks.reduce(
    (sum, check) => sum + (check.apiCostUsd || 0),
    0
  );

  return {
    ...bundleSummary,
    pointSummaries,
    totalCost,
    lastCheckedAt: latestCheck.checked_at,
  };
}

/**
 * Calculate trend between two summaries
 */
export function calculateTrend(
  current: GGDailySummary,
  previous: GGDailySummary
): {
  top3Change: number;
  top10Change: number;
  top20Change: number;
  direction: 'improving' | 'declining' | 'stable';
} {
  const top3Change = current.keywordsInTop3 - previous.keywordsInTop3;
  const top10Change = current.keywordsInTop10 - previous.keywordsInTop10;
  const top20Change = current.keywordsInTop20 - previous.keywordsInTop20;

  // Determine overall direction based on top-10 visibility
  let direction: 'improving' | 'declining' | 'stable' = 'stable';
  if (top10Change > 0) {
    direction = 'improving';
  } else if (top10Change < 0) {
    direction = 'declining';
  }

  return {
    top3Change,
    top10Change,
    top20Change,
    direction,
  };
}

// ============================================
// Exports
// ============================================

export const summaryAggregator = {
  generateDailySummary,
  getDailySummaries,
  getLatestSummary,
  calculateCurrentSummary,
  calculateTrend,
};

export default summaryAggregator;
