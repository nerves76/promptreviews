/**
 * Team Members API Route
 * 
 * This endpoint handles listing team members for an account.
 * Only account owners can view the full team member list.
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

    // Get all team members for this account
    const { data: members, error: membersError } = await supabase
      .from('account_users')
      .select(`
        user_id,
        role,
        created_at,
        auth_users (
          id,
          email,
          user_metadata
        ),
        accounts (
          first_name,
          last_name,
          business_name
        )
      `)
      .eq('account_id', accountUser.account_id)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Get current user count
    const { data: userCount, error: countError } = await supabase
      .rpc('get_account_user_count', { account_uuid: accountUser.account_id });

    if (countError) {
      console.error('Error getting user count:', countError);
    }

    return NextResponse.json({
      members: members.map(member => ({
        user_id: member.user_id,
        role: member.role,
        email: member.auth_users?.email,
        first_name: member.accounts?.first_name || '',
        last_name: member.accounts?.last_name || '',
        business_name: member.accounts?.business_name || '',
        created_at: member.created_at,
        is_current_user: member.user_id === user.id
      })),
      account: {
        id: accountUser.accounts.id,
        first_name: accountUser.accounts.first_name,
        last_name: accountUser.accounts.last_name,
        business_name: accountUser.accounts.business_name,
        plan: accountUser.accounts.plan,
        max_users: accountUser.accounts.max_users,
        current_users: userCount || members.length,
        can_add_more: (userCount || members.length) < accountUser.accounts.max_users
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