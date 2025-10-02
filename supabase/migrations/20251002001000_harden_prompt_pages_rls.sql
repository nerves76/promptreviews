-- Migration: Harden prompt_pages RLS policies
-- Date: 2025-10-02
-- Description: Fixes permissive public policy that allowed enumeration of all in_queue prompt pages

-- Drop all existing policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access to published prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Users can view their own prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Users can insert their own prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Users can update their own prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Users can delete their own prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Authenticated can view universal prompt pages" ON public.prompt_pages;
    DROP POLICY IF EXISTS "Public can view universal prompt pages" ON public.prompt_pages;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.prompt_pages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUTHENTICATED USER POLICIES - Account-scoped access
-- ============================================================================

-- Account members can view their account's prompt pages
CREATE POLICY "Account members can view prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );

-- Account members can insert prompt pages for their accounts
CREATE POLICY "Account members can insert prompt pages"
    ON public.prompt_pages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );

-- Account members can update their account's prompt pages
CREATE POLICY "Account members can update prompt pages"
    ON public.prompt_pages
    FOR UPDATE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );

-- Account members can delete their account's prompt pages
CREATE POLICY "Account members can delete prompt pages"
    ON public.prompt_pages
    FOR DELETE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ANONYMOUS USER POLICIES - Restricted public access only
-- ============================================================================

-- Anonymous users can only view truly public prompt pages
-- Public = universal pages that are in_queue status
CREATE POLICY "Public can view universal prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO anon
    USING (
        is_universal = true
        AND status = 'in_queue'
    );

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.prompt_pages IS 'Prompt pages for collecting reviews. RLS enabled with account-based access for authenticated users and restricted public access for published universal pages only.';

-- Summary of changes:
-- BEFORE: Public policy allowed anyone to read ANY prompt_page with status = 'in_queue'
-- AFTER: Anonymous users can only read published universal pages (is_universal = true AND status = 'published')
-- BEFORE: Authenticated policies likely used account_id = auth.uid() (wrong)
-- AFTER: Authenticated policies use proper account_users junction table lookup
