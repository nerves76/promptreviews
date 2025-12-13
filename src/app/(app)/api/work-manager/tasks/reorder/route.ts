import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
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
    const taskIds = updates.map((u: any) => u.id);

    // Fetch all tasks to verify access
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id, board_id, status')
      .in('id', taskIds);

    if (tasksError || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks not found' }, { status: 404 });
    }

    // Verify all tasks belong to the same account and user has access
    const accountIds = [...new Set(tasks.map(t => t.account_id))];
    if (accountIds.length > 1) {
      return NextResponse.json({ error: 'All tasks must belong to the same account' }, { status: 400 });
    }

    const accountId = accountIds[0];
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
