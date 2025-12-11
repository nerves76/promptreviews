import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getDailySummaries,
  getLatestSummary,
  calculateTrend,
} from '@/features/geo-grid/services/summary-aggregator';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/summary
 * Get daily summaries for trend analysis.
 *
 * Query params:
 * - configId: Config ID to fetch summaries for (optional, defaults to first config)
 * - mode: 'latest' (most recent only) or 'history' (multiple days)
 * - startDate: Filter summaries after this date (YYYY-MM-DD)
 * - endDate: Filter summaries before this date (YYYY-MM-DD)
 * - limit: Max summaries to return (default 30)
 * - includeTrend: Include trend calculation (default true for mode=latest)
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
    const configId = searchParams.get('configId') || undefined;
    const mode = searchParams.get('mode') || 'latest';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const includeTrend = searchParams.get('includeTrend') !== 'false';

    // Get config - by ID if provided, otherwise first config for account
    let config: { id: string } | null = null;

    if (configId) {
      const { data, error } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [GeoGrid] Failed to fetch config:', error);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }
      config = data;
    } else {
      // Backwards compatibility: get first config for account
      const { data, error } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [GeoGrid] Failed to fetch config:', error);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }
      config = data;
    }

    if (!config) {
      return NextResponse.json({
        summary: null,
        summaries: [],
        message: 'No geo grid configuration found.',
      });
    }

    if (mode === 'latest') {
      // Get just the latest summary
      const { summary, error } = await getLatestSummary(
        config.id,
        accountId,
        serviceSupabase
      );

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch summary: ${error}` },
          { status: 500 }
        );
      }

      if (!summary) {
        return NextResponse.json({
          summary: null,
          message: 'No summaries found. Run a rank check first.',
        });
      }

      // Optionally calculate trend
      let trend = null;
      if (includeTrend) {
        // Get the previous day's summary
        const { summaries } = await getDailySummaries(
          config.id,
          accountId,
          serviceSupabase,
          { limit: 2 }
        );

        if (summaries.length >= 2) {
          trend = calculateTrend(summaries[0], summaries[1]);
        }
      }

      return NextResponse.json({
        summary,
        trend,
      });
    } else {
      // Get historical summaries
      const { summaries, error } = await getDailySummaries(
        config.id,
        accountId,
        serviceSupabase,
        { startDate, endDate, limit }
      );

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch summaries: ${error}` },
          { status: 500 }
        );
      }

      // Calculate trends between consecutive days
      const summariesWithTrends = summaries.map((summary, index) => {
        if (index < summaries.length - 1) {
          const trend = calculateTrend(summary, summaries[index + 1]);
          return { ...summary, trend };
        }
        return { ...summary, trend: null };
      });

      return NextResponse.json({
        summaries: summariesWithTrends,
        count: summaries.length,
      });
    }
  } catch (error) {
    console.error('❌ [GeoGrid] Summary GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
