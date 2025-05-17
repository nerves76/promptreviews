-- Add background_type and gradient columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS background_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS gradient_start TEXT DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS gradient_middle TEXT DEFAULT '#818CF8',
ADD COLUMN IF NOT EXISTS gradient_end TEXT DEFAULT '#C7D2FE';

-- Add a check constraint to ensure background_type is either 'solid' or 'gradient'
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS check_background_type;
ALTER TABLE businesses
ADD CONSTRAINT check_background_type 
CHECK (background_type IN ('solid', 'gradient'));