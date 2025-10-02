-- Migration: Fix universal prompt page policy to remove status filter
-- Date: 2025-10-02
-- Description: Remove status filter from anon policy - universal pages should be accessible in all statuses

-- Drop and recreate the policy without status filter
DROP POLICY IF EXISTS "Public can view universal prompt pages" ON public.prompt_pages;
DROP POLICY IF EXISTS "Public can view in_queue prompt pages" ON public.prompt_pages;

-- Allow anonymous users to read any universal prompt page regardless of status
CREATE POLICY "Public can view universal prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO anon
    USING (
        is_universal = true
    );

-- Update comment
COMMENT ON TABLE public.prompt_pages IS 'Prompt pages for collecting reviews. RLS enabled with account-based access for authenticated users. Anonymous users can view any universal prompt pages regardless of status.';
