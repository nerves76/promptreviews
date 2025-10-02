-- Migration: Fix RLS Account Isolation for widgets, widget_reviews, analytics_events, and admins
-- Date: 2025-10-01
-- Description: Replaces world-readable RLS policies with account-scoped access controls
-- Critical security fix to prevent cross-account data leakage

-- ============================================================================
-- 1. FIX WIDGETS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing permissive policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON widgets;
    DROP POLICY IF EXISTS "Allow select for authenticated users" ON widgets;
    DROP POLICY IF EXISTS "Allow insert for authenticated users" ON widgets;
    DROP POLICY IF EXISTS "Allow update for authenticated users" ON widgets;
    DROP POLICY IF EXISTS "Allow delete for authenticated users" ON widgets;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new account-scoped policies for authenticated users
CREATE POLICY "Authenticated users can view their account widgets"
    ON widgets FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can insert widgets for their accounts"
    ON widgets FOR INSERT
    TO authenticated
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can update their account widgets"
    ON widgets FOR UPDATE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can delete their account widgets"
    ON widgets FOR DELETE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- Create restricted anonymous access policy
-- Only allow viewing active widgets (for embedding purposes)
-- Note: Widget embed code validates widget_id on the backend
CREATE POLICY "Anonymous users can view active widgets"
    ON widgets FOR SELECT
    TO anon
    USING (is_active = true);

-- ============================================================================
-- 2. FIX WIDGET_REVIEWS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing permissive policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access to widget reviews" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow authenticated users to insert widget reviews" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow authenticated users to view widget reviews" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow authenticated users to update widget reviews" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow authenticated users to delete widget reviews" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow select for authenticated users" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow insert for authenticated users" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow update for authenticated users" ON widget_reviews;
    DROP POLICY IF EXISTS "Allow delete for authenticated users" ON widget_reviews;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new account-scoped policies for authenticated users
CREATE POLICY "Authenticated users can view their account widget reviews"
    ON widget_reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Authenticated users can insert widget reviews for their accounts"
    ON widget_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Authenticated users can update their account widget reviews"
    ON widget_reviews FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Authenticated users can delete their account widget reviews"
    ON widget_reviews FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create restricted anonymous access policy
-- Only allow viewing reviews for active widgets
CREATE POLICY "Anonymous users can view reviews for active widgets"
    ON widget_reviews FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.is_active = true
        )
    );

-- ============================================================================
-- 3. FIX ANALYTICS_EVENTS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing permissive policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own events" ON analytics_events;
    DROP POLICY IF EXISTS "Users can insert their own events" ON analytics_events;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new account-scoped policies
CREATE POLICY "Authenticated users can view their account analytics"
    ON analytics_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM prompt_pages pp
            WHERE pp.id = analytics_events.prompt_page_id
            AND pp.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Allow authenticated users to insert analytics events
-- Note: The backend validates prompt_page_id ownership before insertion
CREATE POLICY "Authenticated users can insert analytics events"
    ON analytics_events FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow anonymous users to insert analytics events for public tracking
-- Note: The backend validates and sanitizes event data
CREATE POLICY "Anonymous users can insert analytics events"
    ON analytics_events FOR INSERT
    TO anon
    WITH CHECK (true);

-- ============================================================================
-- 4. FIX ADMINS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing permissive policy
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create restricted SELECT policy - only admins can view admin list
CREATE POLICY "Only admins can view admins"
    ON admins FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Note: INSERT, UPDATE, DELETE policies already check admin status, no changes needed

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Verify widgets policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'widgets'
-- ORDER BY policyname;

-- Verify widget_reviews policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'widget_reviews'
-- ORDER BY policyname;

-- Verify analytics_events policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'analytics_events'
-- ORDER BY policyname;

-- Verify admins policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'admins'
-- ORDER BY policyname;
