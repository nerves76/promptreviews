-- Fix businesses table RLS policies by removing reviewer_id references
-- Run this on local database only

-- Drop all existing policies that might reference reviewer_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;

-- Remove the problematic reviewer_id column if it exists
ALTER TABLE public.businesses DROP COLUMN IF EXISTS reviewer_id;

-- Create simple policies based on account_id
CREATE POLICY "Users can view businesses for their account"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = businesses.account_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create businesses for their account"
  ON public.businesses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = businesses.account_id
      AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update businesses for their account"
  ON public.businesses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = businesses.account_id
      AND au.user_id = auth.uid()
    )
  );

-- Enable RLS on the table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

SELECT 'Fixed businesses table policies' as result; 