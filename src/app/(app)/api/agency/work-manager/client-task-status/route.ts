/**
 * Agency Work Manager - Update Client Task Status
 *
 * PATCH - Update the status of a linked client task from the agency board.
 *         Looks up the linked_task_id, verifies the client relationship,
 *         and updates the client task status + logs the action.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;

export async function PATCH(request: NextRequest) {
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
    const { agency_task_id, new_status } = body;

    if (!agency_task_id || !new_status) {
      return NextResponse.json(
        { error: 'agency_task_id and new_status are required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(new_status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the agency task with its linked info
    const { data: agencyTask } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id, linked_task_id, linked_account_id')
      .eq('id', agency_task_id)
      .eq('account_id', agencyAccountId)
      .single();

    if (!agencyTask) {
      return NextResponse.json({ error: 'Agency task not found' }, { status: 404 });
    }

    if (!agencyTask.linked_task_id || !agencyTask.linked_account_id) {
      return NextResponse.json({ error: 'Task is not linked to a client task' }, { status: 400 });
    }

    // Verify client is managed by agency
    const { data: clientAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, managing_agncy_id')
      .eq('id', agencyTask.linked_account_id)
      .single();

    if (!clientAccount || clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json({ error: 'Client not managed by this agency' }, { status: 403 });
    }

    // Get current status of client task for the action log
    const { data: clientTask } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, status, account_id')
      .eq('id', agencyTask.linked_task_id)
      .single();

    if (!clientTask) {
      return NextResponse.json({ error: 'Linked client task not found' }, { status: 404 });
    }

    const oldStatus = clientTask.status;

    // Update client task status
    const { error: updateError } = await supabaseAdmin
      .from('wm_tasks')
      .update({ status: new_status })
      .eq('id', agencyTask.linked_task_id);

    if (updateError) {
      console.error('Error updating client task status:', updateError);
      return NextResponse.json({ error: 'Failed to update client task' }, { status: 500 });
    }

    // Log action on the client task
    await supabaseAdmin.from('wm_task_actions').insert({
      task_id: agencyTask.linked_task_id,
      account_id: clientTask.account_id,
      activity_type: 'status_change',
      content: `Status changed by agency`,
      metadata: {
        from_status: oldStatus,
        to_status: new_status,
        changed_by_agency: true,
        agency_account_id: agencyAccountId,
      },
      created_by: user.id,
    });

    return NextResponse.json({
      message: 'Client task status updated',
      old_status: oldStatus,
      new_status,
    });
  } catch (error) {
    console.error('Error in PATCH /api/agency/work-manager/client-task-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
