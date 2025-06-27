-- Comprehensive fix for businesses table
-- This script handles all possible states and ensures correct structure

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we need to add missing columns that should exist
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN name text;
        RAISE NOTICE 'Added name column';
    END IF;

    -- Add business_website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'business_website'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN business_website text;
        RAISE NOTICE 'Added business_website column';
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN phone text;
        RAISE NOTICE 'Added phone column';
    END IF;

    -- Add business_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'business_email'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN business_email text;
        RAISE NOTICE 'Added business_email column';
    END IF;

    -- Add address columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'address_street'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN address_street text;
        RAISE NOTICE 'Added address_street column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'address_city'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN address_city text;
        RAISE NOTICE 'Added address_city column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'address_state'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN address_state text;
        RAISE NOTICE 'Added address_state column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'address_zip'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN address_zip text;
        RAISE NOTICE 'Added address_zip column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'address_country'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN address_country text;
        RAISE NOTICE 'Added address_country column';
    END IF;

    -- Add industry columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'industry'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN industry text[];
        RAISE NOTICE 'Added industry column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'industry_other'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN industry_other text;
        RAISE NOTICE 'Added industry_other column';
    END IF;
END $$;

-- Handle the reviewer_id column issue
DO $$
BEGIN
    -- Check if owner_id exists and rename it to reviewer_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.businesses RENAME COLUMN owner_id TO reviewer_id;
        RAISE NOTICE 'Renamed owner_id to reviewer_id';
    END IF;

    -- If reviewer_id doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN reviewer_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added reviewer_id column';
        
        -- Set reviewer_id = id for existing rows
        UPDATE public.businesses SET reviewer_id = id WHERE reviewer_id IS NULL;
        RAISE NOTICE 'Updated existing rows to set reviewer_id = id';
    END IF;
END $$;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;

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