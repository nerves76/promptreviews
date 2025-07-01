-- Fix announcements public access
-- This migration allows all users (including unauthenticated) to read active announcements

-- =====================================================
-- FIX ANNOUNCEMENTS RLS FOR PUBLIC ACCESS
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow all users to read active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public read access to active announcements" ON public.announcements;

-- Create new policy that allows public read access to active announcements
CREATE POLICY "Allow public read access to active announcements" ON public.announcements
    FOR SELECT
    TO public
    USING (is_active = true);

-- Keep the admin management policy
-- (The existing policy for admins to manage announcements should remain)

-- =====================================================
-- FIX QUOTES RLS FOR PUBLIC ACCESS
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow all users to read active quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public read access to active quotes" ON public.quotes;

-- Create new policy that allows public read access to active quotes
CREATE POLICY "Allow public read access to active quotes" ON public.quotes
    FOR SELECT
    TO public
    USING (is_active = true);

-- Keep the admin management policy
-- (The existing policy for admins to manage quotes should remain)

-- =====================================================
-- VERIFY CHANGES
-- =====================================================

-- Show the new policies
SELECT 
    'Announcements Policies' as table_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'announcements';

SELECT 
    'Quotes Policies' as table_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'quotes'; 