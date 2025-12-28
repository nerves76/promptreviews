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
 * GET /api/rank-tracking/history
 * Fetch rank check history for a keyword, formatted for charting.
 *
 * Query params:
 * - keywordId: string (required) - Keyword to fetch history for
 * - searchQuery: string (optional) - Filter by specific search query
 * - days: number (default 90) - Number of days of history to fetch
 * - limit: number (default 500) - Max results to return
 *
 * Returns data grouped by date with desktop/mobile positions.
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
    const keywordId = searchParams.get('keywordId');
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const days = parseInt(searchParams.get('days') || '90', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    if (!keywordId) {
      return NextResponse.json(
        { error: 'keywordId is required' },
        { status: 400 }
      );
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch rank checks for this keyword
    let query = serviceSupabase
      .from('rank_checks')
      .select(`
        id,
        search_query_used,
        location_code,
        location_name,
        device,
        position,
        found_url,
        checked_at
      `)
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .gte('checked_at', startDate.toISOString())
      .order('checked_at', { ascending: true })
      .limit(limit);

    if (searchQuery) {
      query = query.eq('search_query_used', searchQuery);
    }

    const { data: checks, error: checksError } = await query;

    if (checksError) {
      console.error('❌ [RankTracking] Failed to fetch history:', checksError);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    // Get unique search queries for this keyword (for filter dropdown)
    const searchQueries = [...new Set((checks || []).map(c => c.search_query_used))];

    // Group checks by date (YYYY-MM-DD) and device
    const byDate = new Map<string, {
      date: string;
      desktop: { position: number | null; checkedAt: string } | null;
      mobile: { position: number | null; checkedAt: string } | null;
      locationName: string | null;
    }>();

    for (const check of checks || []) {
      const dateKey = check.checked_at.split('T')[0]; // YYYY-MM-DD

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date: dateKey,
          desktop: null,
          mobile: null,
          locationName: check.location_name,
        });
      }

      const entry = byDate.get(dateKey)!;
      const deviceData = {
        position: check.position,
        checkedAt: check.checked_at,
      };

      // Keep the latest check for each device on each day
      if (check.device === 'desktop') {
        if (!entry.desktop || new Date(check.checked_at) > new Date(entry.desktop.checkedAt)) {
          entry.desktop = deviceData;
        }
      } else if (check.device === 'mobile') {
        if (!entry.mobile || new Date(check.checked_at) > new Date(entry.mobile.checkedAt)) {
          entry.mobile = deviceData;
        }
      }
    }

    // Convert to array sorted by date
    const history = Array.from(byDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate summary stats
    const latestDesktop = history.filter(h => h.desktop?.position !== null).slice(-1)[0]?.desktop;
    const latestMobile = history.filter(h => h.mobile?.position !== null).slice(-1)[0]?.mobile;
    const firstDesktop = history.find(h => h.desktop?.position !== null)?.desktop;
    const firstMobile = history.find(h => h.mobile?.position !== null)?.mobile;

    const summary = {
      currentDesktopPosition: latestDesktop?.position ?? null,
      currentMobilePosition: latestMobile?.position ?? null,
      desktopChange: firstDesktop && latestDesktop && firstDesktop.position !== null && latestDesktop.position !== null
        ? firstDesktop.position - latestDesktop.position // Positive = improvement
        : null,
      mobileChange: firstMobile && latestMobile && firstMobile.position !== null && latestMobile.position !== null
        ? firstMobile.position - latestMobile.position
        : null,
      totalChecks: checks?.length || 0,
      dateRange: {
        start: history[0]?.date || null,
        end: history[history.length - 1]?.date || null,
      },
    };

    return NextResponse.json({
      history,
      searchQueries,
      summary,
      keywordId,
    });
  } catch (error) {
    console.error('❌ [RankTracking] History GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
