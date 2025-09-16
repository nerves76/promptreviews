import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user?.email || null,
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