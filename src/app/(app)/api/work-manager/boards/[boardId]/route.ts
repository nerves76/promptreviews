import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS, WMStatusLabels } from '@/types/workManager';

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

/**
 * GET /api/work-manager/boards/[boardId]
 * Returns a single board with its details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { boardId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the board and verify it belongs to the selected account
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select(`
        id,
        account_id,
        name,
        status_labels,
        show_time_to_client,
        created_by,
        created_at,
        updated_at,
        accounts!inner (
          id,
          first_name,
          last_name,
          businesses (
            name
          )
        )
      `)
      .eq('id', boardId)
      .eq('account_id', accountId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get task count
    const { count: taskCount } = await supabaseAdmin
      .from('wm_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('board_id', boardId);

    const account = board.accounts as any;
    const business = account?.businesses?.[0];

    const transformedBoard = {
      id: board.id,
      account_id: board.account_id,
      name: board.name,
      status_labels: board.status_labels || DEFAULT_WM_STATUS_LABELS,
      show_time_to_client: (board as any).show_time_to_client ?? false,
      account_name: account ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
      business_name: business?.name || null,
      task_count: taskCount || 0,
      created_by: board.created_by,
      created_at: board.created_at,
      updated_at: board.updated_at,
    };

    return NextResponse.json({ board: transformedBoard });
  } catch (error) {
    console.error('Error in GET /api/work-manager/boards/[boardId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/work-manager/boards/[boardId]
 * Updates a board's name or status labels
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { boardId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, status_labels, show_time_to_client } = body;

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the board and verify it belongs to the selected account
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', boardId)
      .eq('account_id', accountId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Validate status_labels if provided
    if (status_labels) {
      const requiredKeys: Array<keyof WMStatusLabels> = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      for (const key of requiredKeys) {
        if (!status_labels[key] || typeof status_labels[key] !== 'string') {
          return NextResponse.json({ error: `Missing or invalid status label: ${key}` }, { status: 400 });
        }
        if (status_labels[key].length > 20) {
          return NextResponse.json({ error: `Status label "${key}" exceeds 20 characters` }, { status: 400 });
        }
      }
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status_labels !== undefined) updateData.status_labels = status_labels;
    if (show_time_to_client !== undefined) updateData.show_time_to_client = show_time_to_client;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the board
    const { data: updatedBoard, error: updateError } = await supabaseAdmin
      .from('wm_boards')
      .update(updateData)
      .eq('id', boardId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating board:', updateError);
      return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
    }

    return NextResponse.json({ board: updatedBoard });
  } catch (error) {
    console.error('Error in PATCH /api/work-manager/boards/[boardId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/work-manager/boards/[boardId]
 * Deletes a board and all its tasks
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { boardId } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the board and verify it belongs to the selected account
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', boardId)
      .eq('account_id', accountId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Verify user is owner or admin of this account
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    if (!accountUser || (accountUser.role !== 'owner' && accountUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Only owners and admins can delete boards' }, { status: 403 });
    }

    // Delete the board (cascade will delete tasks and actions)
    const { error: deleteError } = await supabaseAdmin
      .from('wm_boards')
      .delete()
      .eq('id', boardId);

    if (deleteError) {
      console.error('Error deleting board:', deleteError);
      return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/boards/[boardId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
