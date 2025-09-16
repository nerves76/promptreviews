import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cookies: {},
    authHeader: null,
    serverAuth: null,
    serviceAuth: null,
    errors: []
  };

  try {
    // Check cookies
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll().filter(c => 
      c.name.includes('supabase') || c.name.includes('auth')
    );
    results.cookies = authCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      length: c.value?.length || 0
    }));

    // Check auth header
    const authHeader = request.headers.get('Authorization');
    results.authHeader = authHeader ? 'Bearer token present' : null;

    // Try server-side auth
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      results.serverAuth = {
        hasUser: !!user,
        userId: user?.id || null,
        error: error?.message || null
      };
    } catch (e: any) {
      results.errors.push(`Server auth error: ${e.message}`);
    }

    // Try service role auth with bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const supabaseAdmin = createServiceRoleClient();
        const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
        results.serviceAuth = {
          hasUser: !!userData.user,
          userId: userData.user?.id || null,
          error: error?.message || null
        };
      } catch (e: any) {
        results.errors.push(`Service auth error: ${e.message}`);
      }
    }

  } catch (error: any) {
    results.errors.push(`General error: ${error.message}`);
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}