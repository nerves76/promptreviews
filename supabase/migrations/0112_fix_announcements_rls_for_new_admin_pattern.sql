-- Fix announcements and quotes RLS policies to work with new admin pattern
-- This migration updates RLS policies to use accounts.is_admin instead of the admins table

-- =====================================================
-- FIX ANNOUNCEMENTS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies that reference the admins table
DROP POLICY IF EXISTS "Allow admins to manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow admin management of announcements" ON public.announcements;

-- Drop the old foreign key constraint
ALTER TABLE public.announcements DROP CONSTRAINT announcements_created_by_fkey;

-- Add new foreign key constraint to auth.users instead of admins
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create new policy that checks accounts.is_admin
CREATE POLICY "Allow admins to manage announcements" ON public.announcements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- =====================================================
-- FIX QUOTES TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies that reference the admins table
DROP POLICY IF EXISTS "Allow admins to manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow admin management of quotes" ON public.quotes;

-- Drop the old foreign key constraint
ALTER TABLE public.quotes DROP CONSTRAINT quotes_created_by_fkey;

-- Add new foreign key constraint to auth.users instead of admins
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create new policy that checks accounts.is_admin
CREATE POLICY "Allow admins to manage quotes" ON public.quotes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- =====================================================
-- VERIFY THE CHANGES
-- =====================================================

-- Show the updated policies
SELECT 
    'Announcements Policies' as table_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'announcements'
AND schemaname = 'public';

SELECT 
    'Quotes Policies' as table_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'quotes'
AND schemaname = 'public';

-- Add comment explaining the change
COMMENT ON TABLE public.announcements IS 'Admin announcements table - now uses accounts.is_admin for permission checking';
COMMENT ON TABLE public.quotes IS 'Admin quotes table - now uses accounts.is_admin for permission checking'; 