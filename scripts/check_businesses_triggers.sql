-- Check all triggers on the businesses table
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'businesses'::regclass
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Check if there are any functions that reference account_name in context of businesses
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) LIKE '%businesses%'
AND pg_get_functiondef(p.oid) LIKE '%account_name%'
ORDER BY p.proname;

-- Check the specific function that's likely causing the issue
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'trigger_populate_account_user_fields';

-- List all triggers that use the populate_account_user_fields function
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'trigger_populate_account_user_fields'
ORDER BY c.relname, t.tgname;