-- Fix RLS policies for businesses table to use account_id
-- Based on the actual table structure showing account_id as the user reference

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;

-- Create new RLS policies using account_id
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = account_id);

CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = account_id);

-- Show the policies to confirm they were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'businesses' AND schemaname = 'public'; 