import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/check-status?jobId=...
 * Poll the status of a queued geo-grid check job.
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

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId || !isValidUuid(jobId)) {
      return NextResponse.json({ error: 'Valid jobId is required' }, { status: 400 });
    }

    const { data: job, error: jobError } = await serviceSupabase
      .from('gg_check_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('account_id', accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      checksPerformed: job.checks_performed,
      totalChecks: job.total_checks,
      totalCost: Number(job.total_cost),
      creditsUsed: job.credits_used,
      error: job.error,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Check status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
