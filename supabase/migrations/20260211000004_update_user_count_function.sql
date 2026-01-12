-- Update user count function to exclude agency roles (like support role)
-- Agency managers don't count toward a client's max_users limit

-- Drop and recreate to change the function body
DROP FUNCTION IF EXISTS get_account_user_count(UUID);

CREATE FUNCTION get_account_user_count(account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM account_users au
  WHERE au.account_id = get_account_user_count.account_id
  -- Exclude roles that don't count toward user limits
  AND au.role NOT IN ('support', 'agency_manager', 'agency_billing_manager');

  RETURN user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_account_user_count(UUID) IS
  'Returns count of billable users for an account. Excludes support and agency roles which don''t count toward max_users limit.';
