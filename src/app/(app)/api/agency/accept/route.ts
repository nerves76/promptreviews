/**
 * Agency Accept API Route
 *
 * POST - Client accepts agency invitation to manage their account
 * GET - Get pending agency invitations for the client's account
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Get pending agency invitations for this client account
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

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

    // Get pending agency access requests for this account
    const { data: pendingAccess, error: accessError } = await supabase
      .from('agncy_client_access')
      .select(`
        id,
        agency_account_id,
        role,
        status,
        invited_at,
        accounts:agency_account_id (
          id,
          business_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('client_account_id', accountId)
      .eq('status', 'pending');

    if (accessError) {
      console.error('Error fetching pending access:', accessError);
      return NextResponse.json(
        { error: 'Failed to fetch pending invitations' },
        { status: 500 }
      );
    }

    const invitations = pendingAccess?.map(access => {
      const agencyAccount = access.accounts as any;
      return {
        id: access.id,
        agency_account_id: access.agency_account_id,
        agency_name: agencyAccount?.business_name,
        agency_contact: `${agencyAccount?.first_name || ''} ${agencyAccount?.last_name || ''}`.trim() || null,
        agency_email: agencyAccount?.email,
        role: access.role,
        invited_at: access.invited_at,
      };
    }) || [];

    // Also get current managing agency if any
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        managing_agncy_id,
        agncy_billing_owner,
        managing_agency:managing_agncy_id (
          id,
          business_name
        )
      `)
      .eq('id', accountId)
      .single();

    return NextResponse.json({
      pending_invitations: invitations,
      pending_count: invitations.length,
      current_agency: account?.managing_agncy_id ? {
        id: account.managing_agncy_id,
        name: (account.managing_agency as any)?.business_name,
        billing_owner: account.agncy_billing_owner,
      } : null,
    });
  } catch (error) {
    console.error('Agency accept GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Accept agency invitation to manage this account
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body = await request.json();
    const { invitation_id } = body;

    if (!invitation_id) {
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

    // Verify user is owner of the client account
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser || accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can accept agency invitations' },
        { status: 403 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('agncy_client_access')
      .select(`
        *,
        agency:agency_account_id (
          id,
          business_name
        )
      `)
      .eq('id', invitation_id)
      .eq('client_account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Check if account already has a managing agency
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('managing_agncy_id')
      .eq('id', accountId)
      .single();

    if (account?.managing_agncy_id && account.managing_agncy_id !== invitation.agency_account_id) {
      return NextResponse.json(
        { error: 'This account is already managed by another agency. Remove them first.' },
        { status: 400 }
      );
    }

    // Accept the invitation - update status
    const { error: updateError } = await supabaseAdmin
      .from('agncy_client_access')
      .update({
        status: 'active',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }

    // Set the managing agency on the client account
    const { error: linkError } = await supabaseAdmin
      .from('accounts')
      .update({
        managing_agncy_id: invitation.agency_account_id,
        agncy_billing_owner: 'client', // Default to client-owned billing
      })
      .eq('id', accountId);

    if (linkError) {
      console.error('Error linking agency:', linkError);
    }

    // Add agency user to client's account_users with appropriate role
    const agencyRole = invitation.role === 'billing_manager' ? 'agency_billing_manager' : 'agency_manager';

    const { error: addUserError } = await supabaseAdmin
      .from('account_users')
      .upsert({
        account_id: accountId,
        user_id: invitation.user_id,
        role: agencyRole,
      }, {
        onConflict: 'account_id,user_id',
      });

    if (addUserError) {
      console.error('Error adding agency user:', addUserError);
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_accepted',
      event_data: {
        agency_account_id: invitation.agency_account_id,
        agency_name: (invitation.agency as any)?.business_name,
        accepted_by: user.id,
        role: invitation.role,
      },
    });

    return NextResponse.json({
      message: 'Agency invitation accepted',
      agency: {
        id: invitation.agency_account_id,
        name: (invitation.agency as any)?.business_name,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error('Agency accept POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
