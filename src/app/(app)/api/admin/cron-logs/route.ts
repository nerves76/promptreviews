/**
 * Admin API: Cron Job Execution Logs
 *
 * Returns cron job execution history for monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const jobName = searchParams.get('job_name');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const serviceSupabase = createServiceRoleClient();

    // Build query
    let query = serviceSupabase
      .from('cron_execution_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobName) {
      query = query.eq('job_name', jobName);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Error fetching cron logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Get distinct job names for filter dropdown
    const { data: jobNamesData } = await serviceSupabase
      .from('cron_execution_logs')
      .select('job_name')
      .order('job_name');

    const jobNames = [...new Set((jobNamesData || []).map((row: { job_name: string }) => row.job_name))];

    // Get summary stats
    const { data: statsData } = await serviceSupabase
      .from('cron_execution_logs')
      .select('status')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      last_24h: {
        total: statsData?.length || 0,
        success: statsData?.filter((row: { status: string }) => row.status === 'success').length || 0,
        error: statsData?.filter((row: { status: string }) => row.status === 'error').length || 0,
        running: statsData?.filter((row: { status: string }) => row.status === 'running').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      logs,
      total: count,
      job_names: jobNames,
      stats,
    });

  } catch (error) {
    console.error('Cron logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
