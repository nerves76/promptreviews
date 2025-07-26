import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Test endpoint to check authentication
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: authError?.message || 'No user found' 
      });
    }

    return NextResponse.json({ 
      authenticated: true, 
      userId: user.id,
      email: user.email 
    });

  } catch (error) {
    console.error('Error in test auth:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 