/**
 * Agency Approve API Route (Admin Only)
 *
 * Approves an agency conversion request and converts the account.
 * This endpoint performs the actual conversion and auto-links owned accounts.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ApproveRequest {
  accountId: string;
  metadata?: {
    agncy_type?: string;
    agncy_employee_count?: string;
    agncy_expected_clients?: string;
    agncy_multi_location_pct?: string;
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get the current user (must be admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: ApproveRequest = await request.json();

    if (!body.accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get the account to convert
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, business_name, is_agncy')
      .eq('id', body.accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.is_agncy) {
      return NextResponse.json(
        { error: 'Account is already an agency' },
        { status: 400 }
      );
    }

    // Get the conversion request event to retrieve metadata
    const { data: requestEvent } = await supabaseAdmin
      .from('account_events')
      .select('event_data')
      .eq('account_id', body.accountId)
      .eq('event_type', 'agency_conversion_requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Use metadata from request event, or from body, or defaults
    const eventData = requestEvent?.event_data as any || {};
    const metadata = {
      agncy_type: body.metadata?.agncy_type || eventData.agncy_type || 'other',
      agncy_employee_count: body.metadata?.agncy_employee_count || eventData.agncy_employee_count || '1',
      agncy_expected_clients: body.metadata?.agncy_expected_clients || eventData.agncy_expected_clients || '1-5',
      agncy_multi_location_pct: body.metadata?.agncy_multi_location_pct || eventData.agncy_multi_location_pct || '0',
    };

    // Calculate 30-day agency trial end
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    // Convert the account to agency
    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        is_agncy: true,
        agncy_trial_start: now.toISOString(),
        agncy_trial_end: trialEnd.toISOString(),
        agncy_type: metadata.agncy_type,
        agncy_employee_count: metadata.agncy_employee_count,
        agncy_expected_clients: metadata.agncy_expected_clients,
        agncy_multi_location_pct: metadata.agncy_multi_location_pct,
        business_creation_complete: true,
      })
      .eq('id', body.accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Error converting to agency:', updateError);
      return NextResponse.json(
        { error: 'Failed to convert account to agency', details: updateError.message },
        { status: 500 }
      );
    }

    // Get the account owner for auto-linking
    const { data: accountOwner } = await supabaseAdmin
      .from('account_users')
      .select('user_id')
      .eq('account_id', body.accountId)
      .eq('role', 'owner')
      .single();

    let linkedAccountsCount = 0;

    if (accountOwner) {
      // Find all other accounts where the owner is also an owner
      const { data: ownedAccounts, error: ownedAccountsError } = await supabaseAdmin
        .from('account_users')
        .select('account_id')
        .eq('user_id', accountOwner.user_id)
        .eq('role', 'owner')
        .neq('account_id', body.accountId);

      if (!ownedAccountsError && ownedAccounts && ownedAccounts.length > 0) {
        const clientAccessRecords = ownedAccounts.map(acc => ({
          agency_account_id: body.accountId,
          client_account_id: acc.account_id,
          user_id: accountOwner.user_id,
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

        if (!linkError) {
          linkedAccountsCount = ownedAccounts.length;
        } else {
          console.error('Error auto-linking accounts:', linkError);
        }
      }
    }

    // Log the approval event
    await supabaseAdmin.from('account_events').insert({
      account_id: body.accountId,
      event_type: 'agency_converted',
      event_data: {
        approved_by: user.id,
        approved_by_email: user.email,
        agncy_type: metadata.agncy_type,
        trial_end: trialEnd.toISOString(),
        auto_linked_accounts: linkedAccountsCount,
      },
    });

    return NextResponse.json({
      message: 'Account converted to agency successfully',
      account: {
        id: updatedAccount.id,
        business_name: updatedAccount.business_name,
        is_agncy: updatedAccount.is_agncy,
        agncy_trial_end: updatedAccount.agncy_trial_end,
        agncy_type: updatedAccount.agncy_type,
      },
      trial: {
        starts: now.toISOString(),
        ends: trialEnd.toISOString(),
        days_remaining: 30,
      },
      auto_linked: {
        count: linkedAccountsCount,
        message: linkedAccountsCount > 0
          ? `${linkedAccountsCount} account${linkedAccountsCount !== 1 ? 's' : ''} auto-linked as clients.`
          : 'No other accounts to link.',
      },
    });

  } catch (error) {
    console.error('Agency approve API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
