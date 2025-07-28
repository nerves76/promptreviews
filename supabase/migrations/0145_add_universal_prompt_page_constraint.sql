-- Add unique constraint to ensure only one universal prompt page per account
-- This prevents the data integrity issue where multiple universal pages could be created

-- First, let's clean up any existing duplicates (keeping the most recent one)
DELETE FROM prompt_pages 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at DESC) as rn
    FROM prompt_pages 
    WHERE is_universal = true
  ) t 
  WHERE rn > 1
);

-- Add unique constraint (PostgreSQL doesn't support WHERE in UNIQUE constraints)
-- Instead, we'll create a unique index
CREATE UNIQUE INDEX unique_universal_per_account 
ON prompt_pages (account_id) 
WHERE is_universal = true;

-- Add comment explaining the index
COMMENT ON INDEX unique_universal_per_account IS 'Ensures only one universal prompt page per account'; 