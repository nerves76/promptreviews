import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/auth/providers/supabase';

// DEBUG ENDPOINT - Remove this file after fixing duplicate accounts issue
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role to check all accounts
    const supabaseAdmin = createServiceRoleClient();

    // Check accounts table
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, plan, created_at')
      .eq('id', user.id);

    // Check account_users table
    const { data: accountUsers, error: accountUsersError } = await supabaseAdmin
      .from('account_users')
      .select('account_id, user_id, role, created_at')
      .eq('user_id', user.id);

    // Check for duplicate accounts (shouldn't happen, but checking anyway)
    const { data: duplicateAccounts } = await supabaseAdmin
      .from('accounts')
      .select('id, email, plan, created_at')
      .eq('email', user.email);

    // Check active triggers
    const { data: triggers } = await supabaseAdmin.rpc('get_active_triggers', {
      schema_name: 'auth',
      table_name: 'users'
    }).catch(() => ({ data: null }));

    return NextResponse.json({
      debug: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        confirmed_at: user.confirmed_at,
      },
      accounts: {
        count: accounts?.length || 0,
        data: accounts || [],
        error: accountsError?.message
      },
      account_users: {
        count: accountUsers?.length || 0,
        data: accountUsers || [],
        error: accountUsersError?.message
      },
      duplicate_check: {
        count: duplicateAccounts?.length || 0,
        data: duplicateAccounts || []
      },
      triggers: triggers || 'Unable to fetch trigger info',
      issue_detected: (accounts?.length || 0) > 1 || (accountUsers?.length || 0) > 1,
      message: (accounts?.length || 0) > 1
        ? 'DUPLICATE ACCOUNTS DETECTED! User has multiple account records.'
        : (accountUsers?.length || 0) > 1
        ? 'MULTIPLE ACCOUNT LINKS DETECTED! User is linked to multiple accounts.'
        : 'No duplicate issues detected.'
    });

  } catch (error: any) {
    console.error('Debug account check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}