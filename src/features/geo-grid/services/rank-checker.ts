/**
 * Geo Grid Rank Checker Service
 *
 * Orchestrates rank checks for tracked keywords across grid points.
 * Stores results in the database and tracks API costs.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { checkRankForBusiness, RankCheckResult } from '../api/dataforseo-client';
import { calculateGridPoints } from './point-calculator';
import {
  GGConfig,
  GGTrackedKeyword,
  GGCheckResult,
  CheckPoint,
  GeoPoint,
} from '../utils/types';
import { transformCheckToResponse } from '../utils/transforms';

// Use generic SupabaseClient type to avoid strict typing issues
type ServiceSupabase = SupabaseClient<any, any, any>;

// ============================================
// Types
// ============================================

export interface RankCheckOptions {
  /** Specific keyword IDs to check. If not provided, checks all enabled tracked keywords */
  keywordIds?: string[];
  /** Override language code (default: 'en') */
  languageCode?: string;
}

export interface RankCheckBatchResult {
  success: boolean;
  checksPerformed: number;
  totalCost: number;
  results: GGCheckResult[];
  errors: string[];
}

// ============================================
// Service Functions
// ============================================

/**
 * Run rank checks for a config
 *
 * This is the main entry point for running geo grid rank checks.
 * It fetches all tracked keywords, calculates grid points, and
 * checks each keyword at each point.
 */
