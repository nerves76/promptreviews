-- Add about_us column to businesses table
-- This column was referenced in the business profile form but missing from the schema

-- Add the about_us column if it doesn't exist
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS about_us text;

-- Add a comment to document the column
COMMENT ON COLUMN public.businesses.about_us IS 'Business description/about us section';

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Added about_us column to businesses table';
END $$; 