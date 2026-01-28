/**
 * Rank Tracking Batch History API
 *
 * Returns recent batch runs for the account.
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
 * GET /api/rank-tracking/batch-history
 * Get recent batch runs for the account.
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const { data: batchRuns, error: runsError } = await serviceSupabase
      .from('rank_batch_runs')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (runsError) {
      console.error('❌ [RankBatchHistory] Failed to fetch runs:', runsError);
      return NextResponse.json({ error: 'Failed to fetch batch history' }, { status: 500 });
    }

    const runs = (batchRuns || []).map(run => ({
      runId: run.id,
      status: run.status,
      totalItems: run.total_keywords,
      processedItems: run.processed_keywords,
      successfulChecks: run.successful_checks,
      failedChecks: run.failed_checks,
      creditsUsed: run.total_credits_used || 0,
      creditsRefunded: Math.max(0, (run.estimated_credits || 0) - (run.total_credits_used || 0)),
      createdAt: run.created_at,
      completedAt: run.completed_at,
      errorMessage: run.error_message,
    }));

    return NextResponse.json({ runs });

  } catch (error) {
    console.error('❌ [RankBatchHistory] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
