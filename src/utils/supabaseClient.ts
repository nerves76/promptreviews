/**
 * Supabase Client Singleton
 * 
 * This file exports a single, shared Supabase client instance for use in all client-side React components.
 * This prevents the "Multiple GoTrueClient instances" warning and ensures proper session persistence.
 * 
 * IMPORTANT: Only use this for client-side operations. For server-side operations, use createServerClient() from utils/supabase.ts.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Export the client as default for convenience
export default supabase; 