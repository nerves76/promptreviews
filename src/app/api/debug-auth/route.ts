import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Get all cookies for debugging
    const allCookies: Record<string, string> = {};
    for (const cookie of cookieStore.getAll()) {
      allCookies[cookie.name] = cookie.value.substring(0, 20) + '...'; // Truncate for security
    }

    // Try to create a server client with cookie mapping
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            // Map our custom cookie names to what Supabase SSR expects
            if (name === 'supabase-auth-token') {
              return cookieStore.get('supabase-auth-token')?.value || 
                     cookieStore.get('sb-access-token')?.value;
            }
            if (name === 'supabase-auth-token-refresh') {
              return cookieStore.get('supabase-auth-token-refresh')?.value || 
                     cookieStore.get('sb-refresh-token')?.value;
            }
            return cookieStore.get(name)?.value;
          },
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Try to get session
    let session = null;
    let sessionError = null;
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      session = currentSession;
      sessionError = error;
    } catch (error) {
      sessionError = error;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSession: !!session,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        sessionError: sessionError?.message || null,
        cookies: {
          'sb-access-token': !!cookieStore.get('sb-access-token'),
          'sb-refresh-token': !!cookieStore.get('sb-refresh-token'),
          'supabase-auth-token': !!cookieStore.get('supabase-auth-token'),
          'supabase-auth-token-refresh': !!cookieStore.get('supabase-auth-token-refresh'),
          'supabase-auth-token-expires-at': !!cookieStore.get('supabase-auth-token-expires-at'),
        },
        allCookieNames: Object.keys(allCookies),
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}