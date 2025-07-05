/**
 * Team Invite API Route
 * 
 * This endpoint handles sending invitations to join a team.
 * Only account owners can send invitations.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendTeamInvitationEmail } from '@/utils/emailTemplates';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  // Create service role client for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { email, role = 'member' } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['owner', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "owner" or "member"' },
        { status: 400 }
      );
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts (
          id,
          first_name,
          last_name,
          business_name,
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
        { error: 'Only account owners can send invitations' },
        { status: 403 }
      );
    }

    // Check if account can add more users
    const { data: canAdd, error: canAddError } = await supabase
      .rpc('can_add_user_to_account', { account_uuid: accountUser.account_id });

    if (canAddError) {
      console.error('Error checking if can add user:', canAddError);
      return NextResponse.json(
        { error: 'Failed to check user limits' },
        { status: 500 }
      );
    }

    if (!canAdd) {
      return NextResponse.json(
        { 
          error: 'User limit reached',
          details: {
            current_users: accountUser.accounts?.[0]?.max_users,
            max_users: accountUser.accounts?.[0]?.max_users,
            plan: accountUser.accounts?.[0]?.plan
          }
        },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: usersList, error: usersListError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersListError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersListError },
        { status: 500 }
      );
    }
    const foundUser = usersList.users.find(u => u.email === email.trim());
    const foundUserId = foundUser?.id;

    const { data: existingMember, error: memberCheckError } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', accountUser.account_id)
      .eq('user_id', foundUserId || '')
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this account' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: inviteCheckError } = await supabase
      .from('account_invitations')
      .select('id')
      .eq('account_id', accountUser.account_id)
      .eq('email', email.trim())
      .is('accepted_at', null)
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('account_invitations')
      .insert({
        account_id: accountUser.account_id,
        email: email.trim(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send email invitation
    const inviterName = `${accountUser.accounts?.first_name || ''} ${accountUser.accounts?.last_name || ''}`.trim() || 'Someone';
    const businessName = accountUser.accounts?.business_name || 'their business';
    const formattedExpirationDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });

    console.log('📧 Sending invitation email...', {
      to: invitation.email,
      inviterName,
      businessName,
      role: invitation.role
    });

    const emailResult = await sendTeamInvitationEmail(
      invitation.email,
      inviterName,
      businessName,
      invitation.role,
      invitation.token,
      formattedExpirationDate
    );

    if (!emailResult.success) {
      console.error('❌ Failed to send invitation email:', emailResult.error);
      // Don't fail the entire request if email fails - invitation is still created
    } else {
      console.log('✅ Invitation email sent successfully');
    }

    console.log('Invitation created:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expires_at: invitation.expires_at
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Team invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 