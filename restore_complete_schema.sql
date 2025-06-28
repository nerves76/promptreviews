-- Complete Database Schema Restoration for PromptReviews
-- Based on schema from June 16th, 2025
-- This script will create all missing tables and restore the complete schema

-- =====================================================
-- 1. CREATE ACCOUNT_USERS TABLE (CRITICAL FOR LOGINS)
-- =====================================================

CREATE TABLE IF NOT EXISTS account_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for account_users
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_account_user ON account_users(account_id, user_id);

-- Enable RLS on account_users
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE ACCOUNTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY,
    business_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan TEXT DEFAULT 'NULL',
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    custom_prompt_page_count INTEGER NOT NULL DEFAULT 0,
    contact_count INTEGER NOT NULL DEFAULT 0,
    first_name TEXT,
    last_name TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    is_free_account BOOLEAN DEFAULT false,
    has_had_paid_plan BOOLEAN NOT NULL DEFAULT false,
    email TEXT,
    plan_lookup_key TEXT,
    review_notifications_enabled BOOLEAN DEFAULT true,
    user_id UUID
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan ON accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_trial_end ON accounts(trial_end);

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE BUSINESSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    taglines TEXT,
    team_info TEXT,
    review_platforms JSONB,
    platform_word_counts TEXT,
    logo_url TEXT,
    keywords TEXT,
    tagline TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    bluesky_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    linkedin_url TEXT,
    pinterest_url TEXT,
    primary_font TEXT DEFAULT 'Inter',
    secondary_font TEXT DEFAULT 'Inter',
    secondary_color TEXT DEFAULT '#818CF8',
    text_color TEXT DEFAULT '#1F2937',
    account_id UUID NOT NULL,
    background_type TEXT DEFAULT 'gradient',
    gradient_start TEXT DEFAULT '#4F46E5',
    gradient_end TEXT DEFAULT '#C7D2FE',
    default_offer_enabled BOOLEAN DEFAULT false,
    default_offer_title TEXT DEFAULT 'Review Rewards',
    default_offer_body TEXT,
    business_website TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    phone TEXT,
    primary_color TEXT DEFAULT '#4F46E5',
    signup_email TEXT,
    business_email TEXT,
    default_offer_url TEXT,
    industries_other TEXT,
    industry TEXT[],
    services_offered TEXT,
    company_values TEXT,
    differentiators TEXT,
    years_in_business TEXT,
    industries_served TEXT,
    offer_learn_more_url TEXT,
    ai_dos TEXT,
    ai_donts TEXT,
    card_bg TEXT,
    card_text TEXT,
    background_color TEXT
);

-- Create indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON businesses(account_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

-- Enable RLS on businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE CONTACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);

-- Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE WIDGETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    slug TEXT UNIQUE
);

-- Create indexes for widgets
CREATE INDEX IF NOT EXISTS idx_widgets_account_id ON widgets(account_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON widgets(type);
CREATE INDEX IF NOT EXISTS idx_widgets_slug ON widgets(slug);

-- Enable RLS on widgets
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE WIDGET_REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS widget_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    review_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for widget_reviews
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_id ON widget_reviews(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_review_id ON widget_reviews(review_id);

-- Enable RLS on widget_reviews
ALTER TABLE widget_reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE PROMPT_PAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS prompt_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0
);

-- Create indexes for prompt_pages
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_id ON prompt_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug ON prompt_pages(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_status ON prompt_pages(status);

-- Enable RLS on prompt_pages
ALTER TABLE prompt_pages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE QUOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    button_text TEXT,
    button_url TEXT
);

-- Create indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_is_active ON quotes(is_active);

-- Enable RLS on quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE ADMINS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id)
);

-- Create index for admins
CREATE INDEX IF NOT EXISTS idx_admins_account_id ON admins(account_id);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. CREATE OTHER TABLES
-- =====================================================

-- AI Usage table
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_page_id UUID,
    event_type TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}',
    session_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    emoji_sentiment TEXT
);

-- =====================================================
-- 11. ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints
ALTER TABLE account_users ADD CONSTRAINT fk_account_users_account_id 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE account_users ADD CONSTRAINT fk_account_users_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE businesses ADD CONSTRAINT fk_businesses_account_id 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_account_id 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE widgets ADD CONSTRAINT fk_widgets_account_id 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE prompt_pages ADD CONSTRAINT fk_prompt_pages_account_id 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- =====================================================
-- 12. CREATE BASIC RLS POLICIES
-- =====================================================

-- Account Users policies
CREATE POLICY "Users can view their own account associations" ON account_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own account associations" ON account_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Accounts policies
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Businesses policies
CREATE POLICY "Users can view their account's businesses" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = businesses.account_id
            AND au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert businesses for their accounts" ON businesses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = businesses.account_id
            AND au.user_id = auth.uid()
        )
    );

-- Widgets policies
CREATE POLICY "Users can view their account's widgets" ON widgets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = widgets.account_id
            AND au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert widgets for their accounts" ON widgets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = widgets.account_id
            AND au.user_id = auth.uid()
        )
    );

-- Widget Reviews policies
CREATE POLICY "Users can associate reviews with their widgets" ON widget_reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM widgets w
            JOIN account_users au ON w.account_id = au.account_id
            WHERE w.id = widget_reviews.widget_id
            AND au.user_id = auth.uid()
        )
    );

-- Prompt Pages policies
CREATE POLICY "Users can view their account's prompt pages" ON prompt_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = prompt_pages.account_id
            AND au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert prompt pages for their accounts" ON prompt_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = prompt_pages.account_id
            AND au.user_id = auth.uid()
        )
    );

-- =====================================================
-- 13. VERIFICATION QUERY
-- =====================================================

-- Check that all tables were created successfully
SELECT 
    'Schema restoration completed. Tables found:' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'account_users', 'accounts', 'businesses', 'contacts', 
        'widgets', 'widget_reviews', 'prompt_pages', 'quotes', 
        'admins', 'ai_usage', 'analytics_events'
    ); 