/**
 * Rank Tracking Batch Status API
 *
 * Poll the status of a batch run or get the latest batch run status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRow {
  id: string;
  account_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_keywords: number;
  processed_keywords: number;
  successful_checks: number;
  failed_checks: number;
  estimated_credits: number;
  total_credits_used: number;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface BatchRunItemRow {
  id: string;
  batch_run_id: string;
  keyword_id: string;
  search_term: string;
  location_code: number | null;
  desktop_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  mobile_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/rank-tracking/batch-status
 * Get the status of a batch run.
 *
 * Query params:
 * - runId: specific batch run ID
 * - includeItems: include per-keyword item statuses (default: false)
 *
 * If no runId provided, returns the most recent batch run for the account.
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
    const runId = searchParams.get('runId');
    const includeItems = searchParams.get('includeItems') === 'true';

    // Build query for batch run
    let query = serviceSupabase
      .from('rank_batch_runs')
      .select('*')
      .eq('account_id', accountId);

    if (runId) {
      query = query.eq('id', runId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data: batchRun, error: runError } = await query.single();

    if (runError || !batchRun) {
      return NextResponse.json(
        { error: 'Batch run not found' },
        { status: 404 }
      );
    }

    const run = batchRun as BatchRunRow;

    // Calculate credits refunded (difference between estimated and used)
    const creditsRefunded = run.estimated_credits - run.total_credits_used;

    // Build response
    const response: {
      runId: string;
      status: string;
      totalKeywords: number;
      processedKeywords: number;
      successfulChecks: number;
      failedChecks: number;
      progress: number;
      estimatedCredits: number;
      totalCreditsUsed: number;
      creditsRefunded: number;
      errorMessage: string | null;
      createdAt: string;
      startedAt: string | null;
      completedAt: string | null;
      updatedAt: string;
      items?: Array<{
        id: string;
        keywordId: string;
        searchTerm: string;
        locationCode: number | null;
        desktopStatus: string;
        mobileStatus: string;
        errorMessage: string | null;
      }>;
    } = {
      runId: run.id,
      status: run.status,
      totalKeywords: run.total_keywords,
      processedKeywords: run.processed_keywords,
      successfulChecks: run.successful_checks,
      failedChecks: run.failed_checks,
      progress: run.total_keywords > 0
        ? Math.round((run.processed_keywords / run.total_keywords) * 100)
        : 0,
      estimatedCredits: run.estimated_credits,
      totalCreditsUsed: run.total_credits_used,
      creditsRefunded: creditsRefunded > 0 ? creditsRefunded : 0,
      errorMessage: run.error_message,
      createdAt: run.created_at,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      updatedAt: run.updated_at,
    };

    // Optionally include items
    if (includeItems) {
      const { data: items, error: itemsError } = await serviceSupabase
        .from('rank_batch_run_items')
        .select('*')
        .eq('batch_run_id', run.id)
        .order('created_at', { ascending: true });

      if (!itemsError && items) {
        response.items = (items as BatchRunItemRow[]).map(item => ({
          id: item.id,
          keywordId: item.keyword_id,
          searchTerm: item.search_term,
          locationCode: item.location_code,
          desktopStatus: item.desktop_status,
          mobileStatus: item.mobile_status,
          errorMessage: item.error_message,
        }));
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [RankBatchStatus] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
