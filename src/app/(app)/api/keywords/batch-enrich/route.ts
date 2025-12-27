import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getLatestResults } from '@/features/llm-visibility/services/llm-checker';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Transformed research result for API response.
 */
interface ResearchResultData {
  id: string;
  term: string;
  normalizedTerm: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  searchVolumeTrend: Record<string, unknown> | null;
  monthlySearches: Array<{ month: number; year: number; searchVolume: number }> | null;
  locationCode: number;
  locationName: string;
  keywordId: string | null;
  linkedAt: string | null;
  researchedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface RankingData {
  groupId: string;
  groupName: string;
  device: string;
  location: string;
  locationCode: number;
  isEnabled: boolean;
  latestCheck: {
    position: number | null;
    foundUrl: string | null;
    checkedAt: string;
    searchQuery: string;
    positionChange: number | null;
  } | null;
}

interface RankStatusData {
  isTracked: boolean;
  rankings: RankingData[];
}

interface LLMVisibilityResult {
  question: string;
  llmProvider: string;
  domainCited: boolean;
  citationPosition: number | null;
  checkedAt: string;
}

interface GeoGridSummary {
  averagePosition: number | null;
  bestPosition: number | null;
  pointsInTop3: number;
  pointsInTop10: number;
  pointsInTop20: number;
  pointsNotFound: number;
  totalPoints: number;
}

// Per-search-term geo grid data
interface GeoGridSearchTermData {
  searchQuery: string;
  summary: GeoGridSummary;
  lastCheckedAt: string | null;
}

interface GeoGridStatusData {
  isTracked: boolean;
  configId: string | null;
  locationName: string | null;
  lastCheckedAt: string | null;
  /** Overall summary across all search terms */
  summary: GeoGridSummary | null;
  /** Per-search-term geo grid results */
  searchTerms: GeoGridSearchTermData[];
}

interface EnrichmentData {
  volumeData: ResearchResultData[];
  rankStatus: RankStatusData | null;
  llmResults: LLMVisibilityResult[];
  geoGridStatus: GeoGridStatusData | null;
}

function transformResearchResult(row: any): ResearchResultData {
  return {
    id: row.id,
    term: row.term,
    normalizedTerm: row.normalized_term,
    searchVolume: row.search_volume,
    cpc: row.cpc ? Number(row.cpc) : null,
    competition: row.competition ? Number(row.competition) : null,
    competitionLevel: row.competition_level,
    searchVolumeTrend: row.search_volume_trend,
    monthlySearches: row.monthly_searches,
    locationCode: row.location_code,
    locationName: row.location_name,
    keywordId: row.keyword_id,
    linkedAt: row.linked_at,
    researchedAt: row.researched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST /api/keywords/batch-enrich
 *
 * Batch fetch enrichment data (volume, rank status, LLM visibility) for multiple keywords.
 * This reduces the number of API calls from 3N (where N = number of keywords) to 1.
 *
 * Body:
 * - keywordIds: string[] (required, max 100)
 *
 * Returns:
 * - enrichment: Record<keywordId, EnrichmentData>
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array is required' },
        { status: 400 }
      );
    }

