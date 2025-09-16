-- Create table for storing which GBP locations are selected for management
-- This determines which locations appear in the app and are included in monthly insights
CREATE TABLE IF NOT EXISTS selected_gbp_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, location_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_selected_gbp_locations_account_id ON selected_gbp_locations(account_id);
CREATE INDEX IF NOT EXISTS idx_selected_gbp_locations_user_id ON selected_gbp_locations(user_id);

-- Enable Row Level Security
ALTER TABLE selected_gbp_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for selected_gbp_locations
-- Users can view selected locations for accounts they belong to
CREATE POLICY "Users can view selected locations for their accounts" 
    ON selected_gbp_locations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = selected_gbp_locations.account_id 
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can insert selected locations for accounts they belong to
CREATE POLICY "Users can insert selected locations for their accounts" 
    ON selected_gbp_locations FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = selected_gbp_locations.account_id 
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can update selected locations for accounts they belong to
CREATE POLICY "Users can update selected locations for their accounts" 
    ON selected_gbp_locations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = selected_gbp_locations.account_id 
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can delete selected locations for accounts they belong to
CREATE POLICY "Users can delete selected locations for their accounts" 
    ON selected_gbp_locations FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = selected_gbp_locations.account_id 
            AND account_users.user_id = auth.uid()
        )
    );

-- Add column to track if monthly insights are enabled for this location
ALTER TABLE selected_gbp_locations 
ADD COLUMN IF NOT EXISTS include_in_insights BOOLEAN DEFAULT true;

-- Add column to accounts table to track max allowed GBP locations per plan
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS max_gbp_locations INTEGER DEFAULT 5;

-- Update existing accounts based on their plan
UPDATE accounts 
SET max_gbp_locations = CASE 
    WHEN plan = 'maven' THEN 10
    WHEN plan = 'builder' THEN 5
    WHEN plan = 'starter' THEN 5
    ELSE 0
END
WHERE max_gbp_locations IS NULL;

-- Create a function to check if account has reached location limit
CREATE OR REPLACE FUNCTION check_gbp_location_limit()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE
        location_count INTEGER;
        max_allowed INTEGER;
    BEGIN
        -- Get current count of selected locations for this account
        SELECT COUNT(*) INTO location_count
        FROM selected_gbp_locations
        WHERE account_id = NEW.account_id;
        
        -- Get max allowed locations for this account
        SELECT max_gbp_locations INTO max_allowed
        FROM accounts
        WHERE id = NEW.account_id;
        
        -- Check if limit would be exceeded
        IF location_count >= max_allowed THEN
            RAISE EXCEPTION 'Account has reached maximum GBP locations limit of %', max_allowed;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce location limit
CREATE TRIGGER enforce_gbp_location_limit
    BEFORE INSERT ON selected_gbp_locations
    FOR EACH ROW
    EXECUTE FUNCTION check_gbp_location_limit();

-- Add comment for documentation
COMMENT ON TABLE selected_gbp_locations IS 'Stores which Google Business Profile locations are selected for management per account';
COMMENT ON COLUMN selected_gbp_locations.include_in_insights IS 'Whether this location should be included in monthly insight emails';
COMMENT ON COLUMN accounts.max_gbp_locations IS 'Maximum number of GBP locations allowed based on plan';