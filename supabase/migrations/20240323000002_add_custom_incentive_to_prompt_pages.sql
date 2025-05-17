-- Add custom_incentive column to prompt_pages table
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS custom_incentive TEXT; 