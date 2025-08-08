/**
 * Supabase Client Configuration - SSR Compatible
 * 
 * This file provides both server-side and client-side Supabase clients
 * with proper cookie handling for Next.js SSR applications.
 * 
 * Key features:
 * - Server-side client for API routes with cookie handling
 * - Client-side client that can read server-side cookies
 * - Shared cookie format between client and server
 * - Proper session synchronization
 * - Enhanced singleton pattern with debugging
 */

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { SupabaseClient, User } from '@supabase/supabase-js'

// Enhanced singleton tracking
let _browserClient: SupabaseClient | null = null;
let _instanceCount = 0;
let _creationStack: string[] = [];

// Only enable debug logging in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Minimal debug logging for client creation (performance optimized)
 */
function logClientCreation(instanceId: number, creationLocation: string) {
  if (!isDevelopment) return;
  
  _instanceCount++;
  
  // Only log on truly problematic multiple instances (not hot reloads)
  if (_instanceCount > 3) {
    console.warn(`⚠️  Multiple Supabase clients: ${_instanceCount} instances`);
  }
}

/**
 * Create a browser client for client-side usage
 * This client can read server-side cookies and maintain session state
 * 
 * SINGLETON PATTERN: Only one instance should exist per application
 */
export function createClient(): SupabaseClient {
  if (!_browserClient) {
    const instanceId = Math.floor(Math.random() * 1000);
    
    logClientCreation(instanceId, 'createClient');
    
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        cookieOptions: {
          name: 'supabase-auth-token',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: process.env.NODE_ENV === 'production' ? 'app.promptreviews.app' : undefined,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    );
    
    if (isDevelopment && _instanceCount === 1) {
      console.log('✅ Supabase browser client created successfully');
    }
  }
  
  return _browserClient;
}

/**
 * Create a server client for API routes and middleware
 * This handles cookies properly for SSR with Next.js 15 async cookies API
 */
export async function createServerSupabaseClient() {
  // Import cookies dynamically to avoid client-side import issues
  const { cookies } = require('next/headers');
  
  // Await the cookies() call for Next.js 15 compatibility
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          return cookieStore.get(name)?.value;
        },
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );
}

/**
 * Get client instance statistics for debugging
 */
export function getClientStats() {
  return {
    hasInstance: !!_browserClient,
    instanceCount: _instanceCount,
    creationStack: _creationStack
  };
}

/**
 * Reset client instance (for testing/debugging only)
 */
export function resetClientInstance() {
  console.log('🔄 Resetting Supabase client instance');
  _browserClient = null;
  _instanceCount = 0;
  _creationStack = [];
}

/**
 * Legacy exports for backward compatibility
 * 
 * DEPRECATED: Use createClient() instead
 * This will be removed in a future version
 */
export const supabase = createClient();

/**
 * Clear authentication session
 * This removes all authentication cookies and resets the client state
 */
export async function clearAuthSession() {
  const client = createClient();
  await client.auth.signOut();
  
  // Clear any manual cookies that might exist
  if (typeof document !== 'undefined') {
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
  }
  
  // Reset the singleton instance
  _browserClient = null;
}

/**
 * Get current user from session
 * This is a convenience function for client-side components
 */
export async function getCurrentUser(): Promise<User | null> {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

/**
 * Utility function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();
  return !!session;
}

/**
 * Create a service role client for admin operations that bypass RLS
 * This should only be used in server-side API routes for admin operations
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for service role operations');
  }
  
  if (isDevelopment) {
    console.log('🔑 Creating Supabase service role client (bypasses RLS)');
  }
  
  const { createClient } = require('@supabase/supabase-js');
  
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
 * Enhanced session getter with better error handling
 */
export async function getSessionOrMock(client: SupabaseClient) {
  try {
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('❌ Session error:', error);
      throw error;
    }
    
    return { data: { session }, error: null };
  } catch (error) {
    console.error('💥 Session check failed:', error);
    return { data: { session: null }, error };
  }
}

