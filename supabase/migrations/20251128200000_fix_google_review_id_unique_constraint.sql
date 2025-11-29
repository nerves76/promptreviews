-- Fix: Make google_review_id unique constraint scoped by account_id
-- 
-- Problem: The current unique index on google_review_id is global, preventing
-- the same Google review from existing in multiple accounts. This causes issues when:
-- 1. RLS bugs allowed reviews to be imported to the wrong account
-- 2. Multiple accounts legitimately connect to the same GBP location
--
-- Solution: Change the unique constraint to be (google_review_id, account_id)
-- This allows the same Google review to exist in different accounts while still
-- preventing duplicates within a single account.

-- Drop the existing global unique index
DROP INDEX IF EXISTS idx_review_submissions_google_review_id_unique;

-- Create new account-scoped unique index
CREATE UNIQUE INDEX idx_review_submissions_google_review_id_account_unique 
ON review_submissions (google_review_id, account_id) 
WHERE google_review_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_review_submissions_google_review_id_account_unique IS 
'Ensures each Google review is unique per account, allowing the same review to exist in multiple accounts if they share a GBP location';
