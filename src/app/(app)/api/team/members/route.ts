/**
 * Team Members API Route
 * 
 * This endpoint handles listing team members for an account.
 * Only account owners can view the full team member list.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccountId } from '../../utils/getRequestAccountId';

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
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account ID using secure method that validates access
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }
    
    // Get the account and user's role
    const { data: accountUsers, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts!inner (
          id,
          first_name,
          last_name,
          business_name,
          plan,
          max_users
        )
      `)
      .eq('user_id', user.id)
      .eq('account_id', accountId);
    
    // Get the account user data
    const accountUser = accountUsers?.[0];


    // If account_user doesn't exist, check if the user has their own account
    // This handles users created before the account_users system was fully implemented
    if (!accountUser && accountError && accountError.code === 'PGRST116') {
      
      // Check if user has an account with their user_id as account_id
      const { data: userAccount, error: userAccountError } = await supabase
        .from('accounts')
        .select(`
          id,
          first_name,
          last_name,
          business_name,
          plan,
          max_users
        `)
        .eq('id', accountId)
        .single();

      if (userAccount && !userAccountError) {
        
        // Create the missing account_users entry
        const { error: insertError } = await supabase
          .from('account_users')
          .insert({
            user_id: user.id,
            account_id: accountId,
            role: 'owner'
          });

        if (insertError) {
          console.error('🚨 Failed to create account_users entry:', insertError);
          return NextResponse.json(
            { error: 'Failed to initialize account relationship' },
            { status: 500 }
          );
        }

        
        // Now we can proceed with the account_user data
        const reconstructedAccountUser = {
          account_id: accountId,
          role: 'owner' as const,
          accounts: userAccount
        };

        // Continue with the rest of the logic using reconstructedAccountUser
        return await processTeamMembers(supabase, supabaseAdmin, user, reconstructedAccountUser);
      } else {
        console.error('🚨 No account found for user:', userAccountError);
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
    } else if (accountError || !accountUser) {
      console.error('🚨 Error fetching account user:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }


    // Continue with normal processing
    return await processTeamMembers(supabase, supabaseAdmin, user, accountUser);

  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract the team processing logic into a separate function
async function processTeamMembers(supabase: any, supabaseAdmin: any, user: any, accountUser: any) {
  try {
    // Get all team members for this account (without auth_users join)
    // Use admin client to bypass RLS and ensure we get ALL team members including support
    const { data: accountUsers, error: accountUsersError } = await supabaseAdmin
      .from('account_users')
      .select(`
        user_id,
        role,
        created_at,
        accounts (
          first_name,
          last_name,
          business_name
        )
      `)
      .eq('account_id', accountUser.account_id)
      .order('created_at', { ascending: true });

    if (accountUsersError) {
      console.error('Error fetching account users:', accountUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    
    // Get all user IDs we need to fetch
    const userIds = accountUsers.map((au: any) => au.user_id);
    
    // Fetch all users and create a map
    const { data: authUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (listError) {
      console.error('Error fetching users list:', listError);
    }
    
    // Create a map of user_id to email
    const userEmailMap = new Map();
    if (authUsersData?.users) {
      authUsersData.users.forEach((u: any) => {
        userEmailMap.set(u.id, u.email);
      });
    }
    
    // Map the account users with their emails
    const membersWithDetails = accountUsers.map((accountUserEntry: any) => {
      const email = userEmailMap.get(accountUserEntry.user_id) || '';
      
      
      return {
        user_id: accountUserEntry.user_id,
        role: accountUserEntry.role,
        email: email,
        first_name: accountUserEntry.accounts?.[0]?.first_name || '',
        last_name: accountUserEntry.accounts?.[0]?.last_name || '',
        business_name: accountUserEntry.accounts?.[0]?.business_name || '',
        created_at: accountUserEntry.created_at,
        is_current_user: accountUserEntry.user_id === user.id
      };
    });

    const members = membersWithDetails;

    // Get current user count
    const { data: userCount, error: countError } = await supabase
      .rpc('get_account_user_count', { account_uuid: accountUser.account_id });

    if (countError) {
      console.error('Error getting user count:', countError);
    }

    // Since accounts can be an object or array, handle both cases
    const account = Array.isArray(accountUser.accounts) ? accountUser.accounts[0] : accountUser.accounts;
    
    const accountData = {
      id: account?.id,
      first_name: account?.first_name,
      last_name: account?.last_name,
      business_name: account?.business_name,
      plan: account?.plan,
      max_users: account?.max_users,
      current_users: userCount || members.length,
      can_add_more: (userCount || members.length) < (account?.max_users ?? 0)
    };

    // Debug logging

    return NextResponse.json({
      members,
      account: accountData,
      current_user_role: accountUser.role
    });

  } catch (error) {
    console.error('processTeamMembers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

/**
 * DELETE - Remove a team member (owners only)
 */
