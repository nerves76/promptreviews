-- Update user count function to exclude agency roles (like support role)
-- Agency managers don't count toward a client's max_users limit

CREATE OR REPLACE FUNCTION get_account_user_count(account_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM account_users
  WHERE account_users.account_id = account_uuid
  -- Exclude roles that don't count toward user limits
  AND account_users.role NOT IN ('support', 'agency_manager', 'agency_billing_manager');

  RETURN user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_account_user_count(UUID) IS
  'Returns count of billable users for an account. Excludes support and agency roles which don''t count toward max_users limit.';
