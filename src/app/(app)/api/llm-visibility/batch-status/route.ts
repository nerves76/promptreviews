/**
 * LLM Visibility Batch Status API
 *
 * Poll the status of a batch run or get the latest batch run status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BatchRunRow {
  id: string;
  account_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providers: LLMProvider[];
  total_questions: number;
  processed_questions: number;
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
  question: string;
  question_index: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/llm-visibility/batch-status
 * Get the status of a batch run.
 *
 * Query params:
 * - runId: specific batch run ID
 * - includeItems: include per-question item statuses (default: false)
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
      .from('llm_batch_runs')
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

    // Build response
    const response: {
      runId: string;
      status: string;
      providers: LLMProvider[];
      totalQuestions: number;
      processedQuestions: number;
      successfulChecks: number;
      failedChecks: number;
      progress: number;
      estimatedCredits: number;
      totalCreditsUsed: number;
      errorMessage: string | null;
      createdAt: string;
      startedAt: string | null;
      completedAt: string | null;
      updatedAt: string;
      items?: Array<{
        id: string;
        keywordId: string;
        question: string;
        questionIndex: number;
        status: string;
        errorMessage: string | null;
      }>;
    } = {
      runId: run.id,
      status: run.status,
      providers: run.providers,
      totalQuestions: run.total_questions,
      processedQuestions: run.processed_questions,
      successfulChecks: run.successful_checks,
      failedChecks: run.failed_checks,
      progress: run.total_questions > 0
        ? Math.round((run.processed_questions / run.total_questions) * 100)
        : 0,
      estimatedCredits: run.estimated_credits,
      totalCreditsUsed: run.total_credits_used,
      errorMessage: run.error_message,
      createdAt: run.created_at,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      updatedAt: run.updated_at,
    };

    // Optionally include items
    if (includeItems) {
      const { data: items, error: itemsError } = await serviceSupabase
        .from('llm_batch_run_items')
        .select('*')
        .eq('batch_run_id', run.id)
        .order('created_at', { ascending: true });

      if (!itemsError && items) {
        response.items = (items as BatchRunItemRow[]).map(item => ({
          id: item.id,
          keywordId: item.keyword_id,
          question: item.question,
          questionIndex: item.question_index,
          status: item.status,
          errorMessage: item.error_message,
        }));
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [LLMBatchStatus] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
