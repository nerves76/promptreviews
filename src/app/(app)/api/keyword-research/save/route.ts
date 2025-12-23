import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { normalizePhrase } from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Research result data structure for saving.
 */
interface ResearchResultInput {
  term: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  searchVolumeTrend: Record<string, unknown> | null;
  monthlySearches: Array<{ month: number; year: number; searchVolume: number }> | null;
  locationCode: number;
  locationName: string;
  /** Optional: link to existing keyword concept */
  keywordId?: string;
}

/**
 * POST /api/keyword-research/save
 *
 * Save a keyword research result. Uses upsert - if a result for the same
 * term+location already exists for this account, it will be updated.
 *
 * Body: ResearchResultInput
 *
 * Returns the saved result with isUpdate flag.
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

    const body: ResearchResultInput = await request.json();

    // Validate required fields
    if (!body.term?.trim()) {
      return NextResponse.json({ error: 'Term is required' }, { status: 400 });
    }
    if (!body.locationCode || !body.locationName) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    const normalizedTerm = normalizePhrase(body.term);

    // Ensure competition is numeric (API might sometimes return strings)
    const competition = typeof body.competition === 'number' ? body.competition : null;

    // Check if result already exists
    const { data: existing } = await serviceSupabase
      .from('keyword_research_results')
      .select('id')
      .eq('account_id', accountId)
      .eq('normalized_term', normalizedTerm)
      .eq('location_code', body.locationCode)
      .maybeSingle();

    const isUpdate = !!existing;

    // Upsert the research result
    const { data: result, error: upsertError } = await serviceSupabase
      .from('keyword_research_results')
      .upsert(
        {
          account_id: accountId,
          term: body.term.trim(),
          normalized_term: normalizedTerm,
          search_volume: body.searchVolume,
          cpc: body.cpc,
          competition: competition,
          competition_level: body.competitionLevel,
          search_volume_trend: body.searchVolumeTrend,
          monthly_searches: body.monthlySearches,
          location_code: body.locationCode,
          location_name: body.locationName,
          keyword_id: body.keywordId || null,
          linked_at: body.keywordId ? new Date().toISOString() : null,
          researched_at: new Date().toISOString(),
        },
        {
          onConflict: 'account_id,normalized_term,location_code',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('❌ [KeywordResearch] Failed to save result:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save research result' },
        { status: 500 }
      );
    }

    console.log(`✅ [KeywordResearch] ${isUpdate ? 'Updated' : 'Saved'} result for "${body.term}"`);

    return NextResponse.json({
      success: true,
      isUpdate,
      result: {
        id: result.id,
        term: result.term,
        normalizedTerm: result.normalized_term,
        searchVolume: result.search_volume,
        cpc: result.cpc ? Number(result.cpc) : null,
        competition: result.competition ? Number(result.competition) : null,
        competitionLevel: result.competition_level,
        searchVolumeTrend: result.search_volume_trend,
        monthlySearches: result.monthly_searches,
        locationCode: result.location_code,
        locationName: result.location_name,
        keywordId: result.keyword_id,
        linkedAt: result.linked_at,
        researchedAt: result.researched_at,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    });
  } catch (error: any) {
    console.error('❌ [KeywordResearch] Save error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
