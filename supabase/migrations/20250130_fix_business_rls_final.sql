-- Fix Business RLS Policies - Final Version
-- This migration ensures that users can create businesses for their accounts
-- even if they're not properly linked in account_users table

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their account's businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their account's businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create businesses for their account" ON public.businesses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.businesses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.businesses;
DROP POLICY IF EXISTS "Enable update for users based on account_id" ON public.businesses;
DROP POLICY IF EXISTS "Enable delete for users based on account_id" ON public.businesses;
DROP POLICY IF EXISTS "Public read access" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON public.businesses;

-- Create comprehensive policies that handle both account_users and direct account_id matching
-- This ensures compatibility with both the multi-user account structure and legacy single-user accounts

-- Users can view businesses that belong to their account
CREATE POLICY "Users can view their account's businesses" ON public.businesses
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

-- Users can update businesses that belong to their account
CREATE POLICY "Users can update their account's businesses" ON public.businesses
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

-- Users can create businesses for their account
CREATE POLICY "Users can create businesses for their account" ON public.businesses
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

-- Users can delete businesses that belong to their account
CREATE POLICY "Users can delete their account's businesses" ON public.businesses
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Add a trigger to automatically add users to account_users when they create an account
-- This ensures the relationship is always maintained
CREATE OR REPLACE FUNCTION public.ensure_account_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the user into account_users if they don't exist
  INSERT INTO public.account_users (account_id, user_id, role)
  VALUES (NEW.id, NEW.id, 'owner')
  ON CONFLICT (account_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_account_user_trigger ON public.accounts;

-- Create trigger on accounts table
CREATE TRIGGER ensure_account_user_trigger
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_account_user();

-- Show the final policies for verification
SELECT 
  'Final RLS Policies' as status,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'businesses' 
  AND schemaname = 'public'
ORDER BY policyname; 