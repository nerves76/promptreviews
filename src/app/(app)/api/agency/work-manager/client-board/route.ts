/**
 * Agency Work Manager - Client Board Access
 *
 * GET - Fetch a specific client's board + tasks for direct editing by agency.
 *       Requires clientAccountId query param.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS, WMTask } from '@/types/workManager';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const agencyAccountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!agencyAccountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get clientAccountId from query params
    const { searchParams } = new URL(request.url);
    const clientAccountId = searchParams.get('clientAccountId');

    if (!clientAccountId) {
      return NextResponse.json({ error: 'clientAccountId is required' }, { status: 400 });
    }

    // Verify agency account
    const { data: agencyAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, is_agncy')
      .eq('id', agencyAccountId)
      .single();

    if (!agencyAccount?.is_agncy) {
      return NextResponse.json({ error: 'Not an agency account' }, { status: 403 });
    }

    // Verify client is managed by this agency
    const { data: clientAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, managing_agncy_id, business_name')
      .eq('id', clientAccountId)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    // Get or create client's board
    let { data: clientBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('*')
      .eq('account_id', clientAccountId)
      .single();

    if (!clientBoard) {
      // Create board for client if it doesn't exist
      const { data: newBoard, error: createError } = await supabaseAdmin
        .from('wm_boards')
        .insert({
          account_id: clientAccountId,
          name: `${clientAccount.business_name || 'Client'} Board`,
          status_labels: DEFAULT_WM_STATUS_LABELS,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating client board:', createError);
        return NextResponse.json({ error: 'Failed to create client board' }, { status: 500 });
      }

      clientBoard = newBoard;
    }

    // Get client's tasks with assignee info
    const { data: tasks } = await supabaseAdmin
      .from('wm_tasks')
      .select('*')
      .eq('board_id', clientBoard.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Get unique user IDs for assignees and creators
    const userIds = new Set<string>();
    tasks?.forEach(task => {
      if (task.assigned_to) userIds.add(task.assigned_to);
      if (task.created_by) userIds.add(task.created_by);
    });

    // Fetch user info
    let usersMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));

      if (users) {
        usersMap = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Aggregate time spent per task
    const allTaskIds = (tasks || []).map(t => t.id);
    const timeSpentMap = new Map<string, number>();

    if (allTaskIds.length > 0) {
      const { data: timeEntries } = await supabaseAdmin
        .from('wm_time_entries')
        .select('task_id, duration_minutes')
        .in('task_id', allTaskIds);

      if (timeEntries) {
        for (const entry of timeEntries) {
          const current = timeSpentMap.get(entry.task_id) || 0;
          timeSpentMap.set(entry.task_id, current + entry.duration_minutes);
        }
      }
    }

    // Transform tasks with user info
    const transformedTasks: WMTask[] = (tasks || []).map(task => ({
      ...task,
      total_time_spent_minutes: timeSpentMap.get(task.id) || 0,
      assignee: task.assigned_to ? usersMap[task.assigned_to] || null : null,
      creator: task.created_by ? usersMap[task.created_by] || null : null,
    }));

    // Get client's team members for assignment dropdown
    const { data: clientTeam } = await supabaseAdmin
      .from('account_users')
      .select(`
        user_id,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('account_id', clientAccountId);

    const accountUsers = (clientTeam || []).map((member: any) => ({
      id: member.user_id,
      first_name: member.users?.first_name || null,
      last_name: member.users?.last_name || null,
      email: member.users?.email || '',
      avatar_url: member.users?.avatar_url || null,
    }));

    return NextResponse.json({
      board: {
        ...clientBoard,
        status_labels: clientBoard.status_labels || DEFAULT_WM_STATUS_LABELS,
      },
      tasks: transformedTasks,
      accountUsers,
      client_name: clientAccount.business_name,
    });
  } catch (error) {
    console.error('Error in GET /api/agency/work-manager/client-board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
