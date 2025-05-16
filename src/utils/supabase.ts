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
  custom_incentive: string | null;
  offer_enabled?: boolean;
  offer_title?: string;
  offer_body?: string;
  account_id: string;
  status: 'draft' | 'published';
};

export type ReviewSubmission = {
  id: string;
  prompt_page_id: string;
  platform: string;
  submitted_at: string;
  status: 'clicked' | 'submitted';
  user_agent: string;
  ip_address: string;
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
    };
  };
}; 