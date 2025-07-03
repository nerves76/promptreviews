/**
 * Team Members API Route
 * 
 * This endpoint handles listing team members for an account.
 * All users can view team members, with appropriate messaging based on plan.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies() as any;
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

    // Get the user's account relationship first
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', user.id)
      .single();

    if (accountUserError || !accountUser) {
      console.error('Error fetching account user:', accountUserError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get the account details separately
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, first_name, last_name, business_name, plan, max_users')
      .eq('id', accountUser.account_id)
      .single();

    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Account details not found' },
        { status: 404 }
      );
    }

    // Get all account users for this account (simplified query)
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('user_id, role, created_at')
      .eq('account_id', accountUser.account_id)
      .order('created_at', { ascending: true });

    if (accountUsersError) {
      console.error('Error fetching account users:', accountUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Get user details from auth.users for each team member
    const members = [];
    for (const accountUserRecord of accountUsers) {
      try {
        // Get user email from auth.users
        const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(accountUserRecord.user_id);
        
        if (authUser?.user) {
          // Get user's account details (first_name, last_name, business_name)
          const { data: userAccount, error: userAccountError } = await supabase
            .from('accounts')
            .select('first_name, last_name, business_name')
            .eq('id', accountUserRecord.user_id)
            .single();

          members.push({
            user_id: accountUserRecord.user_id,
            role: accountUserRecord.role,
            email: authUser.user.email || '',
            first_name: userAccount?.first_name || '',
            last_name: userAccount?.last_name || '',
            business_name: userAccount?.business_name || '',
            created_at: accountUserRecord.created_at,
            is_current_user: accountUserRecord.user_id === user.id
          });
        }
      } catch (error) {
        console.error(`Error fetching user details for ${accountUserRecord.user_id}:`, error);
        // Still include the member with minimal info if auth lookup fails
        members.push({
          user_id: accountUserRecord.user_id,
          role: accountUserRecord.role,
          email: '',
          first_name: '',
          last_name: '',
          business_name: '',
          created_at: accountUserRecord.created_at,
          is_current_user: accountUserRecord.user_id === user.id
        });
      }
    }

    // Get current user count using the function (with fallback)
    let userCount = members.length;
    try {
      const { data: dbUserCount, error: countError } = await supabase
        .rpc('get_account_user_count', { account_uuid: accountUser.account_id });
      
      if (!countError && dbUserCount !== null) {
        userCount = dbUserCount;
      }
    } catch (error) {
      console.error('Error getting user count from function:', error);
      // Use members.length as fallback
    }

    return NextResponse.json({
      members,
      account: {
        id: account.id,
        first_name: account.first_name || '',
        last_name: account.last_name || '',
        business_name: account.business_name || '',
        plan: account.plan || 'grower',
        max_users: account.max_users || 1,
        current_users: userCount,
        can_add_more: userCount < (account.max_users || 1)
      },
      current_user_role: accountUser.role
    });

  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 