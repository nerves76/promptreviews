/**
 * Agency Re-link API Route
 *
 * Re-runs the auto-link logic to link accounts the user owns
 * as clients of their agency account.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the selected account
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner of this account
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser || accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can re-link accounts' },
        { status: 403 }
      );
    }

    // Verify this is an agency account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, is_agncy, business_name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 400 }
      );
    }

    // Auto-link other accounts where this user is an owner
    const supabaseAdmin = createServiceRoleClient();

    // Find all other accounts where the user is an owner (excluding the agency account)
    const { data: ownedAccounts, error: ownedAccountsError } = await supabaseAdmin
      .from('account_users')
      .select('account_id, accounts(id, business_name)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .neq('account_id', accountId);

    if (ownedAccountsError) {
      console.error('Error fetching owned accounts:', ownedAccountsError);
      return NextResponse.json(
        { error: 'Failed to fetch owned accounts' },
        { status: 500 }
      );
    }

    if (!ownedAccounts || ownedAccounts.length === 0) {
      return NextResponse.json({
        message: 'No other accounts found to link',
        linked: [],
        count: 0,
      });
    }

    // Create agncy_client_access records for each owned account
    const clientAccessRecords = ownedAccounts.map(acc => ({
      agency_account_id: accountId,
      client_account_id: acc.account_id,
      user_id: user.id,
      role: 'billing_manager',
      status: 'active',
      accepted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }));

    const { error: linkError } = await supabaseAdmin
      .from('agncy_client_access')
      .upsert(clientAccessRecords, {
        onConflict: 'agency_account_id,client_account_id,user_id',
        ignoreDuplicates: true,
      });

    if (linkError) {
      console.error('Error linking accounts:', linkError);
      return NextResponse.json(
        { error: 'Failed to link accounts', details: linkError.message },
        { status: 500 }
      );
    }

    // Build response with account names
    const linkedAccounts = ownedAccounts.map(acc => ({
      id: acc.account_id,
      name: (acc.accounts as any)?.business_name || 'Unnamed account',
    }));

    // Log the event
    await supabase.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_relinked',
      event_data: {
        user_id: user.id,
        linked_count: linkedAccounts.length,
        linked_accounts: linkedAccounts.map(a => a.id),
      },
    });

    return NextResponse.json({
      message: `Successfully linked ${linkedAccounts.length} account${linkedAccounts.length !== 1 ? 's' : ''}`,
      linked: linkedAccounts,
      count: linkedAccounts.length,
    });

  } catch (error) {
    console.error('Agency relink API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
