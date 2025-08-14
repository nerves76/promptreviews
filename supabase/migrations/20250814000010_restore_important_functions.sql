-- Restore important functions that were accidentally dropped
-- These are NOT auth functions and don't have GRANT to postgres

-- 1. Updated_at trigger function (commonly used for timestamps)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Account users readable fields function
CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate readable fields from accounts table
  SELECT 
    COALESCE(a.first_name || ' ' || a.last_name, a.email) as account_name,
    a.email as account_email,
    a.first_name,
    a.last_name,
    b.name as business_name
  INTO 
    NEW.account_name,
    NEW.account_email,
    NEW.first_name,
    NEW.last_name,
    NEW.business_name
  FROM accounts a
  LEFT JOIN businesses b ON b.account_id = a.id
  WHERE a.id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for account_users
CREATE TRIGGER populate_account_user_fields_trigger
BEFORE INSERT OR UPDATE ON account_users
FOR EACH ROW
EXECUTE FUNCTION trigger_populate_account_user_fields();

-- 3. Update account users business name
CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update account_users when business name changes
  UPDATE account_users
  SET business_name = NEW.name
  WHERE account_id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for businesses
CREATE TRIGGER update_account_users_business_name_trigger
AFTER UPDATE OF name ON businesses
FOR EACH ROW
EXECUTE FUNCTION trigger_update_account_users_business_name();

-- 4. Account invitations updated_at
CREATE OR REPLACE FUNCTION update_account_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for account_invitations
CREATE TRIGGER trigger_account_invitations_updated_at
BEFORE UPDATE ON account_invitations
FOR EACH ROW
EXECUTE FUNCTION update_account_invitations_updated_at();

-- 5. Ensure account user function (without bad permissions)
CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure there's always at least one owner for an account
  IF NOT EXISTS (
    SELECT 1 FROM account_users 
    WHERE account_id = NEW.id 
    AND role = 'owner'
  ) THEN
    INSERT INTO account_users (account_id, user_id, role, created_at)
    VALUES (NEW.id, NEW.user_id, 'owner', NOW())
    ON CONFLICT (account_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for accounts
CREATE TRIGGER ensure_account_user_trigger
AFTER INSERT ON accounts
FOR EACH ROW
EXECUTE FUNCTION ensure_account_user();

-- 6. Get current user ID (utility function)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Get account info (utility function)
CREATE OR REPLACE FUNCTION get_account_info(account_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.business_name, a.first_name || ' ' || a.last_name) as name,
    a.email,
    a.plan
  FROM accounts a
  WHERE a.id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get account user count
CREATE OR REPLACE FUNCTION get_account_user_count(account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM account_users
  WHERE account_users.account_id = $1;
  
  RETURN user_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Check if current user owns account
CREATE OR REPLACE FUNCTION current_user_owns_account(account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_users
    WHERE account_users.account_id = $1
    AND account_users.user_id = auth.uid()
    AND account_users.role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Can add user to account
CREATE OR REPLACE FUNCTION can_add_user_to_account(account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_users
    WHERE account_users.account_id = $1
    AND account_users.user_id = auth.uid()
    AND account_users.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate updated_at triggers for important tables
CREATE TRIGGER handle_updated_at_accounts
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_businesses
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_prompt_pages
BEFORE UPDATE ON prompt_pages
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Grant necessary permissions (NO postgres role!)
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_user_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_owns_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_add_user_to_account(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION handle_updated_at() IS 'Updates updated_at timestamp on row modification';
COMMENT ON FUNCTION ensure_account_user() IS 'Ensures account has at least one owner';
COMMENT ON FUNCTION get_current_user_id() IS 'Returns the current authenticated user ID';