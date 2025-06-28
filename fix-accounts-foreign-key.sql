-- Fix Accounts Table Foreign Key Constraint
-- 
-- This script removes the foreign key constraint from accounts.id to users.id
-- since the users table doesn't exist and users are stored in auth.users (Supabase Auth)

-- First, let's check what foreign key constraints exist on the accounts table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='accounts';

-- Remove the foreign key constraint (replace 'accounts_id_fkey' with the actual constraint name)
-- ALTER TABLE accounts DROP CONSTRAINT accounts_id_fkey;

-- Alternative: Drop and recreate the accounts table without the foreign key constraint
-- This is a more comprehensive fix

-- First, let's see the current table structure
\d accounts;

-- Create a new accounts table without the foreign key constraint
CREATE TABLE accounts_new (
    id UUID PRIMARY KEY,
    business_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan TEXT DEFAULT 'NULL',
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    custom_prompt_page_count INTEGER NOT NULL DEFAULT 0,
    contact_count INTEGER NOT NULL DEFAULT 0,
    first_name TEXT,
    last_name TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    is_free_account BOOLEAN DEFAULT FALSE,
    has_had_paid_plan BOOLEAN NOT NULL DEFAULT FALSE,
    email TEXT,
    plan_lookup_key TEXT,
    review_notifications_enabled BOOLEAN DEFAULT TRUE,
    user_id UUID
);

-- Copy data from old table to new table (if any data exists)
INSERT INTO accounts_new SELECT * FROM accounts;

-- Drop the old table
DROP TABLE accounts;

-- Rename the new table to the original name
ALTER TABLE accounts_new RENAME TO accounts;

-- Recreate any indexes that were on the original table
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Grant permissions
GRANT ALL ON accounts TO authenticated;
GRANT ALL ON accounts TO anon;
GRANT ALL ON accounts TO service_role;

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (adjust as needed for your security requirements)
CREATE POLICY "Users can view their own account" ON accounts
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own account" ON accounts
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own account" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the fix
\d accounts; 