    if (keywordIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 keywords per batch' },
        { status: 400 }
      );
    }

    // Verify all keywords belong to this account
    const { data: validKeywords } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('account_id', accountId)
      .in('id', keywordIds);

    const validKeywordIds = new Set(validKeywords?.map(k => k.id) || []);

    // Filter to only valid keywords
    const filteredKeywordIds = keywordIds.filter(id => validKeywordIds.has(id));

    if (filteredKeywordIds.length === 0) {
      return NextResponse.json({ enrichment: {} });
    }

    // Parallel fetch all enrichment data
    const [volumeResults, rankGroupKeywords, llmResults, geoGridTracking, geoGridChecks] = await Promise.all([
      // 1. Fetch volume data for all keywords
      serviceSupabase
        .from('keyword_research_results')
        .select('*')
        .eq('account_id', accountId)
        .in('keyword_id', filteredKeywordIds)
        .order('researched_at', { ascending: false }),

      // 2. Fetch rank group associations for all keywords
      serviceSupabase
        .from('rank_group_keywords')
        .select(`
          id,
          keyword_id,
          group_id,
          is_enabled,
          rank_keyword_groups (
            id,
            name,
            device,
            location_name,
            location_code
          )
        `)
        .eq('account_id', accountId)
        .in('keyword_id', filteredKeywordIds),

      // 3. Fetch LLM visibility results for all keywords
      serviceSupabase
        .from('llm_visibility_checks')
        .select('*')
        .eq('account_id', accountId)
        .in('keyword_id', filteredKeywordIds)
        .order('checked_at', { ascending: false }),

      // 4. Fetch geo grid tracking for all keywords
      serviceSupabase
        .from('gg_tracked_keywords')
        .select(`
          keyword_id,
          config_id,
          is_enabled,
          gg_configs (
            id,
            location_name,
            last_checked_at
          )
        `)
        .eq('account_id', accountId)
        .in('keyword_id', filteredKeywordIds),

      // 5. Fetch geo grid checks for all keywords (recent ones for summary)
      // Now includes search_query for per-search-term tracking
      serviceSupabase
        .from('gg_checks')
        .select('keyword_id, config_id, check_point, position, position_bucket, checked_at, search_query')
        .eq('account_id', accountId)
        .in('keyword_id', filteredKeywordIds)
        .order('checked_at', { ascending: false })
        .limit(1000), // Increased limit to cover all search terms with multiple check points
    ]);

    // Build enrichment map
    const enrichment: Record<string, EnrichmentData> = {};

    // Initialize all keywords with empty data
    for (const keywordId of filteredKeywordIds) {
      enrichment[keywordId] = {
        volumeData: [],
        rankStatus: null,
        llmResults: [],
        geoGridStatus: null,
      };
    }

    // 1. Populate volume data
    if (volumeResults.data) {
      for (const row of volumeResults.data) {
        if (row.keyword_id && enrichment[row.keyword_id]) {
          enrichment[row.keyword_id].volumeData.push(transformResearchResult(row));
        }
      }
    }

    // 2. Populate rank status - need to fetch latest checks for each group
    if (rankGroupKeywords.data && rankGroupKeywords.data.length > 0) {
      // Group by keyword_id
      const keywordGroups: Record<string, typeof rankGroupKeywords.data> = {};
      for (const gk of rankGroupKeywords.data) {
        if (!gk.keyword_id) continue;
        if (!keywordGroups[gk.keyword_id]) {
          keywordGroups[gk.keyword_id] = [];
        }
        keywordGroups[gk.keyword_id].push(gk);
      }

      // For each keyword with rank tracking, fetch latest checks
      for (const [keywordId, groups] of Object.entries(keywordGroups)) {
        const rankings: RankingData[] = [];

        for (const gk of groups) {
          const group = gk.rank_keyword_groups as unknown as {
            id: string;
            name: string;
            device: string;
            location_name: string;
            location_code: number;
          };

          if (!group) continue;

          // Fetch latest check for this keyword+group combo
          const { data: latestCheck } = await serviceSupabase
            .from('rank_checks')
            .select('id, position, found_url, checked_at, search_query_used')
            .eq('keyword_id', keywordId)
            .eq('group_id', group.id)
            .eq('account_id', accountId)
            .order('checked_at', { ascending: false })
            .limit(1)
            .single();

          // Fetch previous check for position change
          const { data: previousCheck } = await serviceSupabase
            .from('rank_checks')
            .select('position')
            .eq('keyword_id', keywordId)
            .eq('group_id', group.id)
            .eq('account_id', accountId)
            .order('checked_at', { ascending: false })
            .range(1, 1)
            .single();

          rankings.push({
            groupId: group.id,
            groupName: group.name,
            device: group.device,
            location: group.location_name,
            locationCode: group.location_code,
            isEnabled: gk.is_enabled,
            latestCheck: latestCheck ? {
              position: latestCheck.position,
              foundUrl: latestCheck.found_url,
              checkedAt: latestCheck.checked_at,
              searchQuery: latestCheck.search_query_used,
              positionChange: previousCheck?.position && latestCheck.position
                ? previousCheck.position - latestCheck.position
                : null,
            } : null,
          });
        }

        if (enrichment[keywordId]) {
          enrichment[keywordId].rankStatus = {
            isTracked: true,
            rankings,
          };
        }
      }
    }

    // 2b. Also fetch standalone rank checks (not associated with a group)
    // These are from quick/manual rank checks
    const { data: standaloneRankChecks } = await serviceSupabase
      .from('rank_checks')
      .select('keyword_id, position, found_url, checked_at, search_query_used, location_code, location_name, device')
      .eq('account_id', accountId)
      .in('keyword_id', filteredKeywordIds)
      .is('group_id', null)
      .order('checked_at', { ascending: false });

    if (standaloneRankChecks && standaloneRankChecks.length > 0) {
      // Group by keyword_id to get unique checks per keyword/term/device/location combo
      const keywordChecks: Record<string, typeof standaloneRankChecks> = {};
      for (const check of standaloneRankChecks) {
        if (!check.keyword_id) continue;
        if (!keywordChecks[check.keyword_id]) {
          keywordChecks[check.keyword_id] = [];
        }
        keywordChecks[check.keyword_id].push(check);
      }

      for (const [keywordId, checks] of Object.entries(keywordChecks)) {
        if (!enrichment[keywordId]) continue;

        // Get unique combinations of search_query + device + location
        const seen = new Set<string>();
        const uniqueChecks: typeof checks = [];
        for (const check of checks) {
          const key = `${check.search_query_used}:${check.device}:${check.location_code}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueChecks.push(check);
          }
        }

        // Convert to RankingData format
        const standaloneRankings: RankingData[] = uniqueChecks.map(check => ({
          groupId: `standalone-${check.search_query_used}-${check.device}-${check.location_code}`,
          groupName: 'Quick check',
          device: check.device || 'desktop',
          location: check.location_name || 'Unknown',
          locationCode: check.location_code || 2840,
          isEnabled: false,
          latestCheck: {
            position: check.position,
            foundUrl: check.found_url,
            checkedAt: check.checked_at,
            searchQuery: check.search_query_used,
            positionChange: null,
          },
        }));

        // Merge with existing rankStatus if any
        if (enrichment[keywordId].rankStatus) {
          enrichment[keywordId].rankStatus.rankings.push(...standaloneRankings);
        } else {
          enrichment[keywordId].rankStatus = {
            isTracked: false,
            rankings: standaloneRankings,
          };
        }
      }
    }

    // 3. Populate LLM visibility results
    if (llmResults.data) {
      for (const row of llmResults.data) {
        if (row.keyword_id && enrichment[row.keyword_id]) {
          enrichment[row.keyword_id].llmResults.push({
            question: row.question,
            llmProvider: row.llm_provider,
            domainCited: row.domain_cited,
            citationPosition: row.citation_position,
            checkedAt: row.checked_at,
          });
        }
      }
    }

    // 4. Populate geo grid status (now with per-search-term data)
    if (geoGridTracking.data && geoGridTracking.data.length > 0) {
      // Build a map of keyword_id -> config info
      const trackingByKeyword = new Map<string, {
        configId: string;
        locationName: string | null;
        lastCheckedAt: string | null;
      }>();

      for (const tk of geoGridTracking.data) {
        if (!tk.keyword_id) continue;
        const config = tk.gg_configs as unknown as {
          id: string;
          location_name: string | null;
          last_checked_at: string | null;
        };
        if (config) {
          trackingByKeyword.set(tk.keyword_id, {
            configId: config.id,
            locationName: config.location_name,
            lastCheckedAt: config.last_checked_at,
          });
        }
      }

      // Build a map of keyword_id -> search_query -> latest check per point
      const checksByKeywordAndTerm = new Map<string, Map<string, Map<string, {
        position: number | null;
        positionBucket: string;
        checkedAt: string;
      }>>>();

      if (geoGridChecks.data) {
        for (const check of geoGridChecks.data) {
          if (!check.keyword_id) continue;
          const searchQuery = check.search_query || 'default';

          if (!checksByKeywordAndTerm.has(check.keyword_id)) {
            checksByKeywordAndTerm.set(check.keyword_id, new Map());
          }

          const termMap = checksByKeywordAndTerm.get(check.keyword_id)!;
          if (!termMap.has(searchQuery)) {
            termMap.set(searchQuery, new Map());
          }

          const pointMap = termMap.get(searchQuery)!;
          const pointKey = `${check.config_id}:${check.check_point}`;

          // Only keep the latest check per point (already ordered by checked_at desc)
          if (!pointMap.has(pointKey)) {
            pointMap.set(pointKey, {
              position: check.position,
              positionBucket: check.position_bucket || 'none',
              checkedAt: check.checked_at,
            });
          }
        }
      }

      // Helper to calculate summary from checks
      const calculateSummary = (checks: Array<{ position: number | null; positionBucket: string }>): GeoGridSummary => {
        const positions = checks.map(c => c.position).filter((p): p is number => p !== null);
        return {
          averagePosition: positions.length > 0
            ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
            : null,
          bestPosition: positions.length > 0 ? Math.min(...positions) : null,
          pointsInTop3: checks.filter(c => c.positionBucket === 'top3').length,
          pointsInTop10: checks.filter(c => c.positionBucket === 'top10' || c.positionBucket === 'top3').length,
          pointsInTop20: checks.filter(c => c.positionBucket !== 'none').length,
          pointsNotFound: checks.filter(c => c.positionBucket === 'none').length,
          totalPoints: checks.length,
        };
      };

      // Calculate summary for each keyword (now with per-search-term data)
      for (const [keywordId, trackingInfo] of trackingByKeyword) {
        if (!enrichment[keywordId]) continue;

        const termChecksMap = checksByKeywordAndTerm.get(keywordId);
        const searchTermsData: GeoGridSearchTermData[] = [];
        let overallSummary: GeoGridSummary | null = null;
        const allChecks: Array<{ position: number | null; positionBucket: string }> = [];

        if (termChecksMap && termChecksMap.size > 0) {
          // Calculate per-search-term summaries
          for (const [searchQuery, pointMap] of termChecksMap) {
            const checks = Array.from(pointMap.values());
            const summary = calculateSummary(checks);
            const latestCheckedAt = checks.length > 0 ? checks[0].checkedAt : null;

            searchTermsData.push({
              searchQuery,
              summary,
              lastCheckedAt: latestCheckedAt,
            });

            // Collect all checks for overall summary
            allChecks.push(...checks);
          }

          // Calculate overall summary across all search terms
          if (allChecks.length > 0) {
            overallSummary = calculateSummary(allChecks);
          }
        }

        enrichment[keywordId].geoGridStatus = {
          isTracked: true,
          configId: trackingInfo.configId,
          locationName: trackingInfo.locationName,
          lastCheckedAt: trackingInfo.lastCheckedAt,
          summary: overallSummary,
          searchTerms: searchTermsData,
        };
      }
    }

    return NextResponse.json({ enrichment });
  } catch (error: any) {
    console.error('❌ [Keywords] Batch enrich error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
