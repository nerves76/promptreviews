/**
 * Concept Schedule Run Status API
 *
 * Check the status of a queued concept check run.
 * Used by frontend to poll for completion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/concept-schedule/run-status?runId=xxx
 * Get status of a specific run.
 *
 * GET /api/concept-schedule/run-status?keywordId=xxx
 * Get latest run for a keyword.
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

    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');
    const keywordId = searchParams.get('keywordId');

    if (!runId && !keywordId) {
      return NextResponse.json({ error: 'runId or keywordId is required' }, { status: 400 });
    }

    let query = serviceSupabase
      .from('concept_check_runs')
      .select('*')
      .eq('account_id', accountId);

    if (runId) {
      query = query.eq('id', runId);
    } else if (keywordId) {
      query = query.eq('keyword_id', keywordId).order('created_at', { ascending: false }).limit(1);
    }

    const { data: run, error: runError } = await query.single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({
      runId: run.id,
      keywordId: run.keyword_id,
      status: run.status,
      searchRankStatus: run.search_rank_status,
      geoGridStatus: run.geo_grid_status,
      llmVisibilityStatus: run.llm_visibility_status,
      reviewMatchingStatus: run.review_matching_status,
      totalCreditsUsed: run.total_credits_used,
      errorMessage: run.error_message,
      createdAt: run.created_at,
      startedAt: run.started_at,
      completedAt: run.completed_at,
    });

  } catch (error) {
    console.error('❌ [RunStatus] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
