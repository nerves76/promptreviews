/**
 * Agency Remove API Route
 *
 * POST - Client removes agency access from their account
 * This is the client-initiated version of disconnection
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Client removes agency access from their account
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner of the account
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser || accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can remove agency access' },
        { status: 403 }
      );
    }

    // Get current account with agency info
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        id,
        managing_agncy_id,
        agncy_billing_owner,
        managing_agency:managing_agncy_id (
          id,
          business_name
        )
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.managing_agncy_id) {
      return NextResponse.json(
        { error: 'This account is not managed by any agency' },
        { status: 400 }
      );
    }

    const agencyAccountId = account.managing_agncy_id;
    const agencyName = (account.managing_agency as any)?.business_name;
    const wasAgencyBilling = account.agncy_billing_owner === 'agency';

    // Mark all agency access records as removed
    const { error: accessUpdateError } = await supabaseAdmin
      .from('agncy_client_access')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', accountId)
      .in('status', ['pending', 'active']);

    if (accessUpdateError) {
      console.error('Error updating access records:', accessUpdateError);
    }

    // Get agency users to remove from account_users
    const { data: agencyAccess, error: accessFetchError } = await supabaseAdmin
      .from('agncy_client_access')
      .select('user_id')
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', accountId);

    // Remove agency users from account_users
    if (agencyAccess) {
      for (const access of agencyAccess) {
        await supabaseAdmin
          .from('account_users')
          .delete()
          .eq('account_id', accountId)
          .eq('user_id', access.user_id)
          .in('role', ['agency_manager', 'agency_billing_manager']);
      }
    }

    // Clear agency relationship on account
    const { error: clearRelationError } = await supabaseAdmin
      .from('accounts')
      .update({
        managing_agncy_id: null,
        agncy_billing_owner: 'client',
      })
      .eq('id', accountId);

    if (clearRelationError) {
      console.error('Error clearing agency relationship:', clearRelationError);
      return NextResponse.json(
        { error: 'Failed to remove agency access' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_removed',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyName,
        removed_by: user.id,
        was_agency_billing: wasAgencyBilling,
        initiated_by: 'client',
      },
    });

    // If agency was billing, handle the transition
    let billingNote = null;
    if (wasAgencyBilling) {
      // TODO: Implement actual Stripe subscription transition
      // For now, mark for downgrade
      await supabaseAdmin
        .from('accounts')
        .update({
          subscription_status: 'canceling',
        })
        .eq('id', accountId);

      billingNote = 'Your account will be downgraded to free tier when the current billing period ends. Add a payment method to maintain your subscription.';
    }

    return NextResponse.json({
      message: 'Agency access removed successfully',
      removed_agency: {
        id: agencyAccountId,
        name: agencyName,
      },
      was_agency_billing: wasAgencyBilling,
      billing_note: billingNote,
    });
  } catch (error) {
    console.error('Agency remove POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Decline a pending agency invitation
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitation_id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitation_id is required' },
        { status: 400 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser || accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can decline agency invitations' },
        { status: 403 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('agncy_client_access')
      .select('id, agency_account_id, status')
      .eq('id', invitationId)
      .eq('client_account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Mark as removed (declined)
    const { error: updateError } = await supabaseAdmin
      .from('agncy_client_access')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error declining invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to decline invitation' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_declined',
      event_data: {
        agency_account_id: invitation.agency_account_id,
        declined_by: user.id,
      },
    });

    return NextResponse.json({
      message: 'Agency invitation declined',
    });
  } catch (error) {
    console.error('Agency remove DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
