-- Migration 2: Update RLS policies for review_submissions to enforce account isolation
-- This replaces the permissive policies with proper account-based access control

DO $$
BEGIN
    -- Step 1: Drop existing permissive policies that allow all authenticated users to see all reviews
    BEGIN
        DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;

    BEGIN
        DROP POLICY IF EXISTS "Allow public read access for submitted reviews" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users manage their reviews" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can view reviews for their accounts" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can import reviews for their accounts" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can update reviews for their accounts" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- Policy doesn't exist, continue
    END;
END $$;

-- Step 2: Create new authenticated user policy - only see reviews for accounts they belong to
CREATE POLICY "Authenticated users can manage their account reviews"
ON public.review_submissions
FOR ALL
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

-- Step 3: Create new anonymous policy - only see submitted reviews from universal prompt pages with recent reviews enabled
CREATE POLICY "Anonymous users can view recent reviews"
ON public.review_submissions
FOR SELECT
TO anon
USING (
    status = 'submitted'
    AND EXISTS (
        SELECT 1
        FROM public.prompt_pages pp
        WHERE pp.id = review_submissions.prompt_page_id
        AND pp.is_universal = true
        AND pp.recent_reviews_enabled = true
    )
);

-- Step 4: Keep existing INSERT policy for anonymous submissions (from migration 0109)
-- This policy should already exist, but we'll recreate it to be safe
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Allow anonymous users to insert reviews" ON public.review_submissions;
    EXCEPTION
        WHEN undefined_object THEN
            NULL;
    END;
END $$;

CREATE POLICY "Allow anonymous users to insert reviews"
ON public.review_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Add comments to document the policies
COMMENT ON POLICY "Authenticated users can manage their account reviews" ON public.review_submissions
IS 'Allows authenticated users to view/edit/delete reviews only for accounts they belong to (via account_users table)';

COMMENT ON POLICY "Anonymous users can view recent reviews" ON public.review_submissions
IS 'Allows anonymous users to view submitted reviews only from universal prompt pages with recent_reviews_enabled=true';

COMMENT ON POLICY "Allow anonymous users to insert reviews" ON public.review_submissions
IS 'Allows anonymous users to submit feedback and reviews through prompt pages';
