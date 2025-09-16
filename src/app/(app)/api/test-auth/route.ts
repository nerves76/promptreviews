import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Test endpoint to check authentication and debug user object
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            console.log(`[TEST-AUTH] Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set: () => {},
          remove: () => {},
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[TEST-AUTH] User result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userKeys: user ? Object.keys(user) : 'user is null',
      error: authError?.message
    });
    
    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: authError?.message || 'No user found' 
      });
    }

    return NextResponse.json({ 
      authenticated: true, 
      userId: user.id,
      email: user.email,
      userKeys: Object.keys(user)
    });

  } catch (error) {
    console.error('Error in test auth:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 