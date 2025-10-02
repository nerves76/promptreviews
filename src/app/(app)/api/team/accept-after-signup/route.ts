/**
 * Team Invitation Acceptance After Signup API Route
 * 
 * This endpoint handles accepting team invitations for users who just signed up.
 * It's designed to work with the signup flow and automatically add users to teams.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

  // Create service role client for RLS bypass
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get request body
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get current user (should be logged in after signup)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get invitation by token using service role to bypass RLS
    // RLS is enabled with owner-only policies, so we need service role for token lookups
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('account_invitations')
      .select(`
        id,
        email,
        role,
        account_id,
        expires_at,
        invited_by,
        accepted_at
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      return NextResponse.json(
        { 
          error: 'Email address does not match invitation',
          details: {
            invitationEmail: invitation.email,
            currentUserEmail: user.email
          }
        },
        { status: 403 }
      );
    }

    // Check if user is already a member of this account
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', invitation.account_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this account' },
        { status: 400 }
      );
    }

    // Check if account can add more users
    const { data: canAdd, error: canAddError } = await supabase
      .rpc('can_add_user_to_account', { account_uuid: invitation.account_id });

    if (canAddError) {
      console.error('Error checking if can add user:', canAddError);
      return NextResponse.json(
        { error: 'Failed to check user limits' },
        { status: 500 }
      );
    }

    if (!canAdd) {
      return NextResponse.json(
        { error: 'Account has reached its user limit' },
        { status: 400 }
      );
    }

    // Add user to account

    const { error: addUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: invitation.account_id,
        user_id: user.id,
        role: invitation.role
      });

    if (addUserError) {
      console.error('❌ Error adding user to account in accept-after-signup:', {
        error: addUserError,
        code: addUserError.code,
        message: addUserError.message,
        details: addUserError.details,
        hint: addUserError.hint,
        account_id: invitation.account_id,
        user_id: user.id,
        role: invitation.role
      });

      // Try with service role client as fallback
      const supabaseAdmin = createServiceRoleClient();
      const { error: fallbackError } = await supabaseAdmin
        .from('account_users')
        .insert({
          account_id: invitation.account_id,
          user_id: user.id,
          role: invitation.role
        });

      if (fallbackError) {
        console.error('❌ Fallback also failed in accept-after-signup:', {
          error: fallbackError,
          code: fallbackError.code,
          message: fallbackError.message,
          details: fallbackError.details,
          hint: fallbackError.hint
        });
        
        return NextResponse.json(
          { 
            error: 'Failed to add user to account',
            details: {
              primary_error: addUserError.message,
              fallback_error: fallbackError.message,
              account_id: invitation.account_id,
              user_id: user.id
            }
          },
          { status: 500 }
        );
      } else {
      }
    } else {
    }

    // Mark invitation as accepted using service role to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('account_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail the request if this fails - user is already added
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      account_id: invitation.account_id,
      role: invitation.role
    });

  } catch (error) {
    console.error('Team accept after signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 