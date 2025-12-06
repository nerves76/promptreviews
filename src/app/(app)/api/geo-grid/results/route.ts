import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { CheckPoint } from '@/features/geo-grid/utils/types';
import { getLatestResults, getCurrentState } from '@/features/geo-grid/services/rank-checker';
import { calculateCurrentSummary } from '@/features/geo-grid/services/summary-aggregator';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/results
 * Get rank check results.
 *
 * Query params:
 * - mode: 'current' (latest batch only) or 'history' (multiple results)
 * - keywordId: Filter by keyword ID
 * - checkPoint: Filter by check point (center, n, s, e, w)
 * - startDate: Filter results after this date (YYYY-MM-DD)
 * - endDate: Filter results before this date (YYYY-MM-DD)
 * - limit: Max results to return (default 100)
 * - includeSummary: Include current summary stats (default true for mode=current)
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
    const mode = searchParams.get('mode') || 'current';
    const keywordId = searchParams.get('keywordId') || undefined;
    const checkPoint = searchParams.get('checkPoint') as CheckPoint | undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const includeSummary = searchParams.get('includeSummary') !== 'false';

    // Get config for this account
    const { data: config, error: configError } = await serviceSupabase
      .from('gg_configs')
      .select('id, last_checked_at')
      .eq('account_id', accountId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('❌ [GeoGrid] Failed to fetch config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    if (!config) {
      return NextResponse.json({
        results: [],
        summary: null,
        message: 'No geo grid configuration found.',
      });
    }

    // Fetch results based on mode
    if (mode === 'current') {
      // Get the latest batch of results
      const { results, error } = await getCurrentState(
        config.id,
        accountId,
        serviceSupabase
      );

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch results: ${error}` },
          { status: 500 }
        );
      }

      // Optionally include summary
      let summary = null;
      if (includeSummary) {
        summary = await calculateCurrentSummary(
          config.id,
          accountId,
          serviceSupabase
        );
      }

      return NextResponse.json({
        results,
        summary,
        lastCheckedAt: config.last_checked_at,
      });
    } else {
      // Get historical results with filters
      const { results, error } = await getLatestResults(
        config.id,
        accountId,
        serviceSupabase,
        {
          keywordId,
          checkPoint,
          limit,
        }
      );

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch results: ${error}` },
          { status: 500 }
        );
      }

      // Filter by date if provided
      let filteredResults = results;
      if (startDate) {
        const start = new Date(startDate);
        filteredResults = filteredResults.filter(
          (r) => new Date(r.checkedAt) >= start
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredResults = filteredResults.filter(
          (r) => new Date(r.checkedAt) <= end
        );
      }

      return NextResponse.json({
        results: filteredResults,
        count: filteredResults.length,
        lastCheckedAt: config.last_checked_at,
      });
    }
  } catch (error) {
    console.error('❌ [GeoGrid] Results GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
