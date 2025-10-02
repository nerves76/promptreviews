-- Migration: HOTFIX - Restore public access to all in_queue prompt pages
-- Date: 2025-10-02
-- Description: Emergency fix - businesses need customers to access prompt pages to submit reviews

-- ============================================================================
-- PROMPT_PAGES - Fix overly restrictive anon policy
-- ============================================================================

-- Drop the overly restrictive policy that included status filter
DROP POLICY IF EXISTS "Public can view universal prompt pages" ON public.prompt_pages;

-- Allow anonymous users to read any universal prompt page regardless of status
-- Universal pages can be in various statuses (complete, in_progress, sent, etc.)
-- and should remain publicly accessible in all states
CREATE POLICY "Public can view universal prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO anon
    USING (
        is_universal = true
    );

-- Update comment to clarify the intended access model
COMMENT ON TABLE public.prompt_pages IS 'Prompt pages for collecting reviews. RLS enabled with account-based access for authenticated users. Anonymous users can view any universal prompt pages regardless of status.';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Why this change was necessary:
-- Previous migration 20251002001000 restricted anon access with a status filter:
--   USING (is_universal = true AND status = 'in_queue')
--
-- This caused 404s for universal prompt pages in other statuses:
-- - complete
-- - in_progress
-- - sent
-- - follow_up
-- - draft
--
-- Problem:
-- - Universal prompt pages can be in various statuses
-- - Status is not used as a gating signal for public access
-- - Adding status filter broke access to universal pages that aren't in_queue
-- - Customers got 404s when trying to view/submit reviews on these pages
--
-- Correct security model:
-- - Anon users: Can view any universal prompt page (regardless of status)
-- - Authenticated users: Can only view/manage prompt pages for accounts they belong to
-- - Status is a workflow tracking field, not an access control field
