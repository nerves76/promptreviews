/**
 * Rank Tracking Service
 *
 * Orchestrates rank checks for tracked keywords across groups.
 * Stores results in the database and tracks API costs.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  RankKeywordGroup,
  RankGroupKeyword,
  RankCheck,
  GroupSummary,
  RankCheckBatchResult,
  RankCheckOptions,
  GetHistoryOptions,
} from '../utils/types';
import {
  transformGroupToResponse,
  transformGroupKeywordToResponse,
  transformCheckToResponse,
  calculateGroupSummary,
  calculatePositionChange,
} from '../utils/transforms';
import { checkRankForDomain, type SerpFeatures } from '../api';
import { captureError } from '@/utils/sentry';

// Use generic SupabaseClient type to avoid strict typing issues
type ServiceSupabase = SupabaseClient<any, any, any>;

// ============================================
// Main Check Function
// ============================================

/**
 * Run rank checks for a keyword group
 *
 * This is the main entry point for running SERP rank checks.
 * It fetches all tracked keywords, checks rankings via DataForSEO,
 * and stores results in the database.
 *
 * @param group - The keyword group to check
 * @param keywords - The keywords to check (if not provided, fetches from DB)
 * @param targetDomain - The domain to track (for URL matching)
 * @param serviceSupabase - Supabase client with service role
 */
