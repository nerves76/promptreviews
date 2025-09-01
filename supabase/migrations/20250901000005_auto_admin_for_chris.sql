-- Automatically set admin flag for chris@diviner.agency
-- Date: 2025-09-01
--
-- This migration ensures chris@diviner.agency is automatically granted admin status

-- Update the handle_new_user_account function to check for admin emails
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN := false;
BEGIN
  -- Only proceed if user is confirmed
  IF NEW.confirmed_at IS NOT NULL THEN
    -- Check if this email should be an admin
    IF NEW.email = 'chris@diviner.agency' THEN
      v_is_admin := true;
    END IF;

    -- Check if account already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      -- Create account record
      INSERT INTO public.accounts (
        id,
        email,
        first_name,
        last_name,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count,
        review_notifications_enabled,
        is_admin,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0,
        true,
        v_is_admin,  -- Set admin flag based on email
        NOW(),
        NOW()
      );
    END IF;

    -- Check if account_users record already exists
    IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = NEW.id AND account_id = NEW.id) THEN
      -- Create account_users record
      INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
      ) VALUES (
        NEW.id,
        NEW.id,
        'owner',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update any existing account with chris@diviner.agency email
UPDATE public.accounts 
SET is_admin = true 
WHERE email = 'chris@diviner.agency' 
  AND is_admin = false;

-- Add comment explaining admin auto-assignment
COMMENT ON FUNCTION handle_new_user_account() IS 
'Automatically creates account and account_users records when a new user signs up. Also automatically grants admin status to chris@diviner.agency.';