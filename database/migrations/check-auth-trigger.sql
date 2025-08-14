-- Check if the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'handle_new_user_account';

-- Check for any recent errors in the postgres logs (if accessible)
-- This would show trigger execution errors

-- Test the trigger function manually with dummy data
-- DO $$
-- DECLARE
--     test_user_id uuid := gen_random_uuid();
-- BEGIN
--     -- Simulate what the trigger would do
--     RAISE NOTICE 'Testing trigger with user_id: %', test_user_id;
--     
--     -- Test the insert that the trigger performs
--     INSERT INTO public.accounts (
--         id,
--         email,
--         first_name,
--         last_name,
--         plan,
--         trial_start,
--         trial_end,
--         is_free_account,
--         custom_prompt_page_count,
--         contact_count,
--         review_notifications_enabled,
--         created_at,
--         updated_at
--     ) VALUES (
--         test_user_id,
--         'test@example.com',
--         'Test',
--         'User',
--         'no_plan',
--         NOW(),
--         NOW() + INTERVAL '14 days',
--         false,
--         0,
--         0,
--         true,
--         NOW(),
--         NOW()
--     );
--     
--     -- Clean up
--     DELETE FROM public.accounts WHERE id = test_user_id;
--     
--     RAISE NOTICE 'Test successful!';
-- EXCEPTION
--     WHEN OTHERS THEN
--         RAISE NOTICE 'Error: % %', SQLERRM, SQLSTATE;
-- END $$;