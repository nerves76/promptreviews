-- Fix all missing columns to match RLS_POLICIES.md
-- This script ensures every column mentioned in RLS_POLICIES.md exists in the database

-- ACCOUNTS TABLE
-- Add any missing columns to accounts table
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'NULL',
  ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS custom_prompt_page_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS is_free_account boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_had_paid_plan boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS plan_lookup_key text,
  ADD COLUMN IF NOT EXISTS review_notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- BUSINESSES TABLE
-- Add any missing columns to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS taglines text,
  ADD COLUMN IF NOT EXISTS team_info text,
  ADD COLUMN IF NOT EXISTS review_platforms jsonb,
  ADD COLUMN IF NOT EXISTS platform_word_counts text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS keywords text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS bluesky_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS pinterest_url text,
  ADD COLUMN IF NOT EXISTS primary_font text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS secondary_font text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#818CF8',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#1F2937',
  ADD COLUMN IF NOT EXISTS account_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS background_type text DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS gradient_start text DEFAULT '#4F46E5',
  ADD COLUMN IF NOT EXISTS gradient_end text DEFAULT '#C7D2FE',
  ADD COLUMN IF NOT EXISTS default_offer_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_offer_title text DEFAULT 'Review Rewards',
  ADD COLUMN IF NOT EXISTS default_offer_body text,
  ADD COLUMN IF NOT EXISTS business_website text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS address_country text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#4F46E5',
  ADD COLUMN IF NOT EXISTS signup_email text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS default_offer_url text,
  ADD COLUMN IF NOT EXISTS industries_other text,
  ADD COLUMN IF NOT EXISTS industry text[],
  ADD COLUMN IF NOT EXISTS services_offered text,
  ADD COLUMN IF NOT EXISTS company_values text,
  ADD COLUMN IF NOT EXISTS differentiators text,
  ADD COLUMN IF NOT EXISTS years_in_business text,
  ADD COLUMN IF NOT EXISTS industries_served text,
  ADD COLUMN IF NOT EXISTS offer_learn_more_url text,
  ADD COLUMN IF NOT EXISTS ai_dos text,
  ADD COLUMN IF NOT EXISTS ai_donts text,
  ADD COLUMN IF NOT EXISTS card_bg text,
  ADD COLUMN IF NOT EXISTS card_text text,
  ADD COLUMN IF NOT EXISTS background_color text;

-- CONTACTS TABLE
-- Add any missing columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS update_token text,
  ADD COLUMN IF NOT EXISTS last_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS category text;

-- PROMPT_PAGES TABLE
-- Add any missing columns to prompt_pages table
ALTER TABLE public.prompt_pages
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS services_offered text[],
  ADD COLUMN IF NOT EXISTS outcomes text,
  ADD COLUMN IF NOT EXISTS date_completed date,
  ADD COLUMN IF NOT EXISTS assigned_team_members text,
  ADD COLUMN IF NOT EXISTS review_platforms jsonb,
  ADD COLUMN IF NOT EXISTS qr_code_url text,
  ADD COLUMN IF NOT EXISTS is_universal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_member uuid,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS offer_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_title text DEFAULT 'Review Rewards',
  ADD COLUMN IF NOT EXISTS offer_body text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS friendly_note text,
  ADD COLUMN IF NOT EXISTS offer_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_queue',
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS falling_icon text DEFAULT 'star',
  ADD COLUMN IF NOT EXISTS review_type text DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS no_platform_review_template text,
  ADD COLUMN IF NOT EXISTS video_max_length integer,
  ADD COLUMN IF NOT EXISTS video_quality text,
  ADD COLUMN IF NOT EXISTS video_preset text,
  ADD COLUMN IF NOT EXISTS video_questions jsonb,
  ADD COLUMN IF NOT EXISTS video_note text,
  ADD COLUMN IF NOT EXISTS video_tips text,
  ADD COLUMN IF NOT EXISTS video_recipient text,
  ADD COLUMN IF NOT EXISTS emoji_sentiment_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS emoji_sentiment_question text,
  ADD COLUMN IF NOT EXISTS emoji_feedback_message text,
  ADD COLUMN IF NOT EXISTS emoji_thank_you_message text,
  ADD COLUMN IF NOT EXISTS ai_button_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_description text,
  ADD COLUMN IF NOT EXISTS features_or_benefits jsonb,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_photo text,
  ADD COLUMN IF NOT EXISTS product_subcopy text,
  ADD COLUMN IF NOT EXISTS show_friendly_note boolean NOT NULL DEFAULT true;

-- REVIEW_SUBMISSIONS TABLE
-- Add any missing columns to review_submissions table
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS reviewer_role text,
  ADD COLUMN IF NOT EXISTS review_content text,
  ADD COLUMN IF NOT EXISTS review_group_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS emoji_sentiment_selection character varying(32),
  ADD COLUMN IF NOT EXISTS first_name character varying(100),
  ADD COLUMN IF NOT EXISTS last_name character varying(100),
  ADD COLUMN IF NOT EXISTS email character varying(255),
  ADD COLUMN IF NOT EXISTS phone character varying(50),
  ADD COLUMN IF NOT EXISTS prompt_page_type text,
  ADD COLUMN IF NOT EXISTS review_type text,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS platform_url text,
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- WIDGET_REVIEWS TABLE
-- Add any missing columns to widget_reviews table
ALTER TABLE public.widget_reviews
  ADD COLUMN IF NOT EXISTS review_id uuid,
  ADD COLUMN IF NOT EXISTS reviewer_role text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS order_index integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_name character varying NOT NULL,
  ADD COLUMN IF NOT EXISTS last_name character varying NOT NULL,
  ADD COLUMN IF NOT EXISTS star_rating numeric,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- WIDGETS TABLE
-- Add any missing columns to widgets table
ALTER TABLE public.widgets
  ADD COLUMN IF NOT EXISTS theme jsonb,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS widget_type text DEFAULT 'multi';

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for businesses.account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_businesses_account_id' 
        AND table_name = 'businesses'
    ) THEN
        ALTER TABLE public.businesses 
        ADD CONSTRAINT fk_businesses_account_id 
        FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON public.businesses(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON public.contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_id ON public.prompt_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_widgets_account_id ON public.widgets(account_id);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_id ON public.widget_reviews(widget_id);

-- Update any existing businesses to have account_id if missing
UPDATE public.businesses 
SET account_id = id 
WHERE account_id IS NULL;

-- Make account_id NOT NULL for businesses
ALTER TABLE public.businesses 
ALTER COLUMN account_id SET NOT NULL;

-- Verify all tables have the expected columns
SELECT 'accounts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'businesses' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'contacts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'prompt_pages' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prompt_pages' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'review_submissions' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'review_submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'widget_reviews' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'widget_reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'widgets' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'widgets' AND table_schema = 'public'
ORDER BY ordinal_position; 