export async function runRankChecks(
  group: RankKeywordGroup,
  keywords: RankGroupKeyword[] | null,
  targetDomain: string,
  serviceSupabase: ServiceSupabase,
  options: RankCheckOptions = {}
): Promise<RankCheckBatchResult> {
  const { keywordIds, languageCode = 'en' } = options;
  const errors: string[] = [];
  const results: RankCheck[] = [];
  let totalCost = 0;

  console.log(`🔍 [RankTracking] Starting rank checks for group: ${group.name}`);

  try {
    // 1. Fetch keywords if not provided
    let keywordsToCheck = keywords;
    if (!keywordsToCheck) {
      let query = serviceSupabase
        .from('rank_group_keywords')
        .select(`
          id,
          group_id,
          keyword_id,
          account_id,
          target_url,
          is_enabled,
          created_at,
          keywords (
            phrase,
            search_query,
            review_phrase
          )
        `)
        .eq('group_id', group.id)
        .eq('is_enabled', true);

      if (keywordIds && keywordIds.length > 0) {
        query = query.in('keyword_id', keywordIds);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          checksPerformed: 0,
          totalCost: 0,
          results: [],
          errors: [`Failed to fetch keywords: ${error.message}`],
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          checksPerformed: 0,
          totalCost: 0,
          results: [],
          errors: ['No enabled keywords found in this group. Add keywords first.'],
        };
      }

      keywordsToCheck = data.map((row: any) => transformGroupKeywordToResponse(row));
    }

    // 2. Run checks for each keyword
    console.log(`📊 [RankTracking] Checking ${keywordsToCheck.length} keywords in ${group.name}`);

    const checksToInsert: Array<{
      account_id: string;
      group_id: string;
      keyword_id: string;
      search_query_used: string;
      position: number | null;
      found_url: string | null;
      matched_target_url: boolean | null;
      serp_features: object | null;
      top_competitors: object | null;
      api_cost_usd: number;
      checked_at: string;
      // New SERP visibility columns
      paa_question_count: number;
      paa_ours_count: number;
      ai_overview_present: boolean;
      ai_overview_ours_cited: boolean;
      ai_overview_citation_count: number;
      featured_snippet_present: boolean;
      featured_snippet_ours: boolean;
    }> = [];

    const checkedAt = new Date().toISOString();
    let checkCount = 0;

    for (const keyword of keywordsToCheck) {
      checkCount++;
      try {
        // Determine which query to use
        const searchQuery = keyword.searchQuery || keyword.phrase || '';

        console.log(`   [${checkCount}/${keywordsToCheck.length}] Checking "${searchQuery}"...`);

        // Call DataForSEO SERP API
        const result = await checkRankForDomain({
          keyword: searchQuery,
          locationCode: group.locationCode,
          targetDomain: targetDomain,
          device: group.device,
        });

        // Check if target URL matches (if specified)
        let matchedTargetUrl: boolean | null = null;
        if (keyword.targetUrl && result.url) {
          matchedTargetUrl = result.url.includes(keyword.targetUrl);
        }

        // Extract SERP visibility metrics
        const serpFeatures = result.serpFeatures;
        const paa = serpFeatures.peopleAlsoAsk;
        const ai = serpFeatures.aiOverview;
        const fs = serpFeatures.featuredSnippet;

        console.log(
          `   [${checkCount}/${keywordsToCheck.length}] ✓ Position: ${result.position ?? 'not found'} | ` +
          `PAA: ${paa.ourQuestionCount}/${paa.questions.length} | ` +
          `AI: ${ai.isOursCited ? 'cited' : ai.present ? 'present' : '-'} | ` +
          `FS: ${fs.isOurs ? 'ours' : fs.present ? 'other' : '-'}`
        );
        totalCost += result.cost;

        checksToInsert.push({
          account_id: group.accountId,
          group_id: group.id,
          keyword_id: keyword.keywordId,
          search_query_used: searchQuery,
          position: result.position,
          found_url: result.url,
          matched_target_url: matchedTargetUrl,
          serp_features: serpFeatures,
          top_competitors: result.topCompetitors.length > 0 ? result.topCompetitors : null,
          api_cost_usd: result.cost,
          checked_at: checkedAt,
          // SERP visibility summary columns
          paa_question_count: paa.questions.length,
          paa_ours_count: paa.ourQuestionCount,
          ai_overview_present: ai.present,
          ai_overview_ours_cited: ai.isOursCited,
          ai_overview_citation_count: ai.citations.length,
          featured_snippet_present: fs.present,
          featured_snippet_ours: fs.isOurs,
        });

        // Small delay between API calls to avoid rate limiting
        if (checkCount < keywordsToCheck.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   [${checkCount}/${keywordsToCheck.length}] ✗ Error: ${errorMsg}`);
        errors.push(`Failed to check "${keyword.phrase}": ${errorMsg}`);
        if (error instanceof Error) {
          captureError(error, { feature: 'rank-tracking', keyword: keyword.phrase });
        }
      }
    }

    // 3. Insert results into database
    if (checksToInsert.length > 0) {
      const { data: insertedChecks, error: insertError } = await serviceSupabase
        .from('rank_checks')
        .insert(checksToInsert)
        .select();

      if (insertError) {
        errors.push(`Failed to save check results: ${insertError.message}`);
        if (insertError instanceof Error) {
          captureError(insertError, { feature: 'rank-tracking', groupId: group.id });
        }
      } else if (insertedChecks) {
        // Transform inserted rows to response format
        for (const row of insertedChecks as any[]) {
          const keyword = keywordsToCheck.find((k) => k.keywordId === row.keyword_id);
          results.push(
            transformCheckToResponse({
              ...row,
              keywords: keyword ? { phrase: keyword.phrase || '' } : undefined,
            } as any)
          );
        }
      }
    }

    // 4. Update group's last_checked_at
    await serviceSupabase
      .from('rank_keyword_groups')
      .update({ last_checked_at: checkedAt, updated_at: checkedAt })
      .eq('id', group.id);

    // 5. Track cost in ai_usage table (reuses existing cost tracking)
    if (totalCost > 0) {
      await serviceSupabase.from('ai_usage').insert({
        account_id: group.accountId,
        feature_type: 'rank_tracking',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_usd: totalCost,
        created_at: checkedAt,
      });
    }

    console.log(`✅ [RankTracking] Check complete! ${checksToInsert.length} checks performed, ${errors.length} errors, $${totalCost.toFixed(4)} cost`);

    return {
      success: errors.length === 0,
      checksPerformed: checksToInsert.length,
      totalCost,
      results,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [RankTracking] Fatal error: ${errorMsg}`);
    if (error instanceof Error) {
      captureError(error, { feature: 'rank-tracking', groupId: group.id });
    }

    return {
      success: false,
      checksPerformed: 0,
      totalCost,
      results,
      errors: [...errors, `Fatal error: ${errorMsg}`],
    };
  }
}

// ============================================
// Query Functions
// ============================================

/**
 * Get latest check results for a group
 *
 * Returns the most recent check for each keyword in the group.
 */
export async function getLatestResults(
  groupId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: {
    keywordId?: string;
    limit?: number;
  } = {}
): Promise<RankCheck[]> {
  const { keywordId, limit = 100 } = options;

  try {
    let query = serviceSupabase
      .from('rank_checks')
      .select(`
        *,
        keywords (phrase)
      `)
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ [RankTracking] Failed to fetch latest results: ${error.message}`);
      if (error instanceof Error) {
        captureError(error, { feature: 'rank-tracking', groupId });
      }
      return [];
    }

    return (data || []).map((row: any) => transformCheckToResponse(row));
  } catch (error) {
    console.error(`❌ [RankTracking] Error fetching latest results:`, error);
    if (error instanceof Error) {
      captureError(error, { feature: 'rank-tracking', groupId });
    }
    return [];
  }
}

/**
 * Get current state with positions for a group
 *
 * Returns all keywords with their latest check results and summary stats.
 */
export async function getCurrentState(
  groupId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase
): Promise<{ keywords: RankGroupKeyword[]; summary: GroupSummary }> {
  try {
    // 1. Get all keywords in the group
    const { data: keywordData, error: keywordError } = await serviceSupabase
      .from('rank_group_keywords')
      .select(`
        id,
        group_id,
        keyword_id,
        account_id,
        target_url,
        is_enabled,
        created_at,
        keywords (
          phrase,
          search_query,
          review_phrase
        )
      `)
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .eq('is_enabled', true);

    if (keywordError) {
      throw keywordError;
    }

    if (!keywordData || keywordData.length === 0) {
      return { keywords: [], summary: calculateGroupSummary([]) };
    }

    // 2. Get latest check for each keyword
    const keywordIds = keywordData.map((k: any) => k.keyword_id);

    // Get the most recent checked_at timestamp
    const { data: latestCheck } = await serviceSupabase
      .from('rank_checks')
      .select('checked_at')
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestCheck) {
      // No checks yet, return keywords without positions
      const keywords = keywordData.map((row: any) => transformGroupKeywordToResponse(row));
      return { keywords, summary: calculateGroupSummary([]) };
    }

    // Get all checks from the latest batch
    const { data: checksData, error: checksError } = await serviceSupabase
      .from('rank_checks')
      .select('*')
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .eq('checked_at', (latestCheck as any).checked_at)
      .in('keyword_id', keywordIds);

    if (checksError) {
      throw checksError;
    }

    const checks = (checksData || []).map((row: any) => transformCheckToResponse(row));

    // 3. Get previous check for each keyword (for change calculation)
    const { data: prevChecksData } = await serviceSupabase
      .from('rank_checks')
      .select('keyword_id, position, checked_at')
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .lt('checked_at', (latestCheck as any).checked_at)
      .in('keyword_id', keywordIds)
      .order('checked_at', { ascending: false });

    // Map previous positions by keyword
    const prevPositions = new Map<string, number | null>();
    if (prevChecksData) {
      for (const row of prevChecksData as any[]) {
        if (!prevPositions.has(row.keyword_id)) {
          prevPositions.set(row.keyword_id, row.position);
        }
      }
    }

    // 4. Combine keywords with their latest check data
    const keywords: RankGroupKeyword[] = keywordData.map((row: any) => {
      const latestCheck = checks.find((c) => c.keywordId === row.keyword_id);
      const prevPosition = prevPositions.get(row.keyword_id) ?? null;
      const positionChange = latestCheck
        ? calculatePositionChange(latestCheck.position, prevPosition)
        : null;

      return {
        ...transformGroupKeywordToResponse(row),
        latestPosition: latestCheck?.position ?? null,
        latestUrl: latestCheck?.foundUrl ?? null,
        positionChange,
      };
    });

    // 5. Calculate summary
    const summary = calculateGroupSummary(checks);

    return { keywords, summary };
  } catch (error) {
    console.error(`❌ [RankTracking] Error fetching current state:`, error);
    if (error instanceof Error) {
      captureError(error, { feature: 'rank-tracking', groupId });
    }
    return { keywords: [], summary: calculateGroupSummary([]) };
  }
}

/**
 * Get history for a keyword
 *
 * Returns all checks for a keyword, optionally filtered by date range.
 */
export async function getKeywordHistory(
  groupId: string,
  keywordId: string,
  accountId: string,
  serviceSupabase: ServiceSupabase,
  options: GetHistoryOptions = {}
): Promise<RankCheck[]> {
  const { startDate, endDate, limit = 100 } = options;

  try {
    let query = serviceSupabase
      .from('rank_checks')
      .select(`
        *,
        keywords (phrase)
      `)
      .eq('group_id', groupId)
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('checked_at', startDate);
    }

    if (endDate) {
      query = query.lte('checked_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ [RankTracking] Failed to fetch keyword history: ${error.message}`);
      if (error instanceof Error) {
        captureError(error, { feature: 'rank-tracking', groupId, keywordId });
      }
      return [];
    }

    return (data || []).map((row: any) => transformCheckToResponse(row));
  } catch (error) {
    console.error(`❌ [RankTracking] Error fetching keyword history:`, error);
    if (error instanceof Error) {
      captureError(error, { feature: 'rank-tracking', groupId, keywordId });
    }
    return [];
  }
}

// ============================================
// Exports
// ============================================

export const rankChecker = {
  runRankChecks,
  getLatestResults,
  getCurrentState,
  getKeywordHistory,
};

export default rankChecker;
