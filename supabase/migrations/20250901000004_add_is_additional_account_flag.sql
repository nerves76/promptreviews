-- Add flag to distinguish additional accounts from regular accounts
-- Date: 2025-09-01
--
-- This migration adds a flag to track additional accounts created by users
-- This helps distinguish them from regular accounts for trial and offer logic

-- Add is_additional_account column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS is_additional_account BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.accounts.is_additional_account IS 
'True if this account was created as an additional account by an existing user. These accounts are not eligible for free trials or comeback offers.';