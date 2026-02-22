-- Migration: Add missing composite indexes for common query patterns
-- Tables: review_submissions, communication_records, prompt_pages, widgets,
--         widget_reviews, notifications, credit_ledger
--
-- These indexes target the most common query pattern in the app:
--   .eq('account_id', accountId).order('created_at', { ascending: false })
--
-- Uses CREATE INDEX IF NOT EXISTS to be safely re-runnable.

-- =============================================================================
-- communication_records: account_id + created_at (DESC)
-- Used by: communication.ts, contacts pages, communication API routes
-- Existing: only account_id alone, no composite with created_at
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_communication_records_account_created
  ON public.communication_records (account_id, created_at DESC);

-- =============================================================================
-- review_submissions: account_id + created_at (DESC)
-- Used by: reviews pages, export, stats, keyword checks
-- Existing: has (account_id, status, created_at) but not plain (account_id, created_at)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_created
  ON public.review_submissions (account_id, created_at DESC);

-- =============================================================================
-- prompt_pages: account_id + created_at (DESC)
-- Used by: prompt pages listing, ensure-universal, bulk operations
-- Existing: has dashboard composite but not simple (account_id, created_at)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_created
  ON public.prompt_pages (account_id, created_at DESC);

-- =============================================================================
-- widgets: account_id + created_at (DESC)
-- Used by: useWidgets hook, widget listing pages
-- Existing: has (account_id, type, created_at) but not simple (account_id, created_at)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_widgets_account_created
  ON public.widgets (account_id, created_at DESC);

-- =============================================================================
-- widget_reviews: widget_id + order_index
-- Used by: widget reviews GET endpoint (order by order_index)
-- Existing: separate widget_id and order_index indexes, no composite
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_order
  ON public.widget_reviews (widget_id, order_index ASC);

-- =============================================================================
-- notifications: account_id + created_at (DESC)
-- Used by: notifications listing, bell icon badge counts
-- Existing: has (account_id, user_id, read, dismissed) but not (account_id, created_at)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_account_created
  ON public.notifications (account_id, created_at DESC);

-- =============================================================================
-- credit_ledger: account_id + created_at (DESC)
-- Used by: credits service (balance lookups, ledger listing)
-- Existing: separate account_id and created_at indexes, no composite
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_ledger_account_created
  ON public.credit_ledger (account_id, created_at DESC);

-- =============================================================================
-- communication_records: contact_id + created_at (DESC)
-- Used by: contact detail pages showing communication history
-- Existing: only contact_id alone
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_communication_records_contact_created
  ON public.communication_records (contact_id, created_at DESC);

-- =============================================================================
-- review_submissions: prompt_page_id + created_at (DESC)
-- Used by: recent-reviews API, prompt page review listings
-- Existing: has (prompt_page_id, platform) but not (prompt_page_id, created_at)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_review_submissions_page_created
  ON public.review_submissions (prompt_page_id, created_at DESC);

-- =============================================================================
-- review_submissions: account_id + platform + created_at (DESC)
-- Used by: reviews stats, platform-specific filtering
-- Existing: separate platform index, no composite with account_id
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_platform_created
  ON public.review_submissions (account_id, platform, created_at DESC);
