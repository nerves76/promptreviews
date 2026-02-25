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
// Constants
// ============================================

// Maximum concurrent API requests - balance between speed and avoiding rate limits
const MAX_CONCURRENT_REQUESTS = 2;

// Delay between requests per worker (ms) to avoid overwhelming the API
const REQUEST_DELAY_MS = 800;

// Maximum retry attempts per check
const MAX_RETRIES = 3;

// Time budget for processing. Vercel Pro allows 60s; leave headroom for
// DB writes, summary generation, and the HTTP response.
const MAX_EXECUTION_MS = 45_000;

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
  totalChecks: number;
  totalCost: number;
  results: GGCheckResult[];
  errors: string[];
}

// ============================================
// Helper Functions
// ============================================

interface CheckTask {
  keywordId: string;
  searchQuery: string;
  point: GeoPoint;
}

interface CheckTaskResult {
  task: CheckTask;
  result?: RankCheckResult;
  error?: string;
}

/**
 * Process items in parallel with a concurrency limit using a worker pool.
 * Spawns N workers that each pull items from a shared queue sequentially,
 * ensuring exactly `concurrency` requests are in-flight at any time.
 */
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = MAX_CONCURRENT_REQUESTS,
  delay: number = REQUEST_DELAY_MS,
  deadline?: number
): Promise<{ results: R[]; processedCount: number }> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let processedCount = 0;

  async function worker() {
    let isFirst = true;
    while (nextIndex < items.length) {
      // Stop accepting new tasks if we're past the time budget
      if (deadline && Date.now() >= deadline) {
        break;
      }
      // Stagger requests to avoid rate limits
      if (!isFirst && delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      isFirst = false;
      const index = nextIndex++;
      results[index] = await processor(items[index], index);
      processedCount++;
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { results, processedCount };
}

// ============================================
// Service Functions
// ============================================

/**
 * Run rank checks for a config
 *
 * This is the main entry point for running geo grid rank checks.
 * It fetches all tracked keywords, calculates grid points, and
 * checks each keyword at each point using parallel processing.
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
      totalChecks: 0,
      totalCost: 0,
      results: [],
      errors: ['Config is missing target Place ID. Connect a Google Business location first.'],
    };
  }

  // Store validated placeId for type safety in async callbacks
  const targetPlaceId = config.targetPlaceId;

  // 1. Get tracked keywords with their search terms
  let keywordsQuery = serviceSupabase
    .from('gg_tracked_keywords')
    .select(`
      id,
      keyword_id,
      keywords (
        id,
        phrase,
        normalized_phrase,
        search_terms
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
      totalChecks: 0,
      totalCost: 0,
      results: [],
      errors: [`Failed to fetch tracked keywords: ${keywordsError.message}`],
    };
  }

  if (!trackedKeywords || trackedKeywords.length === 0) {
    return {
      success: false,
      checksPerformed: 0,
      totalChecks: 0,
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
  const checkedAt = new Date().toISOString();

  // Build list of all search terms to check
  interface SearchTermToCheck {
    keywordId: string;
    searchQuery: string;
  }
  const searchTermsToCheck: SearchTermToCheck[] = [];

  for (const trackedKeyword of trackedKeywords) {
    const keyword = (trackedKeyword as any).keywords;
    if (!keyword) {
      errors.push(`Tracked keyword ${trackedKeyword.keyword_id} has no keyword data`);
      continue;
    }

    // Get search terms from the JSONB array, or fallback to phrase
    const searchTerms: Array<{ term: string }> = keyword.search_terms || [];

    if (searchTerms.length > 0) {
      // Use all search terms
      for (const st of searchTerms) {
        if (st.term) {
          searchTermsToCheck.push({
            keywordId: trackedKeyword.keyword_id,
            searchQuery: st.term,
          });
        }
      }
    } else if (keyword.phrase) {
      // Fallback to phrase if no search terms defined
      searchTermsToCheck.push({
        keywordId: trackedKeyword.keyword_id,
        searchQuery: keyword.phrase,
      });
    } else {
      errors.push(`Tracked keyword ${trackedKeyword.keyword_id} has no search terms or phrase`);
    }
  }

  // Build list of all check tasks
  const checkTasks: CheckTask[] = [];
  for (const searchTermInfo of searchTermsToCheck) {
    for (const point of gridPoints) {
      checkTasks.push({
        keywordId: searchTermInfo.keywordId,
        searchQuery: searchTermInfo.searchQuery,
        point,
      });
    }
  }

  const actualTotalChecks = checkTasks.length;
  console.log(`📊 [GeoGrid] Checking ${searchTermsToCheck.length} search terms × ${gridPoints.length} points = ${actualTotalChecks} total checks (${MAX_CONCURRENT_REQUESTS} concurrent)`);

  // Process checks with concurrency limit and a time budget.
  // Each result is saved to DB IMMEDIATELY so nothing is lost if we
  // stop early due to the deadline.
  const deadline = Date.now() + MAX_EXECUTION_MS;
  let completedCount = 0;
  let successfulInserts = 0;

  const { processedCount } = await processInParallel<CheckTask, CheckTaskResult>(
    checkTasks,
    async (task) => {
      try {
        let result;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            result = await checkRankForBusiness({
              keyword: task.searchQuery,
              lat: task.point.lat,
              lng: task.point.lng,
              targetPlaceId: targetPlaceId,
              languageCode,
            });
            break; // Success — exit retry loop
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < MAX_RETRIES) {
              const backoff = 1000 * attempt + Math.random() * 500;
              console.warn(`   ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed for "${task.searchQuery}" at ${task.point.label}: ${lastError.message}. Retrying in ${Math.round(backoff)}ms...`);
              await new Promise((r) => setTimeout(r, backoff));
            }
          }
        }

        if (!result) {
          throw lastError || new Error('All retry attempts failed');
        }

        completedCount++;

        // Save result to DB immediately (incremental save prevents data loss on timeout)
        const { error: insertErr } = await serviceSupabase
          .from('gg_checks')
          .insert({
            account_id: config.accountId,
            config_id: config.id,
            keyword_id: task.keywordId,
            search_query: task.searchQuery,
            check_point: task.point.label,
            point_lat: task.point.lat,
            point_lng: task.point.lng,
            position: result.position,
            position_bucket: result.positionBucket,
            business_found: result.businessFound,
            top_competitors: result.topCompetitors.length > 0 ? result.topCompetitors : null,
            our_rating: result.ourRating,
            our_review_count: result.ourReviewCount,
            our_place_id: targetPlaceId,
            checked_at: checkedAt,
            api_cost_usd: result.cost,
          });

        if (insertErr) {
          errors.push(`DB save failed for "${task.searchQuery}" at ${task.point.label}: ${insertErr.message}`);
        } else {
          successfulInserts++;
          totalCost += result.cost;
        }

        console.log(`   [${completedCount}/${actualTotalChecks}] ✓ "${task.searchQuery}" at ${task.point.label}: pos ${result.position ?? 'not found'}`);

        return { task, result };
      } catch (error) {
        completedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`"${task.searchQuery}" at ${task.point.label}: ${errorMsg}`);
        console.error(`   [${completedCount}/${actualTotalChecks}] ✗ "${task.searchQuery}" at ${task.point.label}: ${errorMsg}`);
        return { task, error: errorMsg };
      }
    },
    MAX_CONCURRENT_REQUESTS,
    REQUEST_DELAY_MS,
    deadline
  );

  if (processedCount < actualTotalChecks) {
    const skipped = actualTotalChecks - processedCount;
    console.warn(`⏱️ [GeoGrid] Time budget reached — ${processedCount}/${actualTotalChecks} processed, ${skipped} skipped`);
    errors.push(`Time limit reached: ${skipped} of ${actualTotalChecks} checks were not completed. Run again to finish remaining checks.`);
  }

  // 4. Update config's last_checked_at
  if (successfulInserts > 0) {
    await serviceSupabase
      .from('gg_configs')
      .update({ last_checked_at: checkedAt, updated_at: checkedAt })
      .eq('id', config.id);
  }

  // 5. Track cost in ai_usage table
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

  console.log(`✅ [GeoGrid] Check complete! ${successfulInserts}/${actualTotalChecks} saved, ${errors.length} errors, $${totalCost.toFixed(4)} cost`);

  return {
    success: successfulInserts > 0,
    checksPerformed: successfulInserts,
    totalChecks: actualTotalChecks,
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
