-- Ensure business_id auto-populates for review submissions
-- 1. Backfill missing business_id values
-- 2. Add trigger to populate business_id on insert/update

BEGIN;

-- Backfill from prompt_pages.account_id when available
UPDATE public.review_submissions rs
SET business_id = pp.account_id
FROM public.prompt_pages pp
WHERE rs.business_id IS NULL
  AND rs.prompt_page_id = pp.id
  AND pp.account_id IS NOT NULL;

-- Backfill from account_id as a fallback
UPDATE public.review_submissions
SET business_id = account_id
WHERE business_id IS NULL
  AND account_id IS NOT NULL;

-- Trigger function to auto-populate business_id
CREATE OR REPLACE FUNCTION public.auto_populate_review_submission_business_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.business_id IS NULL THEN
        IF NEW.prompt_page_id IS NOT NULL THEN
            SELECT account_id INTO NEW.business_id
            FROM public.prompt_pages
            WHERE id = NEW.prompt_page_id;
        ELSIF NEW.account_id IS NOT NULL THEN
            NEW.business_id := NEW.account_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_auto_populate_review_submission_business_id
  ON public.review_submissions;

CREATE TRIGGER trigger_auto_populate_review_submission_business_id
BEFORE INSERT OR UPDATE ON public.review_submissions
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_review_submission_business_id();

COMMIT;
