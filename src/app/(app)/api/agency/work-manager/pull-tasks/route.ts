/**
 * Agency Work Manager - Pull Client Tasks
 *
 * POST - Pull selected client tasks onto the agency board.
 *        Creates linked copies with source_type = 'client_task'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

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
    const { client_account_id, task_ids } = body;

    if (!client_account_id || !Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json(
        { error: 'client_account_id and task_ids[] are required' },
        { status: 400 }
      );
    }

    // Verify agency
    const { data: agencyAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, is_agncy')
      .eq('id', agencyAccountId)
      .single();

    if (!agencyAccount?.is_agncy) {
      return NextResponse.json({ error: 'Not an agency account' }, { status: 403 });
    }

    // Verify client is managed by agency
    const { data: clientAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, managing_agncy_id, business_name')
      .eq('id', client_account_id)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    // Get or create agency board
    let { data: agencyBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id')
      .eq('account_id', agencyAccountId)
      .single();

    if (!agencyBoard) {
      const { data: newBoard, error: createError } = await supabaseAdmin
        .from('wm_boards')
        .insert({
          account_id: agencyAccountId,
          name: 'Agency Board',
          status_labels: DEFAULT_WM_STATUS_LABELS,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (createError || !newBoard) {
        return NextResponse.json({ error: 'Failed to create agency board' }, { status: 500 });
      }
      agencyBoard = newBoard;
    }

    // Check which tasks are already linked
    const { data: existingLinks } = await supabaseAdmin
      .from('wm_tasks')
      .select('linked_task_id')
      .eq('board_id', agencyBoard.id)
      .in('linked_task_id', task_ids);

    const alreadyLinked = new Set((existingLinks || []).map(l => l.linked_task_id));

    // Filter to only new task IDs
    const newTaskIds = task_ids.filter((id: string) => !alreadyLinked.has(id));

    if (newTaskIds.length === 0) {
      return NextResponse.json({
        message: 'All selected tasks are already linked',
        created: 0,
        skipped: task_ids.length,
      });
    }

    // Fetch source client tasks
    const { data: clientTasks } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, title, description, priority, due_date')
      .in('id', newTaskIds)
      .eq('account_id', client_account_id);

    if (!clientTasks || clientTasks.length === 0) {
      return NextResponse.json({ error: 'No valid client tasks found' }, { status: 404 });
    }

    // Get max sort_order in backlog for positioning
    const { data: maxOrderResult } = await supabaseAdmin
      .from('wm_tasks')
      .select('sort_order')
      .eq('board_id', agencyBoard.id)
      .eq('status', 'backlog')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrderResult?.sort_order ?? -1) + 1;

    // Create linked tasks on agency board
    const inserts = clientTasks.map(ct => ({
      board_id: agencyBoard!.id,
      account_id: agencyAccountId,
      title: ct.title,
      description: ct.description,
      status: 'backlog' as const,
      priority: ct.priority,
      due_date: ct.due_date,
      sort_order: nextOrder++,
      created_by: user.id,
      source_type: 'client_task',
      linked_task_id: ct.id,
      linked_account_id: client_account_id,
    }));

    const { data: created, error: insertError } = await supabaseAdmin
      .from('wm_tasks')
      .insert(inserts)
      .select('id');

    if (insertError) {
      console.error('Error inserting linked tasks:', insertError);
      return NextResponse.json({ error: 'Failed to create linked tasks' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Pulled ${created?.length || 0} tasks from ${clientAccount.business_name}`,
      created: created?.length || 0,
      skipped: task_ids.length - newTaskIds.length,
    });
  } catch (error) {
    console.error('Error in POST /api/agency/work-manager/pull-tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