export async function DELETE(request: NextRequest) {
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

    // Get member ID from URL
    const url = new URL(request.url);
    const memberUserId = url.searchParams.get('user_id');

    if (!memberUserId) {
      return NextResponse.json(
        { error: 'Member user ID is required' },
        { status: 400 }
      );
    }

    // Get account ID using secure method
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }

    // Get the current user's role in this account
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
        { error: 'Only account owners can remove team members' },
        { status: 403 }
      );
    }

    // Prevent self-removal
    if (memberUserId === user.id) {
      return NextResponse.json(
        { error: 'Account owners cannot remove themselves' },
        { status: 400 }
      );
    }

    // Get member details for cleanup
    const { data: memberToRemove, error: memberError } = await supabaseAdmin.auth.admin.getUserById(memberUserId);
    
    if (memberError || !memberToRemove.user) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify member is actually in this account
    const { data: memberAccount, error: memberAccountError } = await supabase
      .from('account_users')
      .select('user_id, role')
      .eq('account_id', accountUser.account_id)
      .eq('user_id', memberUserId)
      .single();

    if (memberAccountError || !memberAccount) {
      return NextResponse.json(
        { error: 'Member is not part of this account' },
        { status: 404 }
      );
    }

    // Prevent removing other owners (for safety)
    if (memberAccount.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove other account owners' },
        { status: 400 }
      );
    }

    // Remove user from account with cleanup
    const { error: removeError } = await supabaseAdmin
      .from('account_users')
      .delete()
      .eq('account_id', accountUser.account_id)
      .eq('user_id', memberUserId);

    if (removeError) {
      console.error('Error removing user from account:', removeError);
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      );
    }

    // Clean up any invitation records for this user
    const { error: invitationCleanupError } = await supabaseAdmin
      .from('account_invitations')
      .delete()
      .eq('account_id', accountUser.account_id)
      .eq('email', memberToRemove.user.email);

    if (invitationCleanupError) {
      console.warn('Failed to clean up invitation records:', invitationCleanupError);
      // Don't fail the request - member removal was successful
    }


    return NextResponse.json({
      message: 'Team member removed successfully',
      removed_user: {
        user_id: memberUserId,
        email: memberToRemove.user.email
      }
    });

  } catch (error) {
    console.error('Team member removal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update team member role (owners only)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();

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
    const { user_id: memberUserId, role: newRole } = await request.json();

    if (!memberUserId || !newRole) {
      return NextResponse.json(
        { error: 'Member user ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'member', 'support'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "owner", "member", or "support"' },
        { status: 400 }
      );
    }

    // Get account ID using secure method
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }

    // Get the current user's role in this account
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
        { error: 'Only account owners can change member roles' },
        { status: 403 }
      );
    }

    // Prevent changing own role (for safety)
    if (memberUserId === user.id) {
      return NextResponse.json(
        { error: 'Account owners cannot change their own role' },
        { status: 400 }
      );
    }

    // Verify member is actually in this account
    const { data: memberAccount, error: memberAccountError } = await supabase
      .from('account_users')
      .select('user_id, role')
      .eq('account_id', accountUser.account_id)
      .eq('user_id', memberUserId)
      .single();

    if (memberAccountError || !memberAccount) {
      return NextResponse.json(
        { error: 'Member is not part of this account' },
        { status: 404 }
      );
    }

    // Update member role
    const { error: updateError } = await supabase
      .from('account_users')
      .update({ role: newRole })
      .eq('account_id', accountUser.account_id)
      .eq('user_id', memberUserId);

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      message: 'Member role updated successfully',
      updated_member: {
        user_id: memberUserId,
        new_role: newRole,
        previous_role: memberAccount.role
      }
    });

  } catch (error) {
    console.error('Team member role update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 