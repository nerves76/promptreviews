import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/rank-tracking/checks
 * Fetch recent rank check results for all keywords in the account.
 * Returns the most recent check per keyword+location+device combo.
 *
 * Query params:
 * - limit: number (default 100) - max results
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    // Fetch most recent checks for each keyword
    const { data: checks, error: checksError } = await supabase
      .from('rank_checks')
      .select(`
        id,
        keyword_id,
        search_query_used,
        location_code,
        location_name,
        device,
        position,
        found_url,
        checked_at
      `)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (checksError) {
      console.error('❌ [RankTracking] Failed to fetch checks:', checksError);
      return NextResponse.json({ error: 'Failed to fetch rank checks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checks: checks || [],
    });
  } catch (error) {
    console.error('❌ [RankTracking] Checks fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
