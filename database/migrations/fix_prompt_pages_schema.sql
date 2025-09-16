-- Fix prompt_pages table schema to include all required columns
-- This migration ensures all columns exist with correct types and defaults

-- Create prompt_page_status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE prompt_page_status AS ENUM ('draft', 'in_queue', 'in_progress', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to prompt_pages table
-- Each ALTER TABLE statement uses IF NOT EXISTS to be safe

-- Basic columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS account_id uuid NOT NULL;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS services_offered text[];
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS outcomes text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS date_completed date;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS assigned_team_members text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS review_platforms jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS is_universal boolean DEFAULT false;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS team_member uuid;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS email text;

-- Offer-related columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS offer_enabled boolean DEFAULT false;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS offer_title text DEFAULT 'Review Rewards';
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS offer_body text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS friendly_note text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS offer_url text;

-- Status and role
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS status prompt_page_status DEFAULT 'in_queue';
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS role text;

-- Feature columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS falling_icon text DEFAULT 'star';
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS review_type text DEFAULT 'review';
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS no_platform_review_template text;

-- Video-related columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_max_length integer;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_quality text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_preset text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_questions jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_note text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_tips text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS video_recipient text;

-- Emoji sentiment columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emoji_sentiment_enabled boolean DEFAULT false;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emoji_sentiment_question text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emoji_feedback_message text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emoji_thank_you_message text;

-- AI and product columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS ai_button_enabled boolean DEFAULT true;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS product_description text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS features_or_benefits jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS product_photo text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS product_subcopy text;

-- UI behavior columns
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS show_friendly_note boolean NOT NULL DEFAULT true;

-- Add primary key constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE prompt_pages ADD CONSTRAINT prompt_pages_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE prompt_pages ADD CONSTRAINT prompt_pages_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE prompt_pages ADD CONSTRAINT prompt_pages_team_member_fkey FOREIGN KEY (team_member) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add unique constraint on slug if it doesn't exist
DO $$ BEGIN
    ALTER TABLE prompt_pages ADD CONSTRAINT prompt_pages_slug_key UNIQUE (slug);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add index on account_id and is_universal for performance
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_universal ON prompt_pages(account_id, is_universal);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_status ON prompt_pages(account_id, status);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug ON prompt_pages(slug);

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'prompt_pages' 
ORDER BY ordinal_position; 