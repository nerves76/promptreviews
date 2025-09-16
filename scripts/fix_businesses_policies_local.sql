-- Fix businesses table RLS policies by removing reviewer_id references
-- This script fixes local database issues where old RLS policies reference
-- a reviewer_id column that shouldn't exist in the businesses table
-- 
-- Usage: Run this script on local database when you encounter errors like:
-- "null value in column "reviewer_id" of relation "businesses" violates not-null constraint"
--
-- Command to run:
-- PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/fix_businesses_policies_local.sql

-- Drop all existing policies that might reference reviewer_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;

-- Create proper RLS policies based on account_id (not reviewer_id)
-- These policies ensure users can only access businesses in their account

-- Allow users to select businesses in their account
CREATE POLICY "Users can view businesses in their account" ON public.businesses
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM public.accounts 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to insert businesses in their account
CREATE POLICY "Users can create businesses in their account" ON public.businesses
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT id FROM public.accounts 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to update businesses in their account
CREATE POLICY "Users can update businesses in their account" ON public.businesses
    FOR UPDATE USING (
        account_id IN (
            SELECT id FROM public.accounts 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to delete businesses in their account
CREATE POLICY "Users can delete businesses in their account" ON public.businesses
    FOR DELETE USING (
        account_id IN (
            SELECT id FROM public.accounts 
            WHERE user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

SELECT 'RLS policies for businesses table have been fixed!' as result; 