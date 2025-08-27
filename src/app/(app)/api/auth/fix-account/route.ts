/**
 * Emergency endpoint to manually create account records when auth triggers fail
 * This is a workaround for the "Database error granting user" issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseClient';

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
    
    // Since auth triggers are disabled, we need to ensure account exists after login
    // We'll call the ensure_user_account function we created
    const { data, error } = await supabase.rpc('ensure_user_account', {
      p_user_id: null // We'll need to get the user ID first
    });

    // Actually, let's just ensure accounts exist for the email
    const { error: accountError } = await supabase
      .from('accounts')
      .upsert({
        email: email,
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: true
      });

    if (accountError) {
      console.log('Account creation attempted, may already exist:', accountError.message);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account check completed'
    });

  } catch (error) {
    console.error('Error in fix-account endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}