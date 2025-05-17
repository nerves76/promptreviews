import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';

const supabaseUrl = 'https://kkejemfchqaprtihvgon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZWplbWZjaHFhcHJ0aWh2Z29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDE3NzksImV4cCI6MjA2MjQ3Nzc3OX0.UF4FLT4-oki29MoYC0guelksm71IPYoXc-RvtcoxlPo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PromptPage = {
  id: string;
  created_at: string;
  slug: string;
  client_name: string;
  location: string;
  tone_of_voice: string;
  project_type: string;
  services_offered: string;
  outcomes: string;
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
  status: 'in_queue' | 'in_progress' | 'complete' | 'draft';
  first_name?: string;
  last_name?: string;
  role?: string;
};

export type ReviewSubmission = {
  id: string;
  prompt_page_id: string;
  platform: string;
  submitted_at: string;
  status: 'clicked' | 'submitted';
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  reviewer_name: string;
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
        Insert: Omit<PromptPage, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PromptPage, 'id'>>;
      };
      review_submissions: {
        Row: ReviewSubmission;
        Insert: Omit<ReviewSubmission, 'id' | 'submitted_at'>;
        Update: Partial<Omit<ReviewSubmission, 'id'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Contact, 'id'>>;
      };
    };
  };
}; 