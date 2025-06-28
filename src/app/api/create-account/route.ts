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

    if (existingAccount) {
      return NextResponse.json({ 
        success: true, 
        account: existingAccount,
        message: 'Account already exists' 
      });
    }

    // Create new account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert([
        {
          id: user.id, // Use the user's UUID as the account ID
        }
      ])
      .select()
      .single();

    if (accountError) {
      console.error('Account creation error:', accountError);
      return NextResponse.json({ 
        error: 'Failed to create account',
        details: accountError 
      }, { status: 500 });
    }

    // Create account_users record
    const { error: accountUserError } = await supabase
      .from('account_users')
      .insert([
        {
          account_id: account.id,
          user_id: user.id,
          role: 'owner'
        }
      ]);

    if (accountUserError) {
      console.error('Account user creation error:', accountUserError);
      return NextResponse.json({ 
        error: 'Failed to create account user relationship',
        details: accountUserError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      account,
      message: 'Account created successfully' 
    });

  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
} 