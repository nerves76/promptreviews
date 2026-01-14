/**
 * Agency Client Invite API Route
 *
 * POST - Send invitation to link an existing account to the agency
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendNotificationToAccountOwner } from '@/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body = await request.json();
    const { client_email } = body;

    if (!client_email?.trim()) {
      return NextResponse.json(
        { error: 'Client email is required' },
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

    const agencyAccountId = await getRequestAccountId(request, user.id, supabase);

    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify this is an agency account
    const { data: agencyAccount, error: agencyError } = await supabase
      .from('accounts')
      .select('id, is_agncy, business_name')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount) {
      return NextResponse.json(
        { error: 'Agency account not found' },
        { status: 404 }
      );
    }

    if (!agencyAccount.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Verify user is owner of agency
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can invite clients' },
        { status: 403 }
      );
    }

    // Find the account by email
    const { data: targetAccount, error: findError } = await supabaseAdmin
      .from('accounts')
      .select('id, business_name, email, managing_agncy_id')
      .eq('email', client_email.trim().toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (findError) {
      console.error('Error finding account:', findError);
      return NextResponse.json(
        { error: 'Failed to look up account' },
        { status: 500 }
      );
    }

    if (!targetAccount) {
      return NextResponse.json(
        { error: 'No account found with that email address. The client needs to create a Prompt Reviews account first.' },
        { status: 404 }
      );
    }

    // Check if already managed by an agency
    if (targetAccount.managing_agncy_id) {
      if (targetAccount.managing_agncy_id === agencyAccountId) {
        return NextResponse.json(
          { error: 'This account is already linked to your agency' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'This account is already managed by another agency' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite, error: existingError } = await supabaseAdmin
      .from('agncy_client_access')
      .select('id, status')
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', targetAccount.id)
      .maybeSingle();

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return NextResponse.json(
          { error: 'An invitation is already pending for this account' },
          { status: 400 }
        );
      }
      if (existingInvite.status === 'active') {
        return NextResponse.json(
          { error: 'This account is already linked to your agency' },
          { status: 400 }
        );
      }
    }

    // Create pending invitation
    const { data: invitation, error: createError } = await supabaseAdmin
      .from('agncy_client_access')
      .insert({
        agency_account_id: agencyAccountId,
        client_account_id: targetAccount.id,
        user_id: user.id,
        role: 'manager',
        status: 'pending',
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Log the event on the client account
    await supabaseAdmin.from('account_events').insert({
      account_id: targetAccount.id,
      event_type: 'agency_invitation_received',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyAccount.business_name,
        invited_by: user.id,
        invitation_id: invitation.id,
      },
    });

    // Get inviter name for notification
    const { data: inviterAccount } = await supabaseAdmin
      .from('accounts')
      .select('first_name, last_name')
      .eq('id', agencyAccountId)
      .single();

    const inviterName = inviterAccount
      ? `${inviterAccount.first_name || ''} ${inviterAccount.last_name || ''}`.trim() || agencyAccount.business_name
      : agencyAccount.business_name;

    // Send notification to the client account owner (in-app + email)
    await sendNotificationToAccountOwner(targetAccount.id, 'agency_invitation_received', {
      agencyName: agencyAccount.business_name || 'An agency',
      inviterName: inviterName || 'Someone',
      role: 'manager',
      invitationId: invitation.id,
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        client_account_id: targetAccount.id,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Agency client invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
