/**
 * Force Sign-in API Route
 *
 * This route allows bypassing email confirmation for local development.
 * It uses the Supabase service role key to confirm the user and sign them in directly.
 *
 * IMPORTANT: This should only be used in local development (localhost/127.0.0.1).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize regular Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in local development' },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // 1. Find user by email using listUsers
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      email,
    });
    if (usersError) {
      return NextResponse.json({ error: 'Admin API error', details: usersError }, { status: 500 });
    }
    const user = usersData?.users?.find((u: any) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Confirm the user if not confirmed
    if (!user.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });
      if (confirmError) {
        return NextResponse.json({ error: 'Failed to confirm user', details: confirmError }, { status: 500 });
      }
    }

    // 3. Sign in the user with their credentials
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error', details: err }, { status: 500 });
  }
} 