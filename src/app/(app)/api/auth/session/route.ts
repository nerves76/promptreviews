import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    
    // Create server client with proper cookie handling (Next.js 15 async compatible)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const value = cookieStore.get(name)?.value;
            return value;
          },
          set: () => {}, // No-op for API route
          remove: () => {}, // No-op for API route
        },
      }
    );
    
    // Get the current user (more secure than getSession)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: error.message
      });
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: 'No user found'
      });
    }

    

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      error: null
    });

  } catch (error) {
    console.error('❌ Session API: Unexpected error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 