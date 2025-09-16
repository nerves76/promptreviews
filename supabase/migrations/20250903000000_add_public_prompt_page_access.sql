-- Add public access policy for prompt pages
-- Date: 2025-09-03
-- 
-- This migration adds a policy to allow anonymous users to view prompt pages
-- that are marked as public or universal. This is required for public prompt pages
-- to be accessible via the public API while still maintaining security.

-- Add public SELECT policy for prompt_pages
-- Only allow reading of prompt pages, not writing, and only for universal pages
CREATE POLICY "Public can view universal prompt pages" ON public.prompt_pages
FOR SELECT TO anon
USING (
  is_universal = true
);

-- Also add policy for authenticated users to access universal pages (for consistency)
CREATE POLICY "Authenticated can view universal prompt pages" ON public.prompt_pages  
FOR SELECT TO authenticated
USING (
  is_universal = true
);

-- Add similar policy for businesses table so business profiles can be fetched
-- But only for accounts that have universal prompt pages
CREATE POLICY "Public can view businesses with universal prompt pages" ON public.businesses
FOR SELECT TO anon
USING (
  account_id IN (
    SELECT DISTINCT account_id 
    FROM public.prompt_pages 
    WHERE is_universal = true
  )
);

-- Add similar policy for business_locations
CREATE POLICY "Public can view business locations with universal prompt pages" ON public.business_locations
FOR SELECT TO anon
USING (
  account_id IN (
    SELECT DISTINCT account_id 
    FROM public.prompt_pages 
    WHERE is_universal = true
  )
);

-- Add policy for authenticated users to access these businesses too
CREATE POLICY "Authenticated can view businesses with universal prompt pages" ON public.businesses
FOR SELECT TO authenticated  
USING (
  account_id IN (
    SELECT DISTINCT account_id 
    FROM public.prompt_pages 
    WHERE is_universal = true
  )
);

CREATE POLICY "Authenticated can view business locations with universal prompt pages" ON public.business_locations
FOR SELECT TO authenticated
USING (
  account_id IN (
    SELECT DISTINCT account_id 
    FROM public.prompt_pages 
    WHERE is_universal = true
  )
);