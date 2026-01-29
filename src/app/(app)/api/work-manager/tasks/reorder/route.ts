import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { WMTaskStatus } from '@/types/workManager';

/**
 * PATCH /api/work-manager/tasks/reorder
 * Batch updates sort_order (and optionally status) for tasks
 * Used during drag & drop operations
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

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

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const taskIds = updates.map((u: any) => u.id);

    // Fetch all tasks and verify they belong to the selected account
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id, board_id, status')
      .in('id', taskIds)
      .eq('account_id', accountId);

    if (tasksError || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks not found' }, { status: 404 });
    }

    if (tasks.length !== taskIds.length) {
      return NextResponse.json({ error: 'Some tasks do not belong to the selected account' }, { status: 403 });
    }

    // Track status changes for activity logging
    const statusChanges: Array<{ taskId: string; accountId: string; from: string; to: string }> = [];

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
            accountId,
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

    // Log status changes
    if (statusChanges.length > 0) {
      const actionInserts = statusChanges.map(change => ({
        task_id: change.taskId,
        account_id: change.accountId,
        activity_type: 'status_change' as const,
        metadata: { from: change.from, to: change.to },
        created_by: user.id,
      }));

      await supabaseAdmin.from('wm_task_actions').insert(actionInserts);
    }

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error('Error in PATCH /api/work-manager/tasks/reorder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
