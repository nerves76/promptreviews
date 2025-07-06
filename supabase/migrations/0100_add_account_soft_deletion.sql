-- Add soft deletion functionality for accounts
-- This enables 90-day retention policy for cancelled accounts

-- Add deleted_at column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance when querying deleted accounts
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at ON accounts(deleted_at);

-- Create composite index for cleanup queries (deleted accounts older than X days)
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_cleanup ON accounts(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.deleted_at IS '90-day retention: When account was cancelled/deleted. NULL = active account';

-- Create function to get accounts eligible for permanent deletion
CREATE OR REPLACE FUNCTION get_accounts_eligible_for_deletion(retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
    account_id UUID,
    email TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    days_since_deletion INTEGER,
    business_count INTEGER,
    user_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.email,
        a.deleted_at,
        EXTRACT(days FROM (NOW() - a.deleted_at))::INTEGER as days_since_deletion,
        (SELECT COUNT(*) FROM businesses b WHERE b.account_id = a.id)::INTEGER as business_count,
        (SELECT COUNT(*) FROM account_users au WHERE au.account_id = a.id)::INTEGER as user_count
    FROM accounts a
    WHERE a.deleted_at IS NOT NULL 
    AND a.deleted_at < (NOW() - (retention_days || ' days')::INTERVAL)
    ORDER BY a.deleted_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to count accounts eligible for deletion
CREATE OR REPLACE FUNCTION count_accounts_eligible_for_deletion(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM accounts 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < (NOW() - (retention_days || ' days')::INTERVAL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins will check this)
GRANT EXECUTE ON FUNCTION get_accounts_eligible_for_deletion(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION count_accounts_eligible_for_deletion(INTEGER) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_accounts_eligible_for_deletion(INTEGER) IS 'Returns accounts that can be permanently deleted (deleted > retention_days ago)';
COMMENT ON FUNCTION count_accounts_eligible_for_deletion(INTEGER) IS 'Returns count of accounts eligible for permanent deletion'; 