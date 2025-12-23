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

interface EnrichmentData {
  volumeData: ResearchResultData[];
  rankStatus: RankStatusData | null;
  llmResults: LLMVisibilityResult[];
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
    const [volumeResults, rankGroupKeywords, llmResults] = await Promise.all([
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
    ]);

    // Build enrichment map
    const enrichment: Record<string, EnrichmentData> = {};

    // Initialize all keywords with empty data
    for (const keywordId of filteredKeywordIds) {
      enrichment[keywordId] = {
        volumeData: [],
        rankStatus: null,
        llmResults: [],
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

    return NextResponse.json({ enrichment });
  } catch (error: any) {
    console.error('❌ [Keywords] Batch enrich error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
