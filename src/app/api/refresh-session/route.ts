/**
 * API endpoint to refresh user session and force re-check of email confirmation
 * This helps resolve issues where the client cache doesn't reflect the updated email confirmation status
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
    }
    
    // Force refresh the session to get updated user data
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Error refreshing session:', refreshError);
      return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 });
    }
    
    // Get the updated user data
    const { data: { user: updatedUser }, error: updatedUserError } = await supabase.auth.getUser();
    
    if (updatedUserError) {
      console.error('Error getting user:', updatedUserError);
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        email_confirmed_at: updatedUser?.email_confirmed_at,
        created_at: updatedUser?.created_at
      },
      session: refreshedSession ? {
        access_token: refreshedSession.access_token ? 'present' : 'missing',
        refresh_token: refreshedSession.refresh_token ? 'present' : 'missing',
        expires_at: refreshedSession.expires_at
      } : null
    });
    
  } catch (error) {
    console.error('Unexpected error in refresh-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 