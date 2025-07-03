import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Sign-in API: Starting authentication process...');
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
      console.log('❌ Sign-in API: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sign-in API: Attempting authentication for: ${email}`);
    
    // Create server client with proper cookie handling (now async)
    const supabase = await createServerSupabaseClient();
    
    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('❌ Sign-in API: Authentication failed:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      console.log('❌ Sign-in API: No user or session returned');
      return NextResponse.json(
        { error: 'Authentication failed - no session created' },
        { status: 401 }
      );
    }

    console.log('✅ Sign-in API: Authentication successful');
    console.log(`👤 Sign-in API: User ID: ${data.user.id}`);
    console.log(`🔑 Sign-in API: Session expires: ${data.session.expires_at}`);

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });

  } catch (error) {
    console.log('💥 Sign-in API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 