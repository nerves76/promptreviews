import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

// Re-export the client for backward compatibility
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

export async function getUserOrMock(supabase: SupabaseClient) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Handle specific auth errors gracefully
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('JWT expired') ||
          error.message?.includes('Invalid Refresh Token')) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AUTH] Expected auth error: ${error.message}`);
        }
        return { data: { user: null }, error: null };
      }
      // For unexpected errors, preserve the error for debugging
      console.error('[AUTH] Unexpected user authentication error:', error);
      return { data: { user: null }, error: error };
    }
    return { data: { user }, error: null };
  } catch (error) {
    console.error('[AUTH] Exception getting user:', error);
    // Return the actual error for better debugging
    return { data: { user: null }, error: error as Error };
  }
}

export async function getSessionOrMock(supabase: SupabaseClient) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      // Handle specific auth errors gracefully
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('JWT expired') ||
          error.message?.includes('Invalid Refresh Token')) {
        return { data: { session: null }, error: null };
      }
      // For unexpected errors, preserve the error for debugging
      console.error('[AUTH] Unexpected session authentication error:', error);
      return { data: { session: null }, error: error };
    }
    return { data: { session }, error: null };
  } catch (error) {
    console.error('[AUTH] Exception getting session:', error);
    // Return the actual error for better debugging
    return { data: { session: null }, error: error as Error };
  }
}

/**
 * Create a Supabase client for server-side operations
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
