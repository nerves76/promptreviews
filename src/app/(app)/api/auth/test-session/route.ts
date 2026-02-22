import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Validate JWT server-side with getUser() for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: userError?.message || 'No authenticated user'
      }, { status: 401 });
    }

    // Use getSession() only for diagnostic session metadata (expiry, token presence)
    const { data: { session } } = await supabase.auth.getSession();

    return NextResponse.json({
      authenticated: true,
      user: user.email,
      sessionExpiry: session?.expires_at || null,
      hasAccessToken: !!session?.access_token
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}