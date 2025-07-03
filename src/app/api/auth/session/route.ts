import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session API: Checking session status...');
    
    // Create server client with proper cookie handling
    const supabase = await createServerSupabaseClient();
    
    // Get the current user (more secure than getSession)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.log('❌ Session API: Error getting user:', error.message);
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: error.message
      });
    }

    if (!user) {
      console.log('ℹ️  Session API: No active session found');
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    console.log('✅ Session API: Valid session found');
    console.log(`👤 Session API: User ID: ${user.id}`);
    console.log(`📧 Session API: Email: ${user.email}`);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
      }
    });

  } catch (error) {
    console.log('💥 Session API: Unexpected error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 