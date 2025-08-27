import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';

export async function GET() {
  try {
    const client = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await client.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: userError?.message 
      }, { status: 401 });
    }

    // Try to query account_users
    const { data: accountUsers, error: accountUsersError } = await client
      .from('account_users')
      .select('*')
      .eq('user_id', user.id);

    // Try to query accounts directly
    const { data: accounts, error: accountsError } = await client
      .from('accounts')
      .select('*')
      .eq('id', user.id);

    // Try to query businesses
    const { data: businesses, error: businessesError } = await client
      .from('businesses')
      .select('*')
      .eq('account_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        confirmed: user.email_confirmed_at
      },
      account_users: {
        data: accountUsers,
        error: accountUsersError?.message,
        count: accountUsers?.length || 0
      },
      accounts: {
        data: accounts,
        error: accountsError?.message,
        count: accounts?.length || 0
      },
      businesses: {
        data: businesses,
        error: businessesError?.message,
        count: businesses?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}