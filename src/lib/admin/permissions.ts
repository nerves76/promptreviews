/**
 * Admin permission utilities
 *
 * Checks if a user has admin privileges in the system.
 */

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Check if the current user is an admin
 * Uses service role to bypass RLS
 * Checks accounts table for is_admin flag
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('accounts')
    .select('is_admin')
    .eq('user_id', userId)
    .eq('is_admin', true)
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  return true;
}

/**
 * Get current user from session and check admin status
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  error?: string;
}> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {}, // No-op for API routes
        remove() {}, // No-op for API routes
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAdmin: false,
      userId: null,
      error: 'Unauthorized - No valid session',
    };
  }

  const isAdmin = await isUserAdmin(user.id);

  return {
    isAdmin,
    userId: user.id,
    error: isAdmin ? undefined : 'Forbidden - Admin access required',
  };
}

/**
 * Middleware function to verify admin access in API routes
 * Returns the user ID if authorized, throws error otherwise
 */
export async function requireAdminAccess(): Promise<string> {
  const { isAdmin, userId, error } = await checkAdminAccess();

  if (!isAdmin || !userId) {
    throw new Error(error || 'Unauthorized');
  }

  return userId;
}
