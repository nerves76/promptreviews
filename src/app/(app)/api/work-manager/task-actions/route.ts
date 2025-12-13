import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { WMActionType } from '@/types/workManager';

/**
 * GET /api/work-manager/task-actions?taskId=xxx
 * Returns activity log for a task
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the task to verify access
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

    // Fetch actions
    const { data: actions, error: actionsError } = await supabaseAdmin
      .from('wm_task_actions')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (actionsError) {
      console.error('Error fetching task actions:', actionsError);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    // Get user info for creators
    const creatorIds = [...new Set(actions?.map(a => a.created_by).filter(Boolean) || [])];
    let usersMap: Record<string, any> = {};

    if (creatorIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', creatorIds);

      if (users) {
        usersMap = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Transform actions with creator info
    const transformedActions = actions?.map(action => ({
      ...action,
      creator: action.created_by ? usersMap[action.created_by] || null : null,
    })) || [];

    return NextResponse.json({ actions: transformedActions });
  } catch (error) {
    console.error('Error in GET /api/work-manager/task-actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/work-manager/task-actions
 * Creates a new action (typically a note)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, activity_type, content, metadata } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 });
    }

    // Validate activity_type
    const validTypes: WMActionType[] = [
      'note',
      'status_change',
      'assignment_change',
      'priority_change',
      'due_date_change',
      'created',
      'updated',
    ];
    if (!validTypes.includes(activity_type)) {
      return NextResponse.json({ error: 'Invalid activity_type' }, { status: 400 });
    }

    // For notes, content is required
    if (activity_type === 'note' && (!content || content.trim().length === 0)) {
      return NextResponse.json({ error: 'content is required for notes' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the task to verify access
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id')
      .eq('id', task_id)
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

    // Create the action
    const { data: newAction, error: createError } = await supabaseAdmin
      .from('wm_task_actions')
      .insert({
        task_id,
        account_id: task.account_id,
        activity_type,
        content: content?.trim() || null,
        metadata: metadata || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task action:', createError);
      return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
    }

    // Get creator info
    const { data: creator } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      action: {
        ...newAction,
        creator,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/task-actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
