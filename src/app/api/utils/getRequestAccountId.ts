import { getAccountIdForUser } from '@/auth/utils/accounts';
import { createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * Get the account ID for a request, respecting client-selected account when provided
 * 
 * This helper ensures consistency between client and server account context by:
 * 1. Checking for X-Selected-Account header from the client
 * 2. Validating the user has access to that account
 * 3. Falling back to automatic account selection if needed
 * 
 * @param request - The incoming request
 * @param userId - The authenticated user's ID
 * @param supabaseClient - Optional Supabase client to use for validation
 * @returns The account ID to use for this request
 */
export async function getRequestAccountId(
  request: Request,
  userId: string,
  supabaseClient?: any
): Promise<string | null> {
  // Check if client specified a selected account
  const selectedAccountHeader = request.headers.get('x-selected-account');
  
  if (selectedAccountHeader) {
    // Validate that the user has access to this account
    const supabaseAdmin = createServiceRoleClient();
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .eq('account_id', selectedAccountHeader)
      .single();
    
    if (accountUser) {
      console.log(`[API] Using client-selected account: ${selectedAccountHeader}`);
      return selectedAccountHeader;
    } else {
      console.warn(`[API] User ${userId} doesn't have access to account ${selectedAccountHeader}, falling back to auto-selection`);
    }
  }
  
  // Fall back to automatic account selection
  const accountId = await getAccountIdForUser(userId, supabaseClient);
  if (accountId) {
    console.log(`[API] Using auto-selected account: ${accountId}`);
  }
  
  return accountId;
}