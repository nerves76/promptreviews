-- Script to identify and analyze duplicate accounts in the database
-- Run this to see what duplicates exist

-- 1. Find accounts with duplicate emails
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as account_ids,
    array_agg(plan ORDER BY created_at) as plans,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM accounts
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC, email;

-- 2. Find if there are multiple accounts per user_id
SELECT 
    user_id,
    COUNT(*) as account_count,
    array_agg(id ORDER BY created_at) as account_ids,
    array_agg(email ORDER BY created_at) as emails,
    array_agg(plan ORDER BY created_at) as plans
FROM accounts
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY account_count DESC;

-- 3. Check account_users for orphaned links
SELECT 
    au.account_id,
    au.user_id,
    a.email as account_email,
    a.plan,
    a.created_at
FROM account_users au
LEFT JOIN accounts a ON a.id = au.account_id
WHERE a.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Summary statistics
SELECT 
    'Total Accounts' as metric,
    COUNT(*) as value
FROM accounts
UNION ALL
SELECT 
    'Unique Emails' as metric,
    COUNT(DISTINCT email) as value
FROM accounts
WHERE email IS NOT NULL AND email != ''
UNION ALL
SELECT 
    'Accounts with user_id' as metric,
    COUNT(*) as value
FROM accounts
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Duplicate Email Groups' as metric,
    COUNT(*) as value
FROM (
    SELECT email
    FROM accounts
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING COUNT(*) > 1
) dup;