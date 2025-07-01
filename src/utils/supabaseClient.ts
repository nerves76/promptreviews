/**
 * Supabase Client Configuration
 * 
 * Centralized Supabase client instance with optimized session handling
 * to prevent multiple GoTrueClient instances and session conflicts.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single Supabase client instance with optimized auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'promptreviews-auth-token', // Unique storage key to prevent conflicts
    flowType: 'pkce', // Use PKCE flow for better security
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'X-Client-Info': 'promptreviews-web',
    },
  },
});

// Re-export for backward compatibility
export default supabase; 