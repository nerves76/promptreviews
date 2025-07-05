-- Temporarily disable the trigger to test the existing approach
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_account(); 