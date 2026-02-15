import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve a board, checking both direct account ownership and agency management.
 *
 * When an agency user views a client's board, the X-Selected-Account header
 * contains the agency's account ID, but the board belongs to the client's account.
 * This helper handles both cases:
 *
 * 1. Direct match: board.account_id === accountId
 * 2. Agency access: accountId is an agency that manages the board's account
 */
export async function resolveBoardWithAgencyAccess(
  supabaseAdmin: SupabaseClient,
  boardId: string,
  accountId: string
): Promise<{ id: string; account_id: string } | null> {
  // First try direct match (most common case)
  const { data: directBoard } = await supabaseAdmin
    .from('wm_boards')
    .select('id, account_id')
    .eq('id', boardId)
    .eq('account_id', accountId)
    .single();

  if (directBoard) return directBoard;

  // Check if the requesting account is an agency
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('id, is_agncy')
    .eq('id', accountId)
    .single();

  if (!account?.is_agncy) return null;

  // Find the board regardless of account
  const { data: board } = await supabaseAdmin
    .from('wm_boards')
    .select('id, account_id')
    .eq('id', boardId)
    .single();

  if (!board) return null;

  // Verify the board's account is managed by this agency
  const { data: clientAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', board.account_id)
    .eq('managing_agncy_id', accountId)
    .single();

  if (!clientAccount) return null;

  return board;
}
