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
 * GET /api/rank-tracking/groups/[id]/history
 *
 * Fetches rank check history for a specific group.
 * Optionally filter by keyword ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get optional keyword filter
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');

    // Verify group belongs to account
    const { data: group, error: groupError } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Build query for rank checks
    let query = serviceSupabase
      .from('rank_checks')
      .select(`
        id,
        keyword_id,
        search_query_used,
        position,
        found_url,
        matched_target_url,
        serp_features,
        top_competitors,
        api_cost_usd,
        created_at,
        keywords (
          id,
          phrase,
          search_query
        )
      `)
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }

    const { data: checks, error: checksError } = await query;

    if (checksError) {
      console.error('❌ [RankTracking] Failed to fetch history:', checksError);
      return NextResponse.json(
        { error: 'Failed to fetch rank history' },
        { status: 500 }
      );
    }

    // Transform results
    const results = (checks || []).map((check: any) => ({
      id: check.id,
      keywordId: check.keyword_id,
      phrase: check.keywords?.phrase || null,
      searchQuery: check.search_query_used,
      position: check.position,
      foundUrl: check.found_url,
      matchedTargetUrl: check.matched_target_url,
      serpFeatures: check.serp_features,
      topCompetitors: check.top_competitors,
      apiCost: check.api_cost_usd,
      checkedAt: check.created_at,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('❌ [RankTracking] History GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
