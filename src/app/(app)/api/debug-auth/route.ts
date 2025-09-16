/**
 * Debug Auth Route
 * Simple route to test if authentication is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    
    // Get all cookies for debugging
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    const requestCookieHeader = request.headers.get('cookie');
    

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Try to get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasSession: !!session,
      sessionId: session?.access_token?.substring(0, 20) + '...',
      authError: authError?.message,
      sessionError: sessionError?.message,
      cookieCount: allCookies.length,
      supabaseCookieCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      requestHeaders: {
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        hasCookieHeader: !!request.headers.get('cookie')
      }
    };


    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('🐛 Debug auth error:', error);
    return NextResponse.json({
      error: 'Debug auth failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}