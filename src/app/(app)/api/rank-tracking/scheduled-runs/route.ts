/**
 * GET /api/rank-tracking/scheduled-runs
 *
 * Returns all future-scheduled rank tracking batch runs for the account.
 * For group-specific runs, also returns affected keyword IDs so the UI
 * can show indicators on the correct rows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_RANK_TRACKING_GROUP_NAME } from '@/lib/groupConstants';

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
      .from('rank_batch_runs')
      .select('id, group_id, scheduled_for, total_keywords, estimated_credits')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .gt('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('[scheduled-runs] Failed to fetch rank scheduled runs:', error);
      return NextResponse.json({ error: 'Failed to fetch scheduled runs' }, { status: 500 });
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json({ runs: [] });
    }

    // Resolve historical 'ungrouped' entries to the General group
    let generalGroupId: string | null = null;
    const hasUngroupedRun = runs.some(r => r.group_id === 'ungrouped');
    if (hasUngroupedRun) {
      const { data: generalGroup } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .select('id')
        .eq('account_id', accountId)
        .eq('name', DEFAULT_RANK_TRACKING_GROUP_NAME)
        .maybeSingle();
      generalGroupId = generalGroup?.id || null;
    }

    // Collect unique group IDs to fetch names and affected keyword IDs
    const groupIds = runs
      .map(r => {
        if (r.group_id === 'ungrouped') return generalGroupId;
        return r.group_id;
      })
      .filter((id): id is string => id !== null);
    const uniqueGroupIds = [...new Set(groupIds)];

    let groupNameMap: Record<string, string> = {};
    let groupKeywordMap: Record<string, string[]> = {};

    if (uniqueGroupIds.length > 0) {
      // Fetch group names
      const { data: groups } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .select('id, name')
        .in('id', uniqueGroupIds);

      if (groups) {
        groupNameMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
      }

      // Fetch keyword IDs affected by each group
      const { data: terms } = await serviceSupabase
        .from('rank_tracking_terms')
        .select('group_id, keyword_id')
        .eq('account_id', accountId)
        .in('group_id', uniqueGroupIds);

      if (terms) {
        for (const term of terms) {
          if (term.group_id) {
            if (!groupKeywordMap[term.group_id]) {
              groupKeywordMap[term.group_id] = [];
            }
            if (!groupKeywordMap[term.group_id].includes(term.keyword_id)) {
              groupKeywordMap[term.group_id].push(term.keyword_id);
            }
          }
        }
      }
    }

    const result = runs.map(run => {
      // Resolve historical 'ungrouped' to General group UUID
      const resolvedGroupId = run.group_id === 'ungrouped' ? generalGroupId : run.group_id;
      return {
        runId: run.id,
        groupId: resolvedGroupId,
        groupName: resolvedGroupId ? (groupNameMap[resolvedGroupId] || null) : null,
        scheduledFor: run.scheduled_for,
        totalKeywords: run.total_keywords,
        estimatedCredits: run.estimated_credits,
        // For group-specific runs, include affected keyword IDs so the UI can match rows
        keywordIds: resolvedGroupId ? (groupKeywordMap[resolvedGroupId] || []) : null,
      };
    });

    return NextResponse.json({ runs: result });
  } catch (err) {
    console.error('[scheduled-runs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
