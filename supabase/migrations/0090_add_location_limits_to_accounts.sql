-- Add location count tracking and limits to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS location_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 0;

-- Update existing accounts based on plan
UPDATE accounts 
SET max_locations = CASE 
    WHEN plan = 'maven' THEN 10
    WHEN plan = 'builder' THEN 0
    WHEN plan = 'grower' THEN 0
    ELSE 0
END;

-- Create function to check location limit before insert
CREATE OR REPLACE FUNCTION check_location_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current location count and max allowed for the account
    SELECT location_count, max_locations INTO current_count, max_allowed
    FROM accounts WHERE id = NEW.account_id;
    
    -- Check if limit would be exceeded
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Location limit exceeded for this account tier. Current: %, Max: %', current_count, max_allowed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce location limits
CREATE TRIGGER enforce_location_limit
    BEFORE INSERT ON business_locations
    FOR EACH ROW EXECUTE FUNCTION check_location_limit();

-- Create function to update location count
CREATE OR REPLACE FUNCTION update_location_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment location count
        UPDATE accounts 
        SET location_count = location_count + 1
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement location count
        UPDATE accounts 
        SET location_count = location_count - 1
        WHERE id = OLD.account_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain location count
CREATE TRIGGER maintain_location_count
    AFTER INSERT OR DELETE ON business_locations
    FOR EACH ROW EXECUTE FUNCTION update_location_count();

-- Update location count for existing accounts (in case any locations exist)
UPDATE accounts a
SET location_count = (
    SELECT COUNT(*) 
    FROM business_locations bl 
    WHERE bl.account_id = a.id
); 