-- Fix businesses table column naming issue
-- This script checks the current state and fixes the column naming

-- First, let's see what columns currently exist in the businesses table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if owner_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'owner_id'
    ) THEN
        -- owner_id exists, rename it to reviewer_id
        ALTER TABLE public.businesses RENAME COLUMN owner_id TO reviewer_id;
        RAISE NOTICE 'Renamed owner_id to reviewer_id';
    ELSE
        RAISE NOTICE 'owner_id column does not exist';
    END IF;
END $$;

-- Check if reviewer_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'reviewer_id'
    ) THEN
        -- reviewer_id doesn't exist, create it
        ALTER TABLE public.businesses ADD COLUMN reviewer_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added reviewer_id column';
    ELSE
        RAISE NOTICE 'reviewer_id column already exists';
    END IF;
END $$;

-- Drop old RLS policies that reference owner_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;

-- Create new RLS policies using reviewer_id
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Show final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position; 