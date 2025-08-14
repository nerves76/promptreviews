-- Create a readable view of account users with email and business info
CREATE OR REPLACE VIEW account_users_readable AS
SELECT 
    au.account_id,
    au.user_id,
    au.role,
    au.created_at as joined_at,
    (SELECT email FROM auth.users WHERE id = au.user_id) as user_email,
    b.name as business_name,
    b.email as business_email
FROM account_users au
LEFT JOIN businesses b ON b.account_id = au.account_id;
