-- Fix RLS policies for businesses table to work with account_id
-- The current policies expect reviewer_id but the form uses account_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;

-- Create new policies using account_id
-- Users can view businesses that belong to their account
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (
    account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update businesses that belong to their account
CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create businesses for their account
CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  ); 