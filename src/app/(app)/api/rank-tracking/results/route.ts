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
 * GET /api/rank-tracking/results
 * Fetch rank check results.
 *
 * Query params:
 * - groupId: string (required) - Group to fetch results for
 * - keywordId: string (optional) - Filter by keyword ID
 * - mode: 'current' | 'history' (default 'current')
 * - startDate: string (optional) - Filter results after this date (YYYY-MM-DD)
 * - endDate: string (optional) - Filter results before this date (YYYY-MM-DD)
 * - limit: number (default 100) - Max results to return
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const keywordId = searchParams.get('keywordId') || undefined;
    const mode = searchParams.get('mode') || 'current';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      );
    }

    // Verify group belongs to this account
    const { data: group } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id, last_checked_at')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (mode === 'current') {
      // Get latest position for each keyword
      // We need to get the most recent check for each keyword

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
          checked_at,
          keywords (
            id,
            phrase,
            normalized_phrase
          )
        `)
        .eq('group_id', groupId)
        .eq('account_id', accountId)
        .order('checked_at', { ascending: false })
        .limit(limit);

      if (keywordId) {
        query = query.eq('keyword_id', keywordId);
      }

      const { data: checks, error: checksError } = await query;

      if (checksError) {
        console.error('❌ [RankTracking] Failed to fetch checks:', checksError);
        return NextResponse.json(
          { error: 'Failed to fetch results' },
          { status: 500 }
        );
      }

      // Get latest check per keyword
      const latestByKeyword = new Map<string, any>();
      for (const check of checks || []) {
        if (!latestByKeyword.has(check.keyword_id)) {
          latestByKeyword.set(check.keyword_id, check);
        }
      }

      const results = Array.from(latestByKeyword.values()).map((check) => ({
        id: check.id,
        keywordId: check.keyword_id,
        keyword: check.keywords ? {
          id: check.keywords.id,
          phrase: check.keywords.phrase,
          normalizedPhrase: check.keywords.normalized_phrase,
        } : null,
        searchQueryUsed: check.search_query_used,
        position: check.position,
        foundUrl: check.found_url,
        matchedTargetUrl: check.matched_target_url,
        serpFeatures: check.serp_features,
        topCompetitors: check.top_competitors,
        checkedAt: check.checked_at,
      }));

      return NextResponse.json({
        results,
        mode: 'current',
        lastCheckedAt: group.last_checked_at,
      });
    } else {
      // History mode: get all checks with filters
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
          checked_at,
          keywords (
            id,
            phrase,
            normalized_phrase
          )
        `)
        .eq('group_id', groupId)
        .eq('account_id', accountId)
        .order('checked_at', { ascending: false })
        .limit(limit);

      if (keywordId) {
        query = query.eq('keyword_id', keywordId);
      }

      if (startDate) {
        query = query.gte('checked_at', `${startDate}T00:00:00Z`);
      }

      if (endDate) {
        query = query.lte('checked_at', `${endDate}T23:59:59Z`);
      }

      const { data: checks, error: checksError } = await query;

      if (checksError) {
        console.error('❌ [RankTracking] Failed to fetch checks:', checksError);
        return NextResponse.json(
          { error: 'Failed to fetch results' },
          { status: 500 }
        );
      }

      const results = (checks || []).map((check) => {
        const kwData = check.keywords as unknown;
        const kw = kwData as { id: string; phrase: string; normalized_phrase: string } | null;
        return {
        id: check.id,
        keywordId: check.keyword_id,
        keyword: kw ? {
          id: kw.id,
          phrase: kw.phrase,
          normalizedPhrase: kw.normalized_phrase,
        } : null,
        searchQueryUsed: check.search_query_used,
        position: check.position,
        foundUrl: check.found_url,
        matchedTargetUrl: check.matched_target_url,
        serpFeatures: check.serp_features,
        checkedAt: check.checked_at,
      };
      });

      return NextResponse.json({
        results,
        mode: 'history',
        count: results.length,
        lastCheckedAt: group.last_checked_at,
      });
    }
  } catch (error) {
    console.error('❌ [RankTracking] Results GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
