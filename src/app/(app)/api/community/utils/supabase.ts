/**
 * Community API - Supabase Client Helper
 *
 * Provides authenticated Supabase client for community API routes
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create a service role Supabase client for API operations
 * Uses service role key to bypass RLS for admin operations
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Create an authenticated Supabase client from request token
 * Uses the user's auth token to enforce RLS policies
 */
export function createAuthenticatedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}