// Simplified session handling - no caching needed

/**
 * Enhanced user getter with simplified session handling
 */
export async function getUserOrMock(client: SupabaseClient) {
  try {
    // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const devBypass = localStorage.getItem('dev_auth_bypass');
      if (devBypass === 'true') {
        console.log('🔧 DEV MODE: getUserOrMock using authentication bypass');
        const mockUser = {
          id: '12345678-1234-5678-9abc-123456789012',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'Dev',
            last_name: 'User'
          },
          email_confirmed_at: new Date().toISOString()
        };
        return { data: { user: mockUser }, error: null };
      }
    }
    
    // Simple session check without timeout race conditions
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('❌ Session error:', error);
      return { data: { user: null }, error };
    }
    
    // Extract user from session
    const user = session?.user || null;
    
    return { data: { user }, error: null };
  } catch (error) {
    console.error('💥 User check failed:', error);
    
    // Fallback: try direct getUser
    try {
      const { data: { user }, error: directError } = await client.auth.getUser();
      
      if (!directError && user) {
        return { data: { user }, error: null };
      }
    } catch (fallbackError) {
      // Silent fallback failure
    }
    
    // Final fallback: return null user but don't throw
    return { data: { user: null }, error: error instanceof Error ? error : new Error('Session error') };
  }
}

/**
 * Test authentication function
 */
export async function testAuth(email: string, password: string) {
  console.log('🧪 Testing authentication...');
  
  try {
    const client = createClient();
    
    // Clear any existing session first
    await client.auth.signOut();
    clearAuthSession();
    
    // Attempt sign in
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Auth test failed:', error);
      return { success: false, error: error.message };
    }
    
    if (data.user && data.session) {
      console.log('✅ Auth test successful!', {
        userId: data.user.id,
        hasSession: !!data.session
      });
      return { success: true, user: data.user, session: data.session };
    }
    
    console.error('❌ Auth test failed: No user or session returned');
    return { success: false, error: 'No user or session returned' };
    
  } catch (error) {
    console.error('💥 Auth test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default supabase;

/**
 * PromptPage type
 *
 * The 'type' field uses the following enum values:
 * 'universal', 'product', 'service', 'photo', 'event', 'video', 'employee'
 */
export type PromptPage = {
  id: string;
  created_at: string;
  slug: string;
  client_name: string;
  location: string;
  tone_of_voice: string;
  project_type: string;
  features_or_benefits: string;
  product_description: string;
  date_completed: string;
  team_member: string | null;
  review_platforms: {
    platform: string;
    url: string;
  }[];
  offer_enabled?: boolean;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  account_id: string;
  status: "in_queue" | "in_progress" | "complete" | "draft";
  first_name?: string;
  last_name?: string;
  role?: string;
  show_friendly_note?: boolean;
  friendly_note?: string;
  type?: 'universal' | 'product' | 'service' | 'photo' | 'event' | 'video' | 'employee';
};

export type ReviewSubmission = {
  id: string;
  prompt_page_id: string;
  platform: string;
  submitted_at: string;
  status: "clicked" | "submitted";
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  reviewer_role: string | null;
  review_content: string | null;
  review_group_id: string;
};

export type Contact = {
  id: string;
  account_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  notes: string | null;
  google_url: string | null;
  yelp_url: string | null;
  facebook_url: string | null;
  google_review: string | null;
  yelp_review: string | null;
  facebook_review: string | null;
  google_instructions: string | null;
  yelp_instructions: string | null;
  facebook_instructions: string | null;
  review_rewards: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  role: string | null;
};

export type Database = {
  public: {
    Tables: {
      prompt_pages: {
        Row: PromptPage;
        Insert: Omit<PromptPage, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PromptPage, "id">>;
      };
      review_submissions: {
        Row: ReviewSubmission;
        Insert: Omit<ReviewSubmission, "id" | "submitted_at">;
        Update: Partial<Omit<ReviewSubmission, "id">>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Contact, "id">>;
      };
    };
  };
}; 