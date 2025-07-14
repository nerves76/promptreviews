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
import { createServerSupabaseClient } from '@/utils/supabaseClient';
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
    // Create Supabase server client for API routes
    const supabase = await createServerSupabaseClient();

    // Try Bearer token authentication first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify the token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        return { user: null, supabase, error: 'Invalid token' };
      }
      
      if (!user) {
        return { user: null, supabase, error: 'User not found' };
      }
      
      return { user, supabase, error: null };
    }

    // Try session-based authentication (cookies)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { user: null, supabase, error: 'Session error' };
    }
    
    if (!session?.user) {
      return { user: null, supabase, error: 'No valid session' };
    }
    
    return { user: session.user, supabase, error: null };

  } catch (error) {
    console.error('API Auth: Unexpected error:', error);
    return { 
      user: null, 
      supabase: await createServerSupabaseClient(), 
      error: 'Authentication failed' 
    };
  }
} 