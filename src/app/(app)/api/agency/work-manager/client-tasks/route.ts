/**
 * Agency Work Manager - Browse Client Tasks
 *
 * GET - Fetch a specific client's board + tasks for the "Pull from client" browser.
 *       Requires clientAccountId query param.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

export async function GET(request: NextRequest) {
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

    // Get clientAccountId from query params
    const { searchParams } = new URL(request.url);
    const clientAccountId = searchParams.get('clientAccountId');

    if (!clientAccountId) {
      return NextResponse.json({ error: 'clientAccountId is required' }, { status: 400 });
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
      .eq('id', clientAccountId)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    // Get client's board
    const { data: clientBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id, status_labels')
      .eq('account_id', clientAccountId)
      .single();

    if (!clientBoard) {
      return NextResponse.json({
        client_name: clientAccount.business_name,
        status_labels: DEFAULT_WM_STATUS_LABELS,
        tasks: [],
      });
    }

    // Get client's tasks
    const { data: tasks } = await supabaseAdmin
      .from('wm_tasks')
      .select(`
        id, title, description, status, priority, due_date,
        sort_order, created_at, source_type
      `)
      .eq('board_id', clientBoard.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    // Get already-linked task IDs on the agency board
    const { data: agencyBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id')
      .eq('account_id', agencyAccountId)
      .single();

    let alreadyLinkedIds: string[] = [];
    if (agencyBoard) {
      const { data: linkedTasks } = await supabaseAdmin
        .from('wm_tasks')
        .select('linked_task_id')
        .eq('board_id', agencyBoard.id)
        .not('linked_task_id', 'is', null);

      alreadyLinkedIds = (linkedTasks || []).map(t => t.linked_task_id as string);
    }

    return NextResponse.json({
      client_name: clientAccount.business_name,
      status_labels: clientBoard.status_labels || DEFAULT_WM_STATUS_LABELS,
      tasks: (tasks || []).map(t => ({
        ...t,
        already_linked: alreadyLinkedIds.includes(t.id),
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/agency/work-manager/client-tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
