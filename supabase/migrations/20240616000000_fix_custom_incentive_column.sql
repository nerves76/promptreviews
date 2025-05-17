-- Remove the custom_incentive column if it exists
ALTER TABLE public.prompt_pages
DROP COLUMN IF EXISTS custom_incentive;

-- Add the offer_url column with proper type
ALTER TABLE public.prompt_pages
ADD COLUMN offer_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.prompt_pages.offer_url IS 'URL for the offer/reward page where users can claim their reward'; 