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

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Singleton pattern to prevent multiple client instances in development
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
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

  return supabaseInstance;
}

// Export the singleton instance
export const supabase = createSupabaseClient();

// Re-export for backward compatibility
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
 * Get user with error handling for missing auth sessions
 * @param supabase - Supabase client instance
 * @returns User data or null if no session
 */
export async function getUserOrMock(supabase: any) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Handle auth session missing error gracefully
      if (error.message?.includes('Auth session missing')) {
        console.log('No auth session found - user is not logged in');
        return { data: { user: null }, error: null };
      }
      throw error;
    }
    return { data: { user }, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    // For any other error, return null user without throwing
    return { data: { user: null }, error: null };
  }
}

/**
 * Get session with error handling for missing auth sessions
 * @param supabase - Supabase client instance
 * @returns Session data or null if no session
 */
export async function getSessionOrMock(supabase: any) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      // Handle auth session missing error gracefully
      if (error.message?.includes('Auth session missing')) {
        console.log('No auth session found - user is not logged in');
        return { data: { session: null }, error: null };
      }
      throw error;
    }
    return { data: { session }, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    // For any other error, return null session without throwing
    return { data: { session: null }, error: null };
  }
}

/**
 * Create a Supabase client for server-side operations
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
} 