import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { WMTaskStatus, WMTaskPriority } from '@/types/workManager';

/**
 * GET /api/work-manager/tasks?boardId=xxx
 * Returns all tasks for a board
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Verify user has access to this board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', board.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch tasks with assignee info
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('wm_tasks')
      .select('*')
      .eq('board_id', boardId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

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

    // Transform tasks with user info
    const transformedTasks = tasks?.map(task => ({
      ...task,
      assignee: task.assigned_to ? usersMap[task.assigned_to] || null : null,
      creator: task.created_by ? usersMap[task.created_by] || null : null,
    })) || [];

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Error in GET /api/work-manager/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/work-manager/tasks
 * Creates a new task
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      board_id,
      title,
      description,
      status = 'backlog',
      priority = 'medium',
      due_date,
      assigned_to,
    } = body;

    if (!board_id) {
      return NextResponse.json({ error: 'board_id is required' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses: WMTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Validate priority
    const validPriorities: WMTaskPriority[] = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Verify user has access to the board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', board_id)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', board.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get max sort_order for this status
    const { data: maxOrderTask } = await supabaseAdmin
      .from('wm_tasks')
      .select('sort_order')
      .eq('board_id', board_id)
      .eq('status', status)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderTask?.sort_order ?? 0) + 1;

    // Create the task
    const { data: newTask, error: createError } = await supabaseAdmin
      .from('wm_tasks')
      .insert({
        board_id,
        account_id: board.account_id,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        due_date: due_date || null,
        assigned_to: assigned_to || null,
        sort_order: nextSortOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task:', createError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Log the creation action
    await supabaseAdmin.from('wm_task_actions').insert({
      task_id: newTask.id,
      account_id: board.account_id,
      activity_type: 'created',
      content: `Task created: "${title.trim()}"`,
      metadata: { status, priority },
      created_by: user.id,
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
