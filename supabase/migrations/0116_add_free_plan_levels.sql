-- Add free_plan_level column to accounts table
-- This allows setting free accounts to specific plan levels (grower, builder, maven)

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS free_plan_level TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.accounts.free_plan_level IS 'The plan level for free accounts (grower, builder, maven). When is_free_account is true, this determines the feature limits.';

-- Update existing free accounts to have a default plan level
UPDATE public.accounts 
SET free_plan_level = 'grower' 
WHERE is_free_account = true AND free_plan_level IS NULL; 