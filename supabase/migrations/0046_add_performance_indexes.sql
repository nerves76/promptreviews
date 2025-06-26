-- Add essential performance indexes for better query performance
-- This migration adds only the most critical indexes to avoid any function issues

-- Accounts table indexes (most critical)
CREATE INDEX IF NOT EXISTS idx_accounts_plan ON accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_trial_end ON accounts(trial_end);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);

-- Businesses table indexes
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON businesses(account_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

-- Prompt pages table indexes (most critical)
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_id ON prompt_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug ON prompt_pages(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_status ON prompt_pages(status);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_created_at ON prompt_pages(created_at);

-- Review submissions table indexes (most critical)
CREATE INDEX IF NOT EXISTS idx_review_submissions_prompt_page_id ON review_submissions(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_platform ON review_submissions(platform);
CREATE INDEX IF NOT EXISTS idx_review_submissions_created_at ON review_submissions(created_at);

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Analytics events table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_prompt_page_id ON analytics_events(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Composite indexes for most common query patterns
CREATE INDEX IF NOT EXISTS idx_accounts_plan_trial_end ON accounts(plan, trial_end);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_status ON prompt_pages(account_id, status);
CREATE INDEX IF NOT EXISTS idx_review_submissions_page_platform ON review_submissions(prompt_page_id, platform); 