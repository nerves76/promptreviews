/**
 * Team Invitations API Route
 * 
 * This endpoint handles listing and managing pending invitations.
 * Only account owners can view and manage invitations.
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
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

    // Get account ID using secure method that validates access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }

    // Get the user's role in this account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
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

    // Get pending invitations (without cross-schema join)
    const { data: invitations, error: invitationsError } = await supabase
      .from('account_invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        invited_by
      `)
      .eq('account_id', accountId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Return invitations without trying to resolve invited_by user details
    // This avoids any auth.users access that could cause permission errors
    return NextResponse.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        invited_by: 'Account Owner', // Simplified - avoid auth.users lookup
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

    // Get invitation ID from URL
    const url = new URL(request.url);
    const invitationId = url.searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get account ID using secure method that validates access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }

    // Get the user's role in this account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
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
      .eq('account_id', accountId);

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