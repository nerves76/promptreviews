-- Backfill account_id for review_submissions that are missing it
--
-- Issue: Imported Google Business Profile reviews have account_id = NULL because
-- the auto-population trigger only works when prompt_page_id is NOT NULL.
-- This causes RLS to block access to imported reviews.
--
-- This migration:
-- 1. Updates review_submissions with NULL account_id to populate from business_id
-- 2. Updates the trigger to also handle NULL prompt_page_id by falling back to business

BEGIN;

-- Backfill account_id for existing reviews that are missing it
-- Use business_id to find the account_id
UPDATE review_submissions rs
SET account_id = b.account_id
FROM businesses b
WHERE rs.account_id IS NULL
  AND rs.business_id = b.id
  AND rs.business_id IS NOT NULL;

-- Update the trigger function to handle NULL prompt_page_id
CREATE OR REPLACE FUNCTION public.auto_populate_review_submission_account_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Auto-populate account_id from the associated prompt_page
    IF NEW.prompt_page_id IS NOT NULL AND (NEW.account_id IS NULL OR TG_OP = 'UPDATE') THEN
        SELECT account_id INTO NEW.account_id
        FROM public.prompt_pages
        WHERE id = NEW.prompt_page_id;
    -- If no prompt_page_id but has business_id, use business.account_id
    ELSIF NEW.prompt_page_id IS NULL AND NEW.business_id IS NOT NULL AND NEW.account_id IS NULL THEN
        SELECT account_id INTO NEW.account_id
        FROM public.businesses
        WHERE id = NEW.business_id;
    END IF;

    RETURN NEW;
END;
$function$;

COMMIT;
