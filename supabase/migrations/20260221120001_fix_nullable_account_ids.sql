-- Migration: Fix nullable account_id on tenant-scoped tables
-- Date: 2026-02-21
-- Purpose: Add account_id to widget_reviews (missing entirely) and document
--          other tables with nullable account_id that need backfilling.
--
-- SAFETY: This migration is non-destructive. It adds a nullable column and
-- an index. No existing data is modified, no NOT NULL constraints are added.

-- =============================================================================
-- 1. widget_reviews: Add account_id column (currently missing entirely)
-- =============================================================================
-- The widget_reviews table has no account_id column. It can be derived from
-- the widgets table (widget_reviews.widget_id -> widgets.id -> widgets.account_id),
-- but having a direct account_id enables RLS policies and efficient filtering.

ALTER TABLE widget_reviews
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Add index for efficient account-scoped queries
CREATE INDEX IF NOT EXISTS idx_widget_reviews_account_id
  ON widget_reviews(account_id);

-- Add composite index for common query pattern: account + widget
CREATE INDEX IF NOT EXISTS idx_widget_reviews_account_widget
  ON widget_reviews(account_id, widget_id);

-- =============================================================================
-- BACKFILL: Run this manually after verifying data, then apply a follow-up
-- migration to add NOT NULL constraint.
-- =============================================================================
-- Step 1: Backfill existing rows from the widgets table
-- UPDATE widget_reviews wr
--   SET account_id = w.account_id
--   FROM widgets w
--   WHERE wr.widget_id = w.id
--   AND wr.account_id IS NULL;
--
-- Step 2: Verify no orphaned rows remain
-- SELECT COUNT(*) FROM widget_reviews WHERE account_id IS NULL;
--
-- Step 3: If count is 0, apply follow-up migration:
-- ALTER TABLE widget_reviews ALTER COLUMN account_id SET NOT NULL;

-- =============================================================================
-- 2. Other tenant-scoped tables with nullable account_id
-- =============================================================================
-- The following tables have nullable account_id and should be evaluated for
-- backfilling. DO NOT add NOT NULL constraints without first verifying all
-- existing rows have been populated.
--
-- TABLE: review_submissions
--   account_id is nullable (String? @db.Uuid)
--   Backfill paths (all nullable FKs, so multiple may be needed):
--     - via prompt_pages:  rs.prompt_page_id -> prompt_pages.account_id
--     - via widgets:       rs.widget_id -> widgets.account_id
--     - via businesses:    rs.business_id -> businesses.account_id
--     - via contacts:      rs.contact_id -> contacts.account_id
--     - via communication_records: rs.communication_record_id -> communication_records.account_id
--   Suggested backfill:
--     UPDATE review_submissions rs SET account_id = pp.account_id
--       FROM prompt_pages pp WHERE rs.prompt_page_id = pp.id AND rs.account_id IS NULL;
--     UPDATE review_submissions rs SET account_id = w.account_id
--       FROM widgets w WHERE rs.widget_id = w.id AND rs.account_id IS NULL;
--     UPDATE review_submissions rs SET account_id = b.account_id
--       FROM businesses b WHERE rs.business_id = b.id AND rs.account_id IS NULL;
--     UPDATE review_submissions rs SET account_id = c.account_id
--       FROM contacts c WHERE rs.contact_id = c.id AND rs.account_id IS NULL;
--
-- TABLE: email_domain_policies
--   account_id is nullable (String? @db.Uuid)
--   May be intentionally nullable for global/system-level policies.
--   Verify: SELECT COUNT(*) FROM email_domain_policies WHERE account_id IS NULL;
--   If all rows have account_id, consider adding NOT NULL.
--
-- TABLE: account_events
--   account_id is nullable (String? @db.Uuid)
--   Likely intentional -- system events may not be tied to an account.
--
-- TABLE: ai_usage_logs
--   account_id is nullable (String? @db.Uuid)
--   Likely intentional -- some AI usage may be anonymous or system-level.
--
-- TABLE: audit_logs
--   account_id is nullable (String? @db.Uuid)
--   Likely intentional -- system-level audit events may not have an account.
--
-- TABLE: rate_limit_violations
--   account_id is nullable (String? @db.Uuid)
--   Likely intentional -- rate limiting may apply to anonymous/unauthenticated requests.
