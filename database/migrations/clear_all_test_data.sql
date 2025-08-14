-- Clear All Test Data from PromptReviews Database
-- This script will remove all test data while preserving table structure
-- Run this script to start fresh with a clean database

-- Disable RLS temporarily to allow data deletion
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_reminder_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Clear all data from tables in dependency order (child tables first)
-- Start with tables that reference other tables
DELETE FROM public.widget_reviews;
DELETE FROM public.review_submissions;
DELETE FROM public.analytics_events;
DELETE FROM public.ai_usage;
DELETE FROM public.feedback;
DELETE FROM public.quotes;
DELETE FROM public.announcements;
DELETE FROM public.email_templates;
DELETE FROM public.trial_reminder_logs;
DELETE FROM public.prompt_pages;
DELETE FROM public.contacts;
DELETE FROM public.widgets;
DELETE FROM public.businesses;
DELETE FROM public.account_users;
DELETE FROM public.admins;
DELETE FROM public.accounts;

-- Clear auth.users table (Supabase auth)
-- Note: This will remove all user accounts
DELETE FROM auth.users;

-- Re-enable RLS after data deletion
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Reset sequences if any exist
-- Note: Most tables use UUIDs, but if there are any serial columns, they would be reset here

-- Verify tables are empty
SELECT 'accounts' as table_name, COUNT(*) as row_count FROM public.accounts
UNION ALL
SELECT 'account_users', COUNT(*) FROM public.account_users
UNION ALL
SELECT 'businesses', COUNT(*) FROM public.businesses
UNION ALL
SELECT 'contacts', COUNT(*) FROM public.contacts
UNION ALL
SELECT 'widgets', COUNT(*) FROM public.widgets
UNION ALL
SELECT 'widget_reviews', COUNT(*) FROM public.widget_reviews
UNION ALL
SELECT 'review_submissions', COUNT(*) FROM public.review_submissions
UNION ALL
SELECT 'prompt_pages', COUNT(*) FROM public.prompt_pages
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM public.analytics_events
UNION ALL
SELECT 'ai_usage', COUNT(*) FROM public.ai_usage
UNION ALL
SELECT 'feedback', COUNT(*) FROM public.feedback
UNION ALL
SELECT 'announcements', COUNT(*) FROM public.announcements
UNION ALL
SELECT 'quotes', COUNT(*) FROM public.quotes
UNION ALL
SELECT 'email_templates', COUNT(*) FROM public.email_templates
UNION ALL
SELECT 'trial_reminder_logs', COUNT(*) FROM public.trial_reminder_logs
UNION ALL
SELECT 'admins', COUNT(*) FROM public.admins
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
ORDER BY table_name; 