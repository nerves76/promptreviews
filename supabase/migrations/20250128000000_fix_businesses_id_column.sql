-- Fix businesses table id column to be auto-generated
-- The original table was created with id referencing auth.users, but we need it to be auto-generated

-- First, drop any foreign key constraints that depend on the primary key
ALTER TABLE public.review_submissions DROP CONSTRAINT IF EXISTS fk_review_submissions_business_id;

-- Drop the foreign key constraint if it exists
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_id_fkey;

-- Drop the primary key constraint
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_pkey;

-- Change the id column to be auto-generated
ALTER TABLE public.businesses ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.businesses ALTER COLUMN id DROP NOT NULL;

-- Add back the primary key constraint
ALTER TABLE public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);

-- Make id NOT NULL again after setting the default
ALTER TABLE public.businesses ALTER COLUMN id SET NOT NULL;

-- Re-add the foreign key constraint that was dropped
ALTER TABLE public.review_submissions 
ADD CONSTRAINT fk_review_submissions_business_id 
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.businesses.id IS 'Auto-generated unique identifier for the business'; 