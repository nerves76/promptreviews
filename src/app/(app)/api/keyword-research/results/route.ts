import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Transformed research result for API response.
 */
interface ResearchResultResponse {
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

function transformResult(row: any): ResearchResultResponse {
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
 * GET /api/keyword-research/results
 *
 * Get saved research results. Supports filtering by keywordId.
 *
 * Query params:
 * - keywordId?: string - Filter results linked to this keyword concept
 * - term?: string - Filter by normalized term
 * - limit?: number - Max results to return (default: 50)
 *
 * Returns array of research results.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');
    const term = searchParams.get('term');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build query
    let query = serviceSupabase
      .from('keyword_research_results')
      .select('*')
      .eq('account_id', accountId)
      .order('researched_at', { ascending: false })
      .limit(Math.min(limit, 100));

    // Apply filters
    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }
    if (term) {
      query = query.ilike('normalized_term', `%${term.toLowerCase()}%`);
    }

    const { data: results, error: queryError } = await query;

    if (queryError) {
      console.error('❌ [KeywordResearch] Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: (results || []).map(transformResult),
      count: results?.length || 0,
    });
  } catch (error: any) {
    console.error('❌ [KeywordResearch] Get results error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
