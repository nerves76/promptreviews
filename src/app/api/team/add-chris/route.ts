/**
 * Add Chris API Route
 * 
 * Special endpoint for adding Chris as a support team member.
 * This doesn't count against team member limits since Chris provides
 * development and support services.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/utils/supabaseClient';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInvitationEmail } from '@/utils/emailTemplates';
import { randomBytes } from 'crypto';

// Chris's email for support access
const CHRIS_EMAIL = 'nerves76@gmail.com';

// 🔧 CONSOLIDATION: Shared server client creation for API routes
async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's account and business information
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts (
          id,
          first_name,
          last_name,
          plan,
          max_users
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (accountError || !accountUser) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner
    if (accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can add Chris for support' },
        { status: 403 }
      );
    }

    // Get accounts data (handle both array and object formats)
    const accounts = Array.isArray(accountUser.accounts) ? accountUser.accounts[0] : accountUser.accounts;

    // Get business name from the businesses table
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountUser.account_id)
      .single();

    // Check if Chris is already a member
    const { data: usersList, error: usersListError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersListError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersListError },
        { status: 500 }
      );
    }
    
    const chrisUser = usersList.users.find(u => u.email === CHRIS_EMAIL);
    const chrisUserId = chrisUser?.id;

    if (chrisUserId) {
      // Check if Chris is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('account_users')
        .select('user_id, role')
        .eq('account_id', accountUser.account_id)
        .eq('user_id', chrisUserId)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'Chris is already a member of this account' },
          { status: 400 }
        );
      }

      // Add Chris directly as a support member (bypassing user limits)
      const { error: addUserError } = await supabase
        .from('account_users')
        .insert({
          account_id: accountUser.account_id,
          user_id: chrisUserId,
          role: 'support' // Special role that doesn't count against limits
        });

      if (addUserError) {
        console.error('Error adding Chris to account:', addUserError);
        return NextResponse.json(
          { error: 'Failed to add Chris to account' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Chris added successfully as support team member',
        added_directly: true
      });
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: inviteCheckError } = await supabase
      .from('account_invitations')
      .select('id')
      .eq('account_id', accountUser.account_id)
      .eq('email', CHRIS_EMAIL)
      .is('accepted_at', null)
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to Chris' },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days for Chris

    // Create invitation with special support role
    const { data: invitation, error: inviteError } = await supabase
      .from('account_invitations')
      .insert({
        account_id: accountUser.account_id,
        email: CHRIS_EMAIL,
        role: 'support', // Special support role
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating Chris invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation for Chris' },
        { status: 500 }
      );
    }

    // Send email invitation
    const inviterName = `${accounts?.first_name || ''} ${accounts?.last_name || ''}`.trim() || 'Someone';
    const businessName = business?.name || 'their business';
    const formattedExpirationDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });

    console.log('📧 Sending support invitation email to Chris...', {
      to: CHRIS_EMAIL,
      from: inviterName,
      business: businessName,
      role: 'support',
      expires: formattedExpirationDate
    });

    // Send the email with custom message for Chris
    const emailResult = await sendTeamInvitationEmail(
      CHRIS_EMAIL,
      inviterName,
      businessName,
      'support',
      token,
      formattedExpirationDate
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation email to Chris:', emailResult.error);
      // Don't fail the request - invitation is created, just email failed
    }

    return NextResponse.json({
      message: 'Invitation sent to Chris for support access',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        email_sent: emailResult.success
      }
    });

  } catch (error) {
    console.error('Add Chris API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 