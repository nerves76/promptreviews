-- Restore additional functions that are actively used in the codebase

-- 1. Functions for account cleanup/deletion (used in /api/admin/account-cleanup)
CREATE OR REPLACE FUNCTION get_accounts_eligible_for_deletion(retention_days INTEGER DEFAULT 90)
RETURNS TABLE(
  id UUID,
  email TEXT,
  deleted_at TIMESTAMPTZ,
  days_since_deletion INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.deleted_at,
    EXTRACT(DAY FROM NOW() - a.deleted_at)::INTEGER as days_since_deletion
  FROM accounts a
  WHERE a.deleted_at IS NOT NULL
    AND a.deleted_at < NOW() - (retention_days || ' days')::INTERVAL
  ORDER BY a.deleted_at;
END;
$$;

CREATE OR REPLACE FUNCTION count_accounts_eligible_for_deletion(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO account_count
  FROM accounts a
  WHERE a.deleted_at IS NOT NULL
    AND a.deleted_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  RETURN account_count;
END;
$$;

-- 2. Account reactivation function (used by reactivation feature)
CREATE OR REPLACE FUNCTION check_account_reactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- If account is being reactivated (deleted_at being set to NULL)
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    -- Update the reactivated_at timestamp
    NEW.reactivated_at = NOW();
    
    -- Reset trial if this is the first reactivation
    IF OLD.reactivated_at IS NULL THEN
      NEW.trial_start = NOW();
      NEW.trial_end = NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger for account reactivation
DROP TRIGGER IF EXISTS check_account_reactivation_trigger ON accounts;
CREATE TRIGGER check_account_reactivation_trigger
BEFORE UPDATE ON accounts
FOR EACH ROW
WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE FUNCTION check_account_reactivation();

-- 3. Populate account users readable fields (may be used by triggers)
CREATE OR REPLACE FUNCTION populate_account_users_readable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Get account info
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

-- Grant necessary permissions (NO postgres role!)
GRANT EXECUTE ON FUNCTION get_accounts_eligible_for_deletion(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION count_accounts_eligible_for_deletion(INTEGER) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_accounts_eligible_for_deletion(INTEGER) IS 'Gets accounts eligible for permanent deletion after retention period';
COMMENT ON FUNCTION count_accounts_eligible_for_deletion(INTEGER) IS 'Counts accounts eligible for permanent deletion';
COMMENT ON FUNCTION check_account_reactivation() IS 'Handles account reactivation logic';
COMMENT ON FUNCTION populate_account_users_readable_fields() IS 'Populates readable fields in account_users table';