/**
 * API Authentication Utility
 * 
 * Provides unified authentication for API routes with support for both
 * Bearer token and session-based authentication using modern Supabase client.
 * 
 * This utility standardizes authentication across all API endpoints and
 * provides consistent error handling and logging.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthResult {
  user: User | null;
  supabase: any; // Use any to avoid type conflicts between different Supabase client versions
  error: string | null;
}

/**
 * Authenticates an API request using either Bearer token or session cookies
 * 
 * @param request - The NextRequest object from the API route
 * @returns Promise<AuthResult> - Object containing user, supabase client, and any error
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try Bearer token authentication first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify the token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.log('API Auth: Bearer token invalid:', error.message);
        return { user: null, supabase, error: 'Invalid token' };
      }
      
      if (!user) {
        console.log('API Auth: No user found for Bearer token');
        return { user: null, supabase, error: 'User not found' };
      }
      
      console.log('API Auth: Bearer token authentication successful:', { userId: user.id, email: user.email });
      return { user, supabase, error: null };
    }

    // Try session-based authentication (cookies)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('API Auth: Session error:', sessionError.message);
      return { user: null, supabase, error: 'Session error' };
    }
    
    if (!session?.user) {
      console.log('API Auth: No valid session found');
      return { user: null, supabase, error: 'No valid session' };
    }
    
    console.log('API Auth: Session authentication successful:', { userId: session.user.id, email: session.user.email });
    return { user: session.user, supabase, error: null };

  } catch (error) {
    console.error('API Auth: Unexpected error:', error);
    return { 
      user: null, 
      supabase: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ), 
      error: 'Authentication failed' 
    };
  }
} 