-- Rename business_id to reviewer_id in prompt_pages table
ALTER TABLE public.prompt_pages 
RENAME COLUMN business_id TO reviewer_id;

-- Rename owner_id to reviewer_id in businesses table
ALTER TABLE public.businesses 
RENAME COLUMN owner_id TO reviewer_id;

-- Update RLS policies to use new column names
DROP POLICY IF EXISTS "Users can view their own prompt pages" ON public.prompt_pages;
CREATE POLICY "Users can view their own prompt pages"
ON public.prompt_pages
FOR SELECT
TO authenticated
USING (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
CREATE POLICY "Users can view their own businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (reviewer_id = auth.uid()); 