export async function runRankChecks(
  config: GGConfig,
  serviceSupabase: ServiceSupabase,
  options: RankCheckOptions = {}
): Promise<RankCheckBatchResult> {
  const { keywordIds, languageCode = 'en' } = options;
  const errors: string[] = [];
  const results: GGCheckResult[] = [];
  let totalCost = 0;

  // Validate config has target place ID
  if (!config.targetPlaceId) {
    return {
      success: false,
      checksPerformed: 0,
      totalCost: 0,
      results: [],
      errors: ['Config is missing target Place ID. Connect a Google Business location first.'],
    };
  }

  // 1. Get tracked keywords
  let keywordsQuery = serviceSupabase
    .from('gg_tracked_keywords')
    .select(`
      id,
      keyword_id,
      keywords (
        id,
        phrase,
        normalized_phrase
      )
    `)
    .eq('config_id', config.id)
    .eq('is_enabled', true);

  if (keywordIds && keywordIds.length > 0) {
    keywordsQuery = keywordsQuery.in('keyword_id', keywordIds);
  }

  const { data: trackedKeywords, error: keywordsError } = await keywordsQuery;

  if (keywordsError) {
    return {
      success: false,
      checksPerformed: 0,
      totalCost: 0,
      results: [],
      errors: [`Failed to fetch tracked keywords: ${keywordsError.message}`],
    };
  }

  if (!trackedKeywords || trackedKeywords.length === 0) {
    return {
      success: false,
      checksPerformed: 0,
      totalCost: 0,
      results: [],
      errors: ['No tracked keywords found. Add keywords to track first.'],
    };
  }

  // 2. Calculate grid points
  const gridPoints = calculateGridPoints({
    centerLat: config.centerLat,
    centerLng: config.centerLng,
    radiusMiles: config.radiusMiles,
    points: config.checkPoints,
  });

  // 3. Run checks for each keyword at each point
  console.log(`📊 [GeoGrid] Checking ${trackedKeywords.length} keywords × ${gridPoints.length} points = ${trackedKeywords.length * gridPoints.length} total checks`);

  let checkCount = 0;
  const totalChecks = trackedKeywords.length * gridPoints.length;

  const checksToInsert: Array<{
    account_id: string;
    config_id: string;
    keyword_id: string;
    check_point: CheckPoint;
    point_lat: number;
    point_lng: number;
    position: number | null;
    position_bucket: string;
    business_found: boolean;
    top_competitors: object | null;
    our_rating: number | null;
    our_review_count: number | null;
    our_place_id: string | null;
    checked_at: string;
    api_cost_usd: number;
  }> = [];

  const checkedAt = new Date().toISOString();

  for (const trackedKeyword of trackedKeywords) {
    const keyword = (trackedKeyword as any).keywords;
    if (!keyword?.phrase) {
      errors.push(`Tracked keyword ${trackedKeyword.keyword_id} has no phrase`);
      continue;
    }

    for (const point of gridPoints) {
      checkCount++;
      try {
        console.log(`   [${checkCount}/${totalChecks}] Checking "${keyword.phrase}" at ${point.label}...`);
        const result = await checkRankForBusiness({
          keyword: keyword.phrase,
          lat: point.lat,
          lng: point.lng,
          targetPlaceId: config.targetPlaceId,
          languageCode,
        });

        console.log(`   [${checkCount}/${totalChecks}] ✓ Position: ${result.position ?? 'not found'}`);
        totalCost += result.cost;

        checksToInsert.push({
          account_id: config.accountId,
          config_id: config.id,
          keyword_id: trackedKeyword.keyword_id,
          check_point: point.label,
          point_lat: point.lat,
          point_lng: point.lng,
          position: result.position,
          position_bucket: result.positionBucket,
          business_found: result.businessFound,
          top_competitors: result.topCompetitors.length > 0 ? result.topCompetitors : null,
          our_rating: result.ourRating,
          our_review_count: result.ourReviewCount,
          our_place_id: config.targetPlaceId,
          checked_at: checkedAt,
          api_cost_usd: result.cost,
        });
      } catch (error) {
        console.error(`   [${checkCount}/${totalChecks}] ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errors.push(
          `Failed to check "${keyword.phrase}" at ${point.label}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }

  // 4. Insert results into database
  if (checksToInsert.length > 0) {
    const { data: insertedChecks, error: insertError } = await serviceSupabase
      .from('gg_checks')
      .insert(checksToInsert)
      .select();

    if (insertError) {
      errors.push(`Failed to save check results: ${insertError.message}`);
    } else if (insertedChecks) {
      // Transform inserted rows to response format
      for (const row of insertedChecks as any[]) {
        const trackedKeyword = trackedKeywords.find(
          (tk: any) => tk.keyword_id === row.keyword_id
        );
        const keyword = (trackedKeyword as any)?.keywords;

        results.push(
          transformCheckToResponse({
            ...row,
            keywords: keyword ? { phrase: keyword.phrase } : undefined,
          } as any)
        );
      }
    }
  }

  // 5. Update config's last_checked_at
  await serviceSupabase
    .from('gg_configs')
    .update({ last_checked_at: checkedAt, updated_at: checkedAt })
    .eq('id', config.id);

  // 6. Track cost in ai_usage table
  if (totalCost > 0) {
    await serviceSupabase.from('ai_usage').insert({
      account_id: config.accountId,
      feature_type: 'geo_grid_check',
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      cost_usd: totalCost,
      created_at: checkedAt,
    });
  }

  console.log(`✅ [GeoGrid] Check complete! ${checksToInsert.length} checks performed, ${errors.length} errors, $${totalCost.toFixed(4)} cost`);

  return {
    success: errors.length === 0,
    checksPerformed: checksToInsert.length,
    totalCost,
    results,
    errors,
  };
}

/**
 * Get the latest check results for a config
 */
export async function getLatestResults(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: {
    keywordId?: string;
    checkPoint?: CheckPoint;
    limit?: number;
  } = {}
): Promise<{ results: GGCheckResult[]; error?: string }> {
  const { keywordId, checkPoint, limit = 100 } = options;

  let query = serviceSupabase
    .from('gg_checks')
    .select(`
      *,
      keywords (phrase)
    `)
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (keywordId) {
    query = query.eq('keyword_id', keywordId);
  }

  if (checkPoint) {
    query = query.eq('check_point', checkPoint);
  }

  const { data, error } = await query;

  if (error) {
    return { results: [], error: error.message };
  }

  const results = (data || []).map((row: any) => transformCheckToResponse(row));

  return { results };
}

/**
 * Get the most recent check for each keyword/point combination
 * Useful for displaying current state
 */
export async function getCurrentState(
  configId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<{ results: GGCheckResult[]; error?: string }> {
  // Get the most recent checked_at timestamp
  const { data: latestCheck, error: latestError } = await serviceSupabase
    .from('gg_checks')
    .select('checked_at')
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single();

  if (latestError && latestError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    return { results: [], error: latestError.message };
  }

  if (!latestCheck) {
    return { results: [] };
  }

  // Get all checks from that timestamp
  const { data, error } = await serviceSupabase
    .from('gg_checks')
    .select(`
      *,
      keywords (phrase)
    `)
    .eq('config_id', configId)
    .eq('account_id', accountId)
    .eq('checked_at', (latestCheck as any).checked_at);

  if (error) {
    return { results: [], error: error.message };
  }

  const results = (data || []).map((row: any) => transformCheckToResponse(row));

  return { results };
}

// ============================================
// Exports
// ============================================

export const rankChecker = {
  runRankChecks,
  getLatestResults,
  getCurrentState,
};

export default rankChecker;
