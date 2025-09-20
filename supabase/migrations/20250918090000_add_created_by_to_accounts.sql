-- Add created_by attribution to accounts for auditability and multi-account support

-- 1. Schema changes
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS created_by uuid;

COMMENT ON COLUMN public.accounts.created_by IS 'User who initiated account creation';

-- Add foreign key to auth.users, allow cleanup if user is removed
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS accounts_created_by_fkey;
ALTER TABLE public.accounts
ADD CONSTRAINT accounts_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users (id)
    ON DELETE SET NULL;

-- Helpful index for support tooling
CREATE INDEX IF NOT EXISTS idx_accounts_created_by
    ON public.accounts (created_by);

-- 2. Backfill attribution using the earliest owner for each account when missing
WITH first_owner AS (
    SELECT DISTINCT ON (account_id)
        account_id,
        user_id
    FROM public.account_users
    WHERE role = 'owner'
    ORDER BY account_id, created_at NULLS LAST
)
UPDATE public.accounts AS a
SET created_by = COALESCE(a.created_by, fo.user_id)
FROM first_owner fo
WHERE a.id = fo.account_id
  AND a.created_by IS NULL;

-- 3. Update auth trigger functions to populate created_by for new users
CREATE OR REPLACE FUNCTION handle_new_user_clean()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_exists boolean;
BEGIN
  RAISE LOG 'handle_new_user_clean triggered for user %', NEW.id;

  SELECT EXISTS (
    SELECT 1 FROM public.accounts WHERE id = NEW.id
  ) INTO v_account_exists;

  IF v_account_exists THEN
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
    ) ON CONFLICT (user_id, account_id) DO NOTHING;

    RETURN NEW;
  END IF;

  INSERT INTO public.accounts (
    id,
    email,
    plan,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    user_id,
    first_name,
    last_name,
    is_free_account,
    has_had_paid_plan,
    custom_prompt_page_count,
    contact_count,
    review_notifications_enabled,
    created_by
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'no_plan',
    NULL,
    NULL,
    NOW(),
    NOW(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    false,
    false,
    0,
    0,
    true,
    NEW.id
  ) ON CONFLICT (id) DO NOTHING;

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
  ) ON CONFLICT (user_id, account_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user_clean: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_user_confirmation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      INSERT INTO public.accounts (
        id,
        email,
        plan,
        trial_start,
        trial_end,
        created_at,
        updated_at,
        user_id,
        first_name,
        last_name,
        is_free_account,
        has_had_paid_plan,
        custom_prompt_page_count,
        contact_count,
        review_notifications_enabled,
        created_by
      ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        'no_plan',
        NULL,
        NULL,
        NOW(),
        NOW(),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        false,
        false,
        0,
        0,
        true,
        NEW.id
      ) ON CONFLICT (id) DO NOTHING;

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
      ) ON CONFLICT (user_id, account_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Update ensure_account_user trigger to honour created_by even in service role contexts
CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := NEW.created_by;

    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := NULLIF((current_setting('request.jwt.claims', true)::json->>'sub'), '')::uuid;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    IF v_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (NEW.id, v_user_id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not create account_user: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_account_user_trigger ON accounts;
CREATE TRIGGER ensure_account_user_trigger
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_account_user();

-- 5. Ensure manual RPC aligns with new attribution behaviour
CREATE OR REPLACE FUNCTION create_account_for_user(user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.accounts WHERE id = user_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Account already exists');
  END IF;

  INSERT INTO public.accounts (
    id,
    email,
    plan,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    user_id,
    first_name,
    last_name,
    created_by
  ) VALUES (
    user_id,
    COALESCE(user_record.email, ''),
    'no_plan',
    NULL,
    NULL,
    NOW(),
    NOW(),
    user_id,
    COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
    COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
    user_id
  ) ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = user_id AND account_id = user_id) THEN
    INSERT INTO public.account_users (
      account_id,
      user_id,
      role,
      created_at
    ) VALUES (
      user_id,
      user_id,
      'owner',
      NOW()
    ) ON CONFLICT (account_id, user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'account_id', user_id);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION create_account_for_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_account_for_user(uuid) TO authenticated, service_role;
