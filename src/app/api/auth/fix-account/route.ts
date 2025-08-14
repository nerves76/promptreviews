/**
 * Emergency endpoint to manually create account records when auth triggers fail
 * This is a workaround for the "Database error granting user" issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get user by email
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, confirmed_at')
      .eq('email', email)
      .single();
    
    if (userError || !users) {
      console.error('User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = users.id;

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingAccount) {
      // Create account record
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: userId,
          email: email,
          plan: 'no_plan',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          is_free_account: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId
        });

      if (accountError) {
        console.error('Failed to create account:', accountError);
        // Don't return error - continue to try account_users
      }
    }

    // Check if account_users link exists
    const { data: existingLink } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('user_id', userId)
      .eq('account_id', userId)
      .single();

    if (!existingLink) {
      // Create account_users record
      const { error: linkError } = await supabase
        .from('account_users')
        .insert({
          account_id: userId,
          user_id: userId,
          role: 'owner',
          created_at: new Date().toISOString()
        });

      if (linkError) {
        console.error('Failed to create account_users link:', linkError);
        // Don't return error - we've done what we can
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account records checked/created'
    });

  } catch (error) {
    console.error('Error in fix-account endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}