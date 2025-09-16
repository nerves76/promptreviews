-- Add promotion_code column to accounts table
-- This captures promotion codes during business creation for tracking marketing campaigns

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS promotion_code TEXT;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_accounts_promotion_code ON accounts(promotion_code) 
WHERE promotion_code IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.accounts.promotion_code IS 'Promotion code entered during account creation for tracking marketing campaigns and partnerships'; 