import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve a task, checking both direct account ownership and agency management.
 *
 * When an agency user interacts with tasks on a client's board, the
 * X-Selected-Account header contains the agency's account ID, but the task
 * belongs to the client's account. This helper handles both cases:
 *
 * 1. Direct match: task.account_id === accountId
 * 2. Agency access: accountId is an agency that manages the task's account
 */
export async function resolveTaskWithAgencyAccess(
  supabaseAdmin: SupabaseClient,
  taskId: string,
  accountId: string
): Promise<{ id: string; account_id: string } | null> {
  // First try direct match (most common case)
  const { data: directTask } = await supabaseAdmin
    .from('wm_tasks')
    .select('id, account_id')
    .eq('id', taskId)
    .eq('account_id', accountId)
    .single();

  if (directTask) return directTask;

  // Check if the requesting account is an agency
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('id, is_agncy')
    .eq('id', accountId)
    .single();

  if (!account?.is_agncy) return null;

  // Find the task regardless of account
  const { data: task } = await supabaseAdmin
    .from('wm_tasks')
    .select('id, account_id')
    .eq('id', taskId)
    .single();

  if (!task) return null;

  // Verify the task's account is managed by this agency
  const { data: clientAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', task.account_id)
    .eq('managing_agncy_id', accountId)
    .single();

  if (!clientAccount) return null;

  return task;
}
