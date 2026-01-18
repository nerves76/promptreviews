import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/batch-analyze-status
 * Get the status of a batch analysis run.
 *
 * Query params:
 * - runId: UUID of the batch run (optional - returns most recent if not provided)
 * - type: 'domain' | 'competitor' (required if runId not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const batchType = searchParams.get('type') as 'domain' | 'competitor' | null;

    let query = supabase
      .from('analysis_batch_runs')
      .select('*')
      .eq('account_id', accountId);

    if (runId) {
      query = query.eq('id', runId);
    } else if (batchType) {
      query = query
        .eq('batch_type', batchType)
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      return NextResponse.json(
        { error: 'Either runId or type is required' },
        { status: 400 }
      );
    }

    const { data: run, error } = await query.single();

    if (error || !run) {
      return NextResponse.json(
        { error: 'Batch run not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const progress = run.total_items > 0
      ? Math.round((run.processed_items / run.total_items) * 100)
      : 0;

    return NextResponse.json({
      runId: run.id,
      batchType: run.batch_type,
      status: run.status,
      totalItems: run.total_items,
      processedItems: run.processed_items,
      successfulItems: run.successful_items,
      failedItems: run.failed_items,
      progress,
      estimatedCredits: run.estimated_credits,
      errorMessage: run.error_message,
      createdAt: run.created_at,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      updatedAt: run.updated_at,
    });
  } catch (error) {
    console.error('[batch-analyze-status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    );
  }
}
