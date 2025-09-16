-- Add readable columns to account_users table
ALTER TABLE account_users 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Create function to populate user_email and business_name
CREATE OR REPLACE FUNCTION populate_account_users_readable_fields()
RETURNS void AS $$
BEGIN
  -- Update user_email from auth.users
  UPDATE account_users 
  SET user_email = auth_users.email
  FROM auth.users auth_users
  WHERE account_users.user_id = auth_users.id
  AND account_users.user_email IS NULL;
  
  -- Update business_name from businesses table
  UPDATE account_users 
  SET business_name = b.name
  FROM businesses b
  WHERE account_users.account_id = b.account_id
  AND account_users.business_name IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to auto-populate on INSERT
CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user email from auth.users
  SELECT email INTO NEW.user_email
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Get business name from businesses table
  SELECT name INTO NEW.business_name
  FROM businesses 
  WHERE account_id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-populate on INSERT
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users;
CREATE TRIGGER populate_account_user_fields_trigger
  BEFORE INSERT ON account_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Create trigger function to update when businesses table changes
CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update business_name in account_users when business name changes
  UPDATE account_users 
  SET business_name = NEW.name
  WHERE account_id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on businesses table to keep business_name in sync
DROP TRIGGER IF EXISTS update_account_users_business_name_trigger ON businesses;
CREATE TRIGGER update_account_users_business_name_trigger
  AFTER UPDATE OF name ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_account_users_business_name();

-- Populate existing records
SELECT populate_account_users_readable_fields();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_users_user_email ON account_users(user_email);
CREATE INDEX IF NOT EXISTS idx_account_users_business_name ON account_users(business_name);

-- Add helpful comment
COMMENT ON COLUMN account_users.user_email IS 'Auto-populated from auth.users.email for easier admin viewing';
COMMENT ON COLUMN account_users.business_name IS 'Auto-populated from businesses.name for easier admin viewing';
