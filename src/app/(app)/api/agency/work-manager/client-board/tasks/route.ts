/**
 * Agency Work Manager - Client Board Tasks
 *
 * POST - Create a task on a client's board
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { WMTaskStatus, WMTaskPriority } from '@/types/workManager';

export async function POST(request: NextRequest) {
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
    const {
      client_account_id,
      board_id,
      title,
      description,
      status = 'backlog',
      priority = 'medium',
      due_date,
      assigned_to,
    } = body;

    if (!client_account_id) {
      return NextResponse.json({ error: 'client_account_id is required' }, { status: 400 });
    }

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
      .eq('id', client_account_id)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    // Verify board belongs to the client
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', board_id)
      .eq('account_id', client_account_id)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
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

    // Create the task on the client's board
    const { data: newTask, error: createError } = await supabaseAdmin
      .from('wm_tasks')
      .insert({
        board_id,
        account_id: client_account_id,
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

    // Log the creation action with agency metadata
    await supabaseAdmin.from('wm_task_actions').insert({
      task_id: newTask.id,
      account_id: client_account_id,
      activity_type: 'created',
      content: `Task created: "${title.trim()}"`,
      metadata: {
        status,
        priority,
        created_by_agency: agencyAccountId,
      },
      created_by: user.id,
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/agency/work-manager/client-board/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
