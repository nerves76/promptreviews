import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { WMTaskStatus, WMTaskPriority } from '@/types/workManager';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * GET /api/work-manager/tasks/[taskId]
 * Returns a single task with details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', task.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user info for assignee and creator
    const userIds = [task.assigned_to, task.created_by].filter(Boolean);
    let usersMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds);

      if (users) {
        usersMap = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    const transformedTask = {
      ...task,
      assignee: task.assigned_to ? usersMap[task.assigned_to] || null : null,
      creator: task.created_by ? usersMap[task.created_by] || null : null,
    };

    return NextResponse.json({ task: transformedTask });
  } catch (error) {
    console.error('Error in GET /api/work-manager/tasks/[taskId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/work-manager/tasks/[taskId]
 * Updates a task
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, due_date, assigned_to } = body;

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the current task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', task.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update object and track changes for activity log
    const updateData: any = {};
    const changes: Array<{ type: string; from: any; to: any }> = [];

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      const validStatuses: WMTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      if (status !== task.status) {
        changes.push({ type: 'status_change', from: task.status, to: status });
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      const validPriorities: WMTaskPriority[] = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
      if (priority !== task.priority) {
        changes.push({ type: 'priority_change', from: task.priority, to: priority });
      }
      updateData.priority = priority;
    }

    if (due_date !== undefined) {
      if (due_date !== task.due_date) {
        changes.push({ type: 'due_date_change', from: task.due_date, to: due_date });
      }
      updateData.due_date = due_date || null;
    }

    if (assigned_to !== undefined) {
      if (assigned_to !== task.assigned_to) {
        changes.push({ type: 'assignment_change', from: task.assigned_to, to: assigned_to });
      }
      updateData.assigned_to = assigned_to || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('wm_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Log activity for significant changes
    for (const change of changes) {
      await supabaseAdmin.from('wm_task_actions').insert({
        task_id: taskId,
        account_id: task.account_id,
        activity_type: change.type,
        metadata: { from: change.from, to: change.to },
        created_by: user.id,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error in PATCH /api/work-manager/tasks/[taskId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/work-manager/tasks/[taskId]
 * Deletes a task
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', task.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the task (cascade will delete actions)
    const { error: deleteError } = await supabaseAdmin
      .from('wm_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/tasks/[taskId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
