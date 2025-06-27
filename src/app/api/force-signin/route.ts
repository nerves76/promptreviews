/**
 * API endpoint to force sign-in by bypassing email confirmation checks
 * This is a workaround for when email confirmations are disabled but the client still checks for them
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
    
    // First, try to get the user directly from the database
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // If email is not confirmed, manually confirm it
    if (!userData.email_confirmed_at) {
      const { error: updateError } = await supabase
        .from('auth.users')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('id', userData.id);
      
      if (updateError) {
        console.error('Error updating email confirmation:', updateError);
        return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 });
      }
    }
    
    // Now try to sign in with the password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('Sign in error after email confirmation:', signInError);
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at,
      },
      session: data.session ? {
        access_token: data.session.access_token ? 'present' : 'missing',
        refresh_token: data.session.refresh_token ? 'present' : 'missing',
        expires_at: data.session.expires_at
      } : null
    });
    
  } catch (error) {
    console.error('Unexpected error in force-signin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 