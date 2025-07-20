/**
 * Team Members API Route
 * 
 * This endpoint handles listing team members for an account.
 * Only account owners can view the full team member list.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/utils/supabaseClient';
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
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's account
    console.log('🔍 Looking for account_user with user_id:', user.id);
    
    const { data: accountUser, error: accountError } = await supabase
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
      .single();

    console.log('🔍 accountUser result:', accountUser);
    console.log('🔍 accountError:', accountError);

    // If account_user doesn't exist, check if the user has their own account
    // This handles users created before the account_users system was fully implemented
    if (accountError && accountError.code === 'PGRST116') {
      console.log('🔧 No account_users entry found, checking for user account...');
      
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
        .eq('id', user.id)
        .single();

      if (userAccount && !userAccountError) {
        console.log('🔧 Found user account, creating missing account_users entry...');
        
        // Create the missing account_users entry
        const { error: insertError } = await supabase
          .from('account_users')
          .insert({
            user_id: user.id,
            account_id: user.id,
            role: 'owner'
          });

        if (insertError) {
          console.error('🚨 Failed to create account_users entry:', insertError);
          return NextResponse.json(
            { error: 'Failed to initialize account relationship' },
            { status: 500 }
          );
        }

        console.log('✅ Successfully created account_users entry');
        
        // Now we can proceed with the account_user data
        const reconstructedAccountUser = {
          account_id: user.id,
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

    console.log('🔍 accounts array:', accountUser?.accounts);

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
    const { data: accountUsers, error: accountUsersError } = await supabase
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

    // Get auth user details using admin client
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    // Create a map for quick lookup of auth users by ID
    const authUserMap = new Map();
    authUsers.users.forEach((authUser: any) => {
      authUserMap.set(authUser.id, authUser);
    });

    // Merge account_users with auth user details
    const members = accountUsers.map(accountUserEntry => {
      const authUser = authUserMap.get(accountUserEntry.user_id);
      return {
        user_id: accountUserEntry.user_id,
        role: accountUserEntry.role,
        email: authUser?.email || '',
        first_name: accountUserEntry.accounts?.[0]?.first_name || '',
        last_name: accountUserEntry.accounts?.[0]?.last_name || '',
        business_name: accountUserEntry.accounts?.[0]?.business_name || '',
        created_at: accountUserEntry.created_at,
        is_current_user: accountUserEntry.user_id === user.id
      };
    });

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
    console.log('Team API - Account data:', accountData);
    console.log('Team API - Raw account from DB:', account);

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