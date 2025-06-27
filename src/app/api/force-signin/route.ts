/**
 * API endpoint to force sign-in by confirming email in database
 * This bypasses email confirmation checks when confirmations are disabled
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First, try to sign in normally
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!signInError && data.user) {
      // Success! Return the session
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: data.session ? {
          access_token: data.session.access_token ? 'present' : 'missing',
          refresh_token: data.session.refresh_token ? 'present' : 'missing',
          expires_at: data.session.expires_at
        } : null
      });
    }
    
    // If we get an email confirmation error, try to fix it
    if (signInError && signInError.message.includes("Email not confirmed")) {
      console.log('Email confirmation error detected, attempting to fix...');
      
      // Try to manually confirm the email using admin privileges
      const { error: updateError } = await supabase
        .from('auth.users')
        .update({ 
          email_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email);
      
      if (updateError) {
        console.error('Error updating email confirmation:', updateError);
        return NextResponse.json({ 
          error: 'Failed to confirm email. Please contact support.' 
        }, { status: 500 });
      }
      
      // Now try to sign in again
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (retryError) {
        console.error('Sign in error after email confirmation:', retryError);
        return NextResponse.json({ error: retryError.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: retryData.user?.id,
          email: retryData.user?.email,
          email_confirmed_at: retryData.user?.email_confirmed_at,
        },
        session: retryData.session ? {
          access_token: retryData.session.access_token ? 'present' : 'missing',
          refresh_token: retryData.session.refresh_token ? 'present' : 'missing',
          expires_at: retryData.session.expires_at
        } : null
      });
    }
    
    // If it's not an email confirmation error, return the original error
    return NextResponse.json({ error: signInError.message }, { status: 400 });
    
  } catch (error) {
    console.error('Unexpected error in force-signin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 