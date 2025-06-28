/**
 * Supabase Client Singleton
 * 
 * This file re-exports the single, shared Supabase client instance from utils/supabase.ts
 * This prevents the "Multiple GoTrueClient instances" warning and ensures proper session persistence.
 * 
 * IMPORTANT: Only use this for client-side operations. For server-side operations, use createServerClient() from utils/supabase.ts.
 */

// Re-export the client from the main supabase.ts file to ensure a single instance
export { supabase } from './supabase';

// Export the client as default for convenience
export default supabase; 