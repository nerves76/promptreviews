-- Add performance indexes for better query performance
-- This migration adds indexes for frequently queried columns

-- Accounts table indexes
CREATE INDEX IF NOT EXISTS idx_accounts_plan ON accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_trial_end ON accounts(trial_end);
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_status ON accounts(subscription_status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);

-- Businesses table indexes
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON businesses(account_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

-- Prompt pages table indexes
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_id ON prompt_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug ON prompt_pages(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_status ON prompt_pages(status);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_created_at ON prompt_pages(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_category ON prompt_pages(category);

-- Review submissions table indexes
CREATE INDEX IF NOT EXISTS idx_review_submissions_prompt_page_id ON review_submissions(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_platform ON review_submissions(platform);
CREATE INDEX IF NOT EXISTS idx_review_submissions_status ON review_submissions(status);
CREATE INDEX IF NOT EXISTS idx_review_submissions_created_at ON review_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_review_submissions_verified ON review_submissions(verified);

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Analytics events table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_prompt_page_id ON analytics_events(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON analytics_events(platform);

-- Widgets table indexes
CREATE INDEX IF NOT EXISTS idx_widgets_account_id ON widgets(account_id);
CREATE INDEX IF NOT EXISTS idx_widgets_widget_type ON widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widgets_created_at ON widgets(created_at);

-- Trial reminder logs table indexes
CREATE INDEX IF NOT EXISTS idx_trial_reminder_logs_account_id ON trial_reminder_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_trial_reminder_logs_reminder_type ON trial_reminder_logs(reminder_type);
CREATE INDEX IF NOT EXISTS idx_trial_reminder_logs_sent_at ON trial_reminder_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_trial_reminder_logs_success ON trial_reminder_logs(success);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_accounts_plan_trial_end ON accounts(plan, trial_end);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_status ON prompt_pages(account_id, status);
CREATE INDEX IF NOT EXISTS idx_review_submissions_page_platform ON review_submissions(prompt_page_id, platform);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_type ON analytics_events(prompt_page_id, event_type);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_active_trials ON accounts(trial_end) WHERE plan = 'free' AND trial_end > NOW();
CREATE INDEX IF NOT EXISTS idx_review_submissions_verified_only ON review_submissions(prompt_page_id) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_analytics_events_recent ON analytics_events(created_at) WHERE created_at > NOW() - INTERVAL '30 days'; 