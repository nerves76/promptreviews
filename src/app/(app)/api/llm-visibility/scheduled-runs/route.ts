/**
 * GET /api/llm-visibility/scheduled-runs
 *
 * Returns all future-scheduled LLM batch runs for the account.
 * Used to show scheduled run indicators in the AI Search table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const now = new Date().toISOString();

    // Fetch all pending batch runs with scheduled_for in the future
    const { data: runs, error } = await serviceSupabase
      .from('llm_batch_runs')
      .select('id, group_id, scheduled_for, total_questions, estimated_credits')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .gt('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('[scheduled-runs] Failed to fetch LLM scheduled runs:', error);
      return NextResponse.json({ error: 'Failed to fetch scheduled runs' }, { status: 500 });
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json({ runs: [] });
    }

    // Collect unique group IDs to fetch names
    const groupIds = runs
      .map(r => r.group_id)
      .filter((id): id is string => id !== null && id !== 'ungrouped');

    let groupNameMap: Record<string, string> = {};
    if (groupIds.length > 0) {
      const { data: groups } = await serviceSupabase
        .from('ai_search_query_groups')
        .select('id, name')
        .in('id', groupIds);

      if (groups) {
        groupNameMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
      }
    }

    const result = runs.map(run => ({
      runId: run.id,
      groupId: run.group_id,
      groupName: run.group_id ? (groupNameMap[run.group_id] || null) : null,
      scheduledFor: run.scheduled_for,
      totalQuestions: run.total_questions,
      estimatedCredits: run.estimated_credits,
    }));

    return NextResponse.json({ runs: result });
  } catch (err) {
    console.error('[scheduled-runs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
