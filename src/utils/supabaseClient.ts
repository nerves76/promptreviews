/**
 * Supabase Client Configuration
 * 
 * Centralized Supabase client instance with optimized session handling
 * to prevent multiple GoTrueClient instances and session conflicts.
 * 
 * This file contains:
 * - Primary Supabase client instance with optimized auth configuration
 * - Type definitions for database entities
 * - Utility functions for user and session management
 * - Server-side client creation function
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

interface SessionMock {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// Global singleton instance
let _supabaseInstance: SupabaseClient | null = null;
let _instanceCounter = 0;
let _creationStack = new Map<number, string>();

// Create a true singleton Supabase client
export const supabase = (() => {
  if (!_supabaseInstance) {
    const instanceId = _instanceCounter++;
    const stack = new Error().stack || 'No stack trace available';
    _creationStack.set(instanceId, stack);
    
    console.log(`🔧 Creating new Supabase client instance #${instanceId}`);
    
    // Show calling location in development
    if (process.env.NODE_ENV === 'development') {
      const callerLine = stack.split('\n')[2];
      console.log(`📍 Creation location:`, callerLine?.trim() || 'Unknown');
      
      // Warn if we see multiple instances
      if (instanceId > 0) {
        console.warn(`⚠️  WARNING: Multiple Supabase client instances detected!`);
        console.warn(`⚠️  Previous instances: ${Array.from(_creationStack.keys()).slice(0, -1).join(', ')}`);
        console.warn(`⚠️  This can cause session conflicts. Use singleton from supabaseClient.ts`);
      }
    }
    
    _supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Enhanced persistence configuration
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'promptreviews-auth-token'
        },
        global: {
          headers: {
            'X-Client-Info': `promptreviews-web-singleton-${instanceId}`
          }
        }
      }
    );

    console.log(`✅ Supabase client created successfully`);
  } else {
    console.log(`♻️  Reusing existing Supabase client instance #${_instanceCounter - 1}`);
  }
  
  return _supabaseInstance;
})();

// Debug function to show all client creation locations
export function debugClientInstances() {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Total Supabase instances created: ${_instanceCounter}`);
    _creationStack.forEach((stack, id) => {
      console.log(`Instance #${id}:`, stack.split('\n')[2]?.trim());
    });
  }
}

// Enhanced session getter with better error handling
export async function getSessionOrMock(client: SupabaseClient) {
  try {
    console.log('🔍 Getting session...');
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('❌ Session error:', error);
      throw error;
    }
    
    if (session) {
      console.log('✅ Active session found:', { 
        userId: session.user.id, 
        expiresAt: new Date(session.expires_at! * 1000).toISOString() 
      });
    } else {
      console.log('ℹ️  No active session');
    }
    
    return { data: { session }, error: null };
  } catch (error) {
    console.error('💥 Session check failed:', error);
    return { data: { session: null }, error };
  }
}

// Enhanced user getter
export async function getUserOrMock(client: SupabaseClient) {
  try {
    console.log('👤 Getting user...');
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) {
      console.error('❌ User error:', error);
      throw error;
    }
    
    if (user) {
      console.log('✅ User found:', user.id);
    } else {
      console.log('ℹ️  No user found');
    }
    
    return { data: { user }, error: null };
  } catch (error) {
    console.error('💥 User check failed:', error);
    return { data: { user: null }, error };
  }
}

// Session cleanup utility
export function clearAuthSession() {
  console.log('🧹 Clearing auth session...');
  
  if (typeof window !== 'undefined') {
    // Clear all possible auth storage locations
    const storageKeys = [
      'promptreviews-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Auth storage cleared');
  }
}

// Test authentication function
export async function testAuth(email: string, password: string) {
  console.log('🧪 Testing authentication...');
  
  try {
    // Clear any existing session first
    await supabase.auth.signOut();
    clearAuthSession();
    
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
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

/**
 * Create a Supabase client for server-side operations
 */
export function createServerClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
} 