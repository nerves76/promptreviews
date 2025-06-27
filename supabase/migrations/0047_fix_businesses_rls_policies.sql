-- Fix RLS policies for businesses table to use reviewer_id instead of owner_id
-- The column was renamed from owner_id to reviewer_id in migration 0008, but RLS policies weren't updated

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;

-- Create new policies using reviewer_id
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id); 