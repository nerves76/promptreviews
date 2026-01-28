/**
 * Admin Batch Monitor API
 *
 * Provides overview of all batch runs across the system and admin actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { refundFeature } from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Time thresholds for "stuck" detection (in minutes)
const STUCK_THRESHOLD_MINUTES = 15;

interface BatchRun {
  id: string;
  type: 'rank' | 'llm' | 'concept' | 'analysis';
  accountId: string;
  accountName?: string;
  status: string;
  progress: number;
  total: number;
  startedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
  estimatedCredits: number;
  creditsUsed: number;
  idempotencyKey: string | null;
  isStuck: boolean;
  minutesElapsed: number;
}

/**
 * GET /api/admin/batch-monitor
 * Get all batch runs across the system
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const now = new Date();
    const runs: BatchRun[] = [];

    // Fetch rank batch runs
    const rankQuery = serviceSupabase
      .from('rank_batch_runs')
      .select(`
        id, account_id, status, total_keywords, processed_keywords,
        started_at, created_at, error_message, estimated_credits,
        total_credits_used, idempotency_key
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeCompleted) {
      rankQuery.in('status', ['pending', 'processing']);
    }

    const { data: rankRuns } = await rankQuery;

    for (const run of rankRuns || []) {
      const startTime = run.started_at ? new Date(run.started_at) : new Date(run.created_at);
      const minutesElapsed = Math.round((now.getTime() - startTime.getTime()) / 60000);
      const isStuck = ['pending', 'processing'].includes(run.status) &&
                      minutesElapsed > STUCK_THRESHOLD_MINUTES &&
                      run.processed_keywords === 0;

      runs.push({
        id: run.id,
        type: 'rank',
        accountId: run.account_id,
        status: run.status,
        progress: run.processed_keywords || 0,
        total: run.total_keywords || 0,
        startedAt: run.started_at,
        createdAt: run.created_at,
        errorMessage: run.error_message,
        estimatedCredits: run.estimated_credits || 0,
        creditsUsed: run.total_credits_used || 0,
        idempotencyKey: run.idempotency_key,
        isStuck,
        minutesElapsed,
      });
    }

    // Fetch LLM batch runs
    const llmQuery = serviceSupabase
      .from('llm_batch_runs')
      .select(`
        id, account_id, status, total_questions, processed_questions,
        started_at, created_at, error_message, estimated_credits,
        total_credits_used, idempotency_key
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeCompleted) {
      llmQuery.in('status', ['pending', 'processing']);
    }

    const { data: llmRuns } = await llmQuery;

    for (const run of llmRuns || []) {
      const startTime = run.started_at ? new Date(run.started_at) : new Date(run.created_at);
      const minutesElapsed = Math.round((now.getTime() - startTime.getTime()) / 60000);
      const isStuck = ['pending', 'processing'].includes(run.status) &&
                      minutesElapsed > STUCK_THRESHOLD_MINUTES &&
                      run.processed_questions === 0;

      runs.push({
        id: run.id,
        type: 'llm',
        accountId: run.account_id,
        status: run.status,
        progress: run.processed_questions || 0,
        total: run.total_questions || 0,
        startedAt: run.started_at,
        createdAt: run.created_at,
        errorMessage: run.error_message,
        estimatedCredits: run.estimated_credits || 0,
        creditsUsed: run.total_credits_used || 0,
        idempotencyKey: run.idempotency_key,
        isStuck,
        minutesElapsed,
      });
    }

    // Fetch concept check runs
    const conceptQuery = serviceSupabase
      .from('concept_check_runs')
      .select(`
        id, account_id, status, started_at, created_at, error_message,
        total_credits_used,
        search_rank_enabled, search_rank_status,
        geo_grid_enabled, geo_grid_status,
        llm_visibility_enabled, llm_visibility_status,
        review_matching_enabled, review_matching_status
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeCompleted) {
      conceptQuery.in('status', ['pending', 'processing']);
    }

    const { data: conceptRuns } = await conceptQuery;

    for (const run of conceptRuns || []) {
      const startTime = run.started_at ? new Date(run.started_at) : new Date(run.created_at);
      const minutesElapsed = Math.round((now.getTime() - startTime.getTime()) / 60000);

      // Calculate progress based on check types
      let total = 0;
      let completed = 0;
      if (run.search_rank_enabled) {
        total++;
        if (['completed', 'failed'].includes(run.search_rank_status)) completed++;
      }
      if (run.geo_grid_enabled) {
        total++;
        if (['completed', 'failed'].includes(run.geo_grid_status)) completed++;
      }
      if (run.llm_visibility_enabled) {
        total++;
        if (['completed', 'failed'].includes(run.llm_visibility_status)) completed++;
      }
      if (run.review_matching_enabled) {
        total++;
        if (['completed', 'failed'].includes(run.review_matching_status)) completed++;
      }

      const isStuck = ['pending', 'processing'].includes(run.status) &&
                      minutesElapsed > STUCK_THRESHOLD_MINUTES &&
                      completed === 0;

      runs.push({
        id: run.id,
        type: 'concept',
        accountId: run.account_id,
        status: run.status,
        progress: completed,
        total: total || 1,
        startedAt: run.started_at,
        createdAt: run.created_at,
        errorMessage: run.error_message,
        estimatedCredits: run.total_credits_used || 0,
        creditsUsed: run.total_credits_used || 0,
        idempotencyKey: null,
        isStuck,
        minutesElapsed,
      });
    }

    // Fetch analysis batch runs
    const analysisQuery = serviceSupabase
      .from('analysis_batch_runs')
      .select(`
        id, account_id, status, total_items, processed_items,
        started_at, created_at, error_message, estimated_credits,
        total_credits_used, idempotency_key
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeCompleted) {
      analysisQuery.in('status', ['pending', 'processing']);
    }

    const { data: analysisRuns } = await analysisQuery;

    for (const run of analysisRuns || []) {
      const startTime = run.started_at ? new Date(run.started_at) : new Date(run.created_at);
      const minutesElapsed = Math.round((now.getTime() - startTime.getTime()) / 60000);
      const isStuck = ['pending', 'processing'].includes(run.status) &&
                      minutesElapsed > STUCK_THRESHOLD_MINUTES &&
                      (run.processed_items || 0) === 0;

      runs.push({
        id: run.id,
        type: 'analysis',
        accountId: run.account_id,
        status: run.status,
        progress: run.processed_items || 0,
        total: run.total_items || 0,
        startedAt: run.started_at,
        createdAt: run.created_at,
        errorMessage: run.error_message,
        estimatedCredits: run.estimated_credits || 0,
        creditsUsed: run.total_credits_used || 0,
        idempotencyKey: run.idempotency_key,
        isStuck,
        minutesElapsed,
      });
    }

    // Sort by created_at descending
    runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get account names for display
    const accountIds = [...new Set(runs.map(r => r.accountId))];
    if (accountIds.length > 0) {
      const { data: accounts } = await serviceSupabase
        .from('accounts')
        .select('id, name')
        .in('id', accountIds);

      const accountMap = new Map((accounts || []).map(a => [a.id, a.name]));
      runs.forEach(run => {
        run.accountName = accountMap.get(run.accountId) || run.accountId.slice(0, 8);
      });
    }

    // Summary stats
    const activeRuns = runs.filter(r => ['pending', 'processing'].includes(r.status));
    const stuckRuns = runs.filter(r => r.isStuck);
    const failedRuns = runs.filter(r => r.status === 'failed');

    return NextResponse.json({
      runs,
      summary: {
        total: runs.length,
        active: activeRuns.length,
        stuck: stuckRuns.length,
        failed: failedRuns.length,
      },
    });

  } catch (error) {
    console.error('❌ [BatchMonitor] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/batch-monitor
 * Admin actions on batch runs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, runId, runType } = body;

    if (!action || !runId || !runType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Map run type to table name
    const tableMap: Record<string, string> = {
      rank: 'rank_batch_runs',
      llm: 'llm_batch_runs',
      concept: 'concept_check_runs',
      analysis: 'analysis_batch_runs',
    };

    const tableName = tableMap[runType];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid run type' }, { status: 400 });
    }

    // Get the run
    const { data: run, error: runError } = await serviceSupabase
      .from(tableName)
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    switch (action) {
      case 'force_fail': {
        // Mark as failed and issue refund
        const estimatedCredits = run.estimated_credits || 0;
        const usedCredits = run.total_credits_used || 0;
        const refundAmount = estimatedCredits - usedCredits;

        await serviceSupabase
          .from(tableName)
          .update({
            status: 'failed',
            error_message: 'Manually cancelled by admin',
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId);

        // Issue refund if applicable
        if (refundAmount > 0 && run.idempotency_key) {
          try {
            await refundFeature(
              serviceSupabase,
              run.account_id,
              refundAmount,
              run.idempotency_key,
              {
                featureType: runType === 'rank' ? 'rank_tracking' :
                             runType === 'llm' ? 'llm_visibility' :
                             runType === 'analysis' ? 'analysis' : 'concept_schedule',
                featureMetadata: {
                  batchRunId: runId,
                  reason: 'admin_cancelled',
                },
                description: `Admin cancelled batch run, refunded ${refundAmount} credits`,
              }
            );

            // Notify user
            await sendNotificationToAccount(run.account_id, 'credit_refund', {
              feature: runType,
              creditsRefunded: refundAmount,
              failedChecks: refundAmount,
              batchRunId: runId,
            });
          } catch (refundError) {
            console.error('❌ [BatchMonitor] Refund failed:', refundError);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Run marked as failed${refundAmount > 0 ? `, ${refundAmount} credits refunded` : ''}`,
        });
      }

      case 'retry': {
        // Reset to pending to retry
        await serviceSupabase
          .from(tableName)
          .update({
            status: 'pending',
            started_at: null,
            error_message: null,
          })
          .eq('id', runId);

        return NextResponse.json({
          success: true,
          message: 'Run reset to pending for retry',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [BatchMonitor] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
