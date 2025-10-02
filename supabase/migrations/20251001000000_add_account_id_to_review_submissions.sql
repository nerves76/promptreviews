-- Migration 1: Add account_id column to review_submissions and backfill from prompt_pages
-- This is part of the account isolation security fix for review_submissions table

-- Step 1: Add account_id column (nullable initially for backfill)
ALTER TABLE public.review_submissions
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Step 2: Backfill account_id from the associated prompt_page
UPDATE public.review_submissions
SET account_id = (
    SELECT pp.account_id
    FROM public.prompt_pages pp
    WHERE pp.id = review_submissions.prompt_page_id
)
WHERE account_id IS NULL;

-- Step 3: Create index for performance on account-based queries
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_id
ON public.review_submissions(account_id);

-- Step 4: Create index for combined account + status filtering (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_status
ON public.review_submissions(account_id, status, created_at DESC);

-- Step 5: Create trigger function to auto-populate account_id on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.auto_populate_review_submission_account_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate account_id from the associated prompt_page
    IF NEW.prompt_page_id IS NOT NULL AND (NEW.account_id IS NULL OR TG_OP = 'UPDATE') THEN
        SELECT account_id INTO NEW.account_id
        FROM public.prompt_pages
        WHERE id = NEW.prompt_page_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to automatically set account_id
DROP TRIGGER IF EXISTS trigger_auto_populate_review_submission_account_id ON public.review_submissions;
CREATE TRIGGER trigger_auto_populate_review_submission_account_id
    BEFORE INSERT OR UPDATE ON public.review_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_populate_review_submission_account_id();

-- Add comments for documentation
COMMENT ON COLUMN public.review_submissions.account_id IS 'Account ID from the associated prompt_page, auto-populated via trigger for account isolation';
COMMENT ON FUNCTION public.auto_populate_review_submission_account_id() IS 'Automatically populates account_id from the associated prompt_page to ensure proper account isolation';
