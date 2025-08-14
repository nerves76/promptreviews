-- Fix businesses trigger issue where account_name is being referenced incorrectly
-- This migration ensures that only the correct triggers are attached to the businesses table

-- First, drop any incorrect triggers on businesses table that might reference account_name
DO $$
BEGIN
    -- Drop trigger if it exists and references populate_account_user_fields
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'populate_account_user_fields_trigger'
        AND tgrelid = 'businesses'::regclass
    ) THEN
        DROP TRIGGER populate_account_user_fields_trigger ON businesses;
    END IF;
END $$;

-- Ensure the correct trigger function exists for updating account_users when business name changes
CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update business_name in account_users when business name changes
  -- Do NOT try to update account_name as it doesn't exist in businesses table
  UPDATE account_users
  SET business_name = NEW.name
  WHERE account_id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's properly configured
DROP TRIGGER IF EXISTS update_account_users_business_name_trigger ON businesses;
CREATE TRIGGER update_account_users_business_name_trigger
  AFTER UPDATE OF name ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_account_users_business_name();

-- Ensure the populate_account_user_fields trigger is ONLY on account_users table
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users;
CREATE TRIGGER populate_account_user_fields_trigger
  BEFORE INSERT OR UPDATE ON account_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Add comment for clarity
COMMENT ON FUNCTION trigger_update_account_users_business_name() IS 'Updates business_name in account_users when businesses.name changes';