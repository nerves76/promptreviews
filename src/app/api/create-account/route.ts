/**
 * Create Account API Route
 * 
 * This endpoint creates accounts and account_users records for new users
 * using the service role key to bypass RLS restrictions.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'User data required' }, { status: 400 });
    }

    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingAccount) {
      // Create account with only fields that exist in the schema
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: user.id,
          plan: 'grower',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0
        });

      if (accountError) {
        console.error('Account creation error:', accountError);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
      }
    }

    // Ensure account_users relationship exists
    const { error: accountUserError } = await supabase
      .from('account_users')
      .upsert({
        user_id: user.id,
        account_id: user.id,
        role: 'owner'
      }, {
        onConflict: 'user_id,account_id'
      });

    if (accountUserError) {
      console.error('Account user creation error:', accountUserError);
      return NextResponse.json({ error: 'Failed to create account user relationship' }, { status: 500 });
    }

    return NextResponse.json({ success: true, accountId: user.id });

  } catch (error) {
    console.error('Create account API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 