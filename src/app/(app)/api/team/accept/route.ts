/**
 * Team Invitation Acceptance API Route
 * 
 * This endpoint handles accepting team invitations via tokens.
 * It validates the token and adds the user to the team.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 🔧 CONSOLIDATION: Shared server client creation for API routes
// This eliminates duplicate client creation patterns
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

export async function GET(request: NextRequest) {
  // 🔧 CONSOLIDATED: Use shared client creation functions
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient(); // 🔧 Use centralized service role client

  try {
    // Get token from URL
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
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

    // Get business name from the businesses table
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', invitation.account_id)
      .single();

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabaseAdmin.auth.admin.getUserById(invitation.invited_by);

    return NextResponse.json({
      invitation: {
        ...invitation,
        business_name: business?.name || 'Team Account',
        inviter_name: inviter?.user ? `${inviter.user.user_metadata?.first_name || ''} ${inviter.user.user_metadata?.last_name || ''}`.trim() : 'Account Owner'
      }
    });

  } catch (error) {
    console.error('Team accept GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 🔧 CONSOLIDATED: Use shared client creation functions
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient(); // 🔧 Use centralized service role client

  try {
    // Get request body
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
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

    // Get current user (if any)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // If user is logged in, check if email matches
    if (user && user.email !== invitation.email) {
      return NextResponse.json(
        { 
          error: 'Email address does not match invitation',
          details: {
            invitationEmail: invitation.email,
            currentUserEmail: user.email,
            message: 'You are logged in with a different email address. Please sign out and sign in with the email that received the invitation, or contact the account owner to send a new invitation to your current email.'
          }
        },
        { status: 403 }
      );
    }

    // If user is logged in and email matches, or no user is logged in (new user)
    // We'll proceed with the invitation acceptance
    // For new users, we'll need to create an account first
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Account creation required',
          details: {
            invitationEmail: invitation.email,
            message: 'Please create an account to accept this invitation.',
            requiresSignup: true
          }
        },
        { status: 401 }
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
      console.error('❌ Error adding user to account:', {
        error: addUserError,
        code: addUserError.code,
        message: addUserError.message,
        details: addUserError.details,
        hint: addUserError.hint,
        account_id: invitation.account_id,
        user_id: user.id,
        role: invitation.role
      });
      
      // Try using service role client as fallback
      const { error: fallbackError } = await supabaseAdmin
        .from('account_users')
        .insert({
          account_id: invitation.account_id,
          user_id: user.id,
          role: invitation.role
        });

      if (fallbackError) {
        console.error('❌ Fallback also failed:', {
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
    console.error('Team accept POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 