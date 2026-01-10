import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

/**
 * POST /api/work-manager/tasks/from-pack
 * Creates tasks from all tasks in a library pack.
 * Auto-creates a board if none exists for the account.
 * Returns: { tasks, board_id, count }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pack_id } = body as { pack_id: string };

    if (!pack_id) {
      return NextResponse.json({ error: 'pack_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Verify pack exists
    const { data: pack, error: packError } = await supabaseAdmin
      .from('wm_library_packs')
      .select('id, name')
      .eq('id', pack_id)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    // Fetch pack tasks in order
    const { data: packTasks, error: packTasksError } = await supabaseAdmin
      .from('wm_library_pack_tasks')
      .select('task_id, sort_order')
      .eq('pack_id', pack_id)
      .order('sort_order', { ascending: true });

    if (packTasksError) {
      console.error('Error fetching pack tasks:', packTasksError);
      return NextResponse.json({ error: 'Failed to fetch pack tasks' }, { status: 500 });
    }

    const taskIds = packTasks?.map(pt => pt.task_id) || [];

    if (taskIds.length === 0) {
      return NextResponse.json({ tasks: [], board_id: null, count: 0 });
    }

    // Fetch library tasks
    const { data: libraryTasks, error: libraryError } = await supabaseAdmin
      .from('wm_library_tasks')
      .select('*')
      .in('id', taskIds)
      .eq('is_active', true);

    if (libraryError) {
      console.error('Error fetching library tasks:', libraryError);
      return NextResponse.json({ error: 'Failed to fetch library tasks' }, { status: 500 });
    }

    // Order tasks according to pack order
    const orderedTasks = taskIds
      .map(id => libraryTasks?.find(t => t.id === id))
      .filter(Boolean);

    if (orderedTasks.length === 0) {
      return NextResponse.json({ tasks: [], board_id: null, count: 0 });
    }

    // Get account ID from header
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get or create board for this account
    let boardId: string;

    const { data: existingBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (existingBoard) {
      boardId = existingBoard.id;
    } else {
      // Get account info for default board name
      const { data: accountData } = await supabaseAdmin
        .from('accounts')
        .select(`
          id,
          businesses (
            name
          )
        `)
        .eq('id', accountId)
        .single();

      const business = (accountData as any)?.businesses?.[0];
      const defaultName = business?.name || null;

      // Create new board
      const { data: newBoard, error: createBoardError } = await supabaseAdmin
        .from('wm_boards')
        .insert({
          account_id: accountId,
          name: defaultName,
          status_labels: DEFAULT_WM_STATUS_LABELS,
          created_by: user.id,
        })
        .select()
        .single();

      if (createBoardError || !newBoard) {
        console.error('Error creating board:', createBoardError);
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
      }

      boardId = newBoard.id;
    }

    // Get max sort_order for backlog status
    const { data: maxOrderTask } = await supabaseAdmin
      .from('wm_tasks')
      .select('sort_order')
      .eq('board_id', boardId)
      .eq('status', 'backlog')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    let nextSortOrder = (maxOrderTask?.sort_order ?? 0) + 1;

    // Create all tasks
    const tasksToInsert = orderedTasks.map((libraryTask: any) => ({
      board_id: boardId,
      account_id: accountId,
      title: libraryTask.title,
      description: libraryTask.description || null,
      status: 'backlog',
      priority: 'medium',
      due_date: null,
      assigned_to: null,
      sort_order: nextSortOrder++,
      created_by: user.id,
      source_type: 'library',
      source_reference: libraryTask.id,
    }));

    const { data: newTasks, error: createTasksError } = await supabaseAdmin
      .from('wm_tasks')
      .insert(tasksToInsert)
      .select();

    if (createTasksError || !newTasks) {
      console.error('Error creating tasks:', createTasksError);
      return NextResponse.json({ error: 'Failed to create tasks' }, { status: 500 });
    }

    // Log the creation action for each task
    const actionsToInsert = newTasks.map((task: any, index: number) => ({
      task_id: task.id,
      account_id: accountId,
      activity_type: 'created',
      content: `Task added from pack "${pack.name}": "${orderedTasks[index]?.title}"`,
      metadata: {
        status: 'backlog',
        priority: 'medium',
        source_type: 'library',
        source_reference: orderedTasks[index]?.id,
        pack_id: pack_id,
        pack_name: pack.name,
      },
      created_by: user.id,
    }));

    await supabaseAdmin.from('wm_task_actions').insert(actionsToInsert);

    return NextResponse.json({
      tasks: newTasks,
      board_id: boardId,
      count: newTasks.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/tasks/from-pack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
