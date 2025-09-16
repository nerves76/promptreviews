-- Create a readable view for account management
CREATE OR REPLACE VIEW account_users_readable AS
SELECT 
    au.account_id,
    au.user_id,
    au.role,
    au.created_at as joined_at,
    -- Get user email from auth.users (requires admin access)
    (SELECT email FROM auth.users WHERE id = au.user_id) as user_email,
    -- Get business info
    b.name as business_name,
    b.business_email,
    b.phone as business_phone
FROM account_users au
LEFT JOIN businesses b ON b.account_id = au.account_id;

-- Create a function to get readable account info (alternative approach)
CREATE OR REPLACE FUNCTION get_account_info(account_uuid UUID)
RETURNS TABLE (
    account_id UUID,
    business_name TEXT,
    user_count BIGINT,
    user_emails TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.account_id,
        b.name as business_name,
        COUNT(au.user_id) as user_count,
        ARRAY_AGG((SELECT email FROM auth.users WHERE id = au.user_id)) as user_emails
    FROM account_users au
    LEFT JOIN businesses b ON b.account_id = au.account_id
    WHERE au.account_id = account_uuid
    GROUP BY au.account_id, b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
