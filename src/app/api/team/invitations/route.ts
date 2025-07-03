/**
 * Team Invitations API Route
 * 
 * This endpoint handles listing and managing pending invitations.
 * Only account owners can view and manage invitations.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
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
        { error: 'Only account owners can view invitations' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('account_invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        invited_by,
        auth_users!invited_by (
          email
        )
      `)
      .eq('account_id', accountUser.account_id)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        invited_by: invitation.auth_users?.[0]?.email,
        is_expired: new Date(invitation.expires_at) < new Date()
      }))
    });

  } catch (error) {
    console.error('Team invitations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get invitation ID from URL
    const url = new URL(request.url);
    const invitationId = url.searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
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
        { error: 'Only account owners can cancel invitations' },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('account_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('account_id', accountUser.account_id);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Team invitation delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 