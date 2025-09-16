-- Add notification settings columns with default true values
-- These columns control email notifications and GBP insights visibility

-- Add email_review_notifications column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'email_review_notifications'
    ) THEN
        ALTER TABLE accounts 
        ADD COLUMN email_review_notifications BOOLEAN DEFAULT true;
        
        -- Set existing accounts to true
        UPDATE accounts 
        SET email_review_notifications = true 
        WHERE email_review_notifications IS NULL;
    END IF;
END $$;

-- Add gbp_insights_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'gbp_insights_enabled'
    ) THEN
        ALTER TABLE accounts 
        ADD COLUMN gbp_insights_enabled BOOLEAN DEFAULT true;
        
        -- Set existing accounts to true
        UPDATE accounts 
        SET gbp_insights_enabled = true 
        WHERE gbp_insights_enabled IS NULL;
    END IF;
END $$;

-- Ensure defaults are set to true for future records
ALTER TABLE accounts 
ALTER COLUMN email_review_notifications SET DEFAULT true;

ALTER TABLE accounts 
ALTER COLUMN gbp_insights_enabled SET DEFAULT true;

-- Update any NULL values to true
UPDATE accounts 
SET email_review_notifications = true 
WHERE email_review_notifications IS NULL;

UPDATE accounts 
SET gbp_insights_enabled = true 
WHERE gbp_insights_enabled IS NULL;