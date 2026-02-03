/**
 * Agency Work Manager - Client Board Task Reorder
 *
 * PATCH - Reorder tasks on a client's board (drag & drop)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { WMTaskStatus } from '@/types/workManager';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { client_account_id, updates } = body;

    if (!client_account_id) {
      return NextResponse.json({ error: 'client_account_id is required' }, { status: 400 });
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    // Validate updates structure
    const validStatuses: WMTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    for (const update of updates) {
      if (!update.id || typeof update.sort_order !== 'number') {
        return NextResponse.json({ error: 'Each update must have id and sort_order' }, { status: 400 });
      }
      if (update.status !== undefined && !validStatuses.includes(update.status)) {
        return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
      }
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
      .select('id, managing_agncy_id')
      .eq('id', client_account_id)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    const taskIds = updates.map((u: any) => u.id);

    // Fetch all tasks and verify they belong to the client account
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id, board_id, status')
      .in('id', taskIds)
      .eq('account_id', client_account_id);

    if (tasksError || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks not found' }, { status: 404 });
    }

    if (tasks.length !== taskIds.length) {
      return NextResponse.json({ error: 'Some tasks do not belong to the client account' }, { status: 403 });
    }

    // Track status changes for activity logging
    const statusChanges: Array<{ taskId: string; from: string; to: string }> = [];

    // Build a map of current task statuses
    const currentStatuses = tasks.reduce((acc, t) => {
      acc[t.id] = t.status;
      return acc;
    }, {} as Record<string, string>);

    // Update each task
    const updatePromises = updates.map(async (update: any) => {
      const updateData: any = { sort_order: update.sort_order };

      if (update.status !== undefined) {
        const currentStatus = currentStatuses[update.id];
        if (currentStatus && currentStatus !== update.status) {
          statusChanges.push({
            taskId: update.id,
            from: currentStatus,
            to: update.status,
          });
        }
        updateData.status = update.status;
      }

      return supabaseAdmin
        .from('wm_tasks')
        .update(updateData)
        .eq('id', update.id);
    });

    await Promise.all(updatePromises);

    // Log status changes with agency metadata
    if (statusChanges.length > 0) {
      const actionInserts = statusChanges.map(change => ({
        task_id: change.taskId,
        account_id: client_account_id,
        activity_type: 'status_change' as const,
        metadata: {
          from: change.from,
          to: change.to,
          changed_by_agency: agencyAccountId,
        },
        created_by: user.id,
      }));

      await supabaseAdmin.from('wm_task_actions').insert(actionInserts);
    }

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error('Error in PATCH /api/agency/work-manager/client-board/tasks/reorder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
