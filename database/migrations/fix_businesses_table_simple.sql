-- Fix businesses table to use the original, simpler design
-- The businesses table should have id as primary key referencing auth.users(id)
-- No need for separate owner_id or reviewer_id columns

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns that should exist
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

-- Remove unnecessary owner_id and reviewer_id columns
DO $$
BEGIN
    -- Drop reviewer_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE public.businesses DROP COLUMN reviewer_id;
        RAISE NOTICE 'Dropped reviewer_id column';
    END IF;

    -- Drop owner_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.businesses DROP COLUMN owner_id;
        RAISE NOTICE 'Dropped owner_id column';
    END IF;
END $$;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;

-- Create RLS policies using the original design (id = auth.uid())
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Show final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position; 