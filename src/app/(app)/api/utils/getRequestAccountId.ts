import { getAccountIdForUser } from '@/auth/utils/accounts';
import { createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * ⚠️ CRITICAL: Get the account ID for API requests with proper account isolation
 *
 * **REQUIRED for ALL API routes that access account-scoped data.**
 *
 * This helper ensures consistency between client and server account context by:
 * 1. Checking for X-Selected-Account header from the client (sent by apiClient)
 * 2. Validating the user has access to that account
 * 3. Falling back to automatic account selection if needed
 *
 * **DO NOT USE user.id as account_id** - Users can belong to multiple accounts.
 * **DO NOT USE getAccountIdForUser() directly** - It bypasses the account switcher.
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const supabase = await createServerSupabaseClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   // REQUIRED: Get proper account ID
 *   const accountId = await getRequestAccountId(request, user.id, supabase);
 *   if (!accountId) {
 *     return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
 *   }
 *
 *   // Use accountId in all queries
 *   await supabase.from('table').insert({ account_id: accountId, ... });
 * }
 * ```
 *
 * @param request - The incoming request (contains X-Selected-Account header)
 * @param userId - The authenticated user's ID
 * @param supabaseClient - Optional Supabase client to use for validation
 * @returns The account ID to use for this request, or null if access denied
 *
 * @see {@link /CLAUDE.md#critical-account-isolation-rules} for complete guidelines
 */
export async function getRequestAccountId(
  request: Request,
  userId: string,
  supabaseClient?: any
): Promise<string | null> {
  // Check if client specified a selected account
  const selectedAccountHeader = request.headers.get('x-selected-account');
  console.log('[getRequestAccountId] Header value:', selectedAccountHeader);

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
      return selectedAccountHeader;
    } else {
      // Newly created accounts can hit replication lag on account_users; fall back to created_by attribution
      const { data: accountRecord } = await supabaseAdmin
        .from('accounts')
        .select('id, created_by')
        .eq('id', selectedAccountHeader)
        .maybeSingle();

      if (accountRecord?.created_by === userId) {
        console.log(`[API] Allowing access to ${selectedAccountHeader} via created_by fallback for user ${userId}`);
        return selectedAccountHeader;
      }

      console.warn(`[API] User ${userId} doesn't have access to account ${selectedAccountHeader}, falling back to auto-selection`);
    }
  }

  // Fall back to automatic account selection
  const accountId = await getAccountIdForUser(userId, supabaseClient);
  if (accountId) {
    console.log('[getRequestAccountId] Using fallback account:', accountId);
  }

  return accountId;
}
