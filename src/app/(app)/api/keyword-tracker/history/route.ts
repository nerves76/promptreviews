/**
 * Keyword Tracker History Endpoint
 *
 * Fetches historical keyword analysis runs for an account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Use service role to bypass RLS - we've already verified account access above
    const serviceSupabase = createServiceRoleClient();

    // Fetch analysis history
    const { data: analyses, error: fetchError } = await serviceSupabase
      .from('keyword_analysis_runs')
      .select('*')
      .eq('account_id', accountId)
      .order('run_date', { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error('[keyword-tracker/history] Error fetching keyword analysis history:', {
        error: fetchError,
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        accountId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch analysis history',
          details: fetchError.message,
          code: fetchError.code
        },
        { status: 500 }
      );
    }

    // Map to response format
    const history = (analyses || []).map(analysis => ({
      id: analysis.id,
      runDate: analysis.run_date,
      reviewCountAnalyzed: analysis.review_count_analyzed,
      dateRangeStart: analysis.date_range_start,
      dateRangeEnd: analysis.date_range_end,
      keywordsAnalyzed: analysis.keywords_analyzed,
      results: analysis.results_json,
      totalMentions: analysis.total_mentions,
      keywordsWithMentions: analysis.keywords_with_mentions
    }));

    return NextResponse.json({
      success: true,
      analyses: history,
      total: history.length
    });

  } catch (error) {
    console.error('[keyword-tracker/history] Unexpected error:', error);
    console.error('[keyword-tracker/history] Error stack:', error instanceof Error ? error.stack : 'no stack');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch history',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
