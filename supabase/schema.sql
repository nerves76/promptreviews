

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'Fixed account-business-user relationships after function restoration';



CREATE TYPE "public"."activity_type" AS ENUM (
    'email',
    'sms',
    'status_change',
    'note',
    'manual'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."google_business_scheduled_post_kind" AS ENUM (
    'post',
    'photo'
);


ALTER TYPE "public"."google_business_scheduled_post_kind" OWNER TO "postgres";


CREATE TYPE "public"."google_business_scheduled_post_result_status" AS ENUM (
    'pending',
    'processing',
    'success',
    'failed'
);


ALTER TYPE "public"."google_business_scheduled_post_result_status" OWNER TO "postgres";


CREATE TYPE "public"."google_business_scheduled_post_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'partial_success',
    'failed',
    'cancelled',
    'draft'
);


ALTER TYPE "public"."google_business_scheduled_post_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'gbp_change_detected',
    'new_review_received',
    'team_invitation',
    'subscription_update',
    'system_announcement',
    'review_auto_verified'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."prompt_page_campaign_type" AS ENUM (
    'public',
    'individual',
    'universal',
    'location'
);


ALTER TYPE "public"."prompt_page_campaign_type" OWNER TO "postgres";


CREATE TYPE "public"."prompt_page_status" AS ENUM (
    'in_queue',
    'sent',
    'follow_up',
    'in_progress',
    'complete',
    'draft'
);


ALTER TYPE "public"."prompt_page_status" OWNER TO "postgres";


CREATE TYPE "public"."prompt_page_type" AS ENUM (
    'universal',
    'photo',
    'product',
    'service',
    'video',
    'event',
    'employee',
    'custom',
    'individual'
);


ALTER TYPE "public"."prompt_page_type" OWNER TO "postgres";


CREATE TYPE "public"."prompt_page_visibility" AS ENUM (
    'public',
    'individual'
);


ALTER TYPE "public"."prompt_page_visibility" OWNER TO "postgres";


CREATE TYPE "public"."review_source_channel" AS ENUM (
    'prompt_page_direct',
    'prompt_page_qr',
    'email_campaign',
    'sms_campaign',
    'widget_cta',
    'gbp_import',
    'social_share',
    'referral',
    'unknown',
    'csv_upload'
);


ALTER TYPE "public"."review_source_channel" OWNER TO "postgres";


CREATE TYPE "public"."share_platform" AS ENUM (
    'facebook',
    'linkedin',
    'twitter',
    'bluesky',
    'reddit',
    'pinterest',
    'email',
    'text',
    'copy_link',
    'sms'
);


ALTER TYPE "public"."share_platform" OWNER TO "postgres";


COMMENT ON TYPE "public"."share_platform" IS 'Social platforms for sharing reviews. Active platforms: facebook, linkedin, twitter, bluesky, reddit, pinterest, email, sms. Legacy values (text, copy_link) are deprecated and should not be used.';



CREATE TYPE "public"."social_connection_status" AS ENUM (
    'active',
    'expired',
    'disconnected',
    'error'
);


ALTER TYPE "public"."social_connection_status" OWNER TO "postgres";


CREATE TYPE "public"."social_platform_type" AS ENUM (
    'bluesky',
    'twitter',
    'slack'
);


ALTER TYPE "public"."social_platform_type" OWNER TO "postgres";


CREATE TYPE "public"."wm_action_type" AS ENUM (
    'note',
    'status_change',
    'assignment_change',
    'priority_change',
    'due_date_change',
    'created',
    'updated'
);


ALTER TYPE "public"."wm_action_type" OWNER TO "postgres";


CREATE TYPE "public"."wm_task_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."wm_task_priority" OWNER TO "postgres";


CREATE TYPE "public"."wm_task_status" AS ENUM (
    'backlog',
    'todo',
    'in_progress',
    'review',
    'done'
);


ALTER TYPE "public"."wm_task_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_populate_review_submission_account_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Auto-populate account_id from the associated prompt_page
    IF NEW.prompt_page_id IS NOT NULL AND (NEW.account_id IS NULL OR TG_OP = 'UPDATE') THEN
        SELECT account_id INTO NEW.account_id
        FROM public.prompt_pages
        WHERE id = NEW.prompt_page_id;
    -- If no prompt_page_id but has business_id, use business.account_id
    ELSIF NEW.prompt_page_id IS NULL AND NEW.business_id IS NOT NULL AND NEW.account_id IS NULL THEN
        SELECT account_id INTO NEW.account_id
        FROM public.businesses
        WHERE id = NEW.business_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_populate_review_submission_account_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_populate_review_submission_account_id"() IS 'Automatically populates account_id from the associated prompt_page to ensure proper account isolation';



CREATE OR REPLACE FUNCTION "public"."auto_populate_review_submission_business_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.business_id IS NULL THEN
        IF NEW.prompt_page_id IS NOT NULL THEN
            SELECT account_id INTO NEW.business_id
            FROM public.prompt_pages
            WHERE id = NEW.prompt_page_id;
        ELSIF NEW.account_id IS NOT NULL THEN
            NEW.business_id := NEW.account_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_populate_review_submission_business_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."build_nav_node"("node_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  node_data record;
  children_array jsonb;
BEGIN
  -- Get node data
  SELECT id, title, href, icon_name, order_index
  INTO node_data
  FROM navigation
  WHERE id = node_id AND is_active = true;

  -- If node doesn't exist, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get children recursively
  SELECT COALESCE(jsonb_agg(build_nav_node(id) ORDER BY order_index), '[]'::jsonb)
  INTO children_array
  FROM navigation
  WHERE parent_id = node_id AND is_active = true;

  -- Build and return the node
  RETURN jsonb_build_object(
    'id', node_data.id::text,
    'title', node_data.title,
    'href', node_data.href,
    'icon', node_data.icon_name,
    'children', children_array
  );
END;
$$;


ALTER FUNCTION "public"."build_nav_node"("node_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."build_nav_node"("node_id" "uuid") IS 'Helper function that recursively builds a navigation node with all its nested children.';



CREATE OR REPLACE FUNCTION "public"."calculate_llm_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone DEFAULT "now"()) RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_target_hour INTEGER;
  v_current_dow INTEGER;
  v_current_dom INTEGER;
  v_days_to_add INTEGER;
BEGIN
  v_target_hour := COALESCE(p_hour, 9);

  CASE p_frequency
    WHEN 'daily' THEN
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      v_current_dom := EXTRACT(DAY FROM p_from_time)::INTEGER;
      v_next := DATE_TRUNC('month', p_from_time) + ((COALESCE(p_day_of_month, 1) - 1) || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 month';
      END IF;

    ELSE
      v_next := NULL;
  END CASE;

  RETURN v_next;
END;
$$;


ALTER FUNCTION "public"."calculate_llm_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_next_scheduled_at"("p_frequency" character varying, "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone DEFAULT "now"()) RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_target_hour INTEGER;
  v_current_dow INTEGER;
  v_current_dom INTEGER;
  v_days_to_add INTEGER;
BEGIN
  v_target_hour := COALESCE(p_hour, 9);

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next occurrence at target hour
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      -- Next occurrence on target day of week at target hour
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Next occurrence on target day of month at target hour
      v_current_dom := EXTRACT(DAY FROM p_from_time)::INTEGER;
      v_next := DATE_TRUNC('month', p_from_time) + ((COALESCE(p_day_of_month, 1) - 1) || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 month';
      END IF;

    ELSE
      v_next := NULL;
  END CASE;

  RETURN v_next;
END;
$$;


ALTER FUNCTION "public"."calculate_next_scheduled_at"("p_frequency" character varying, "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_rank_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone DEFAULT "now"()) RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_target_hour INTEGER;
  v_current_dow INTEGER;
  v_current_dom INTEGER;
  v_days_to_add INTEGER;
BEGIN
  v_target_hour := COALESCE(p_hour, 9);

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next occurrence at target hour
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      -- Next occurrence on target day of week at target hour
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Next occurrence on target day of month at target hour
      v_current_dom := EXTRACT(DAY FROM p_from_time)::INTEGER;
      v_next := DATE_TRUNC('month', p_from_time) + ((COALESCE(p_day_of_month, 1) - 1) || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 month';
      END IF;

    ELSE
      v_next := NULL;
  END CASE;

  RETURN v_next;
END;
$$;


ALTER FUNCTION "public"."calculate_rank_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_add_user_to_account"("account_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get the current user count for the account
  SELECT get_account_user_count(account_uuid) INTO current_count;

  -- Get the max users allowed for the account
  SELECT max_users INTO max_allowed
  FROM accounts
  WHERE id = account_uuid;

  -- If account not found, return false
  IF max_allowed IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if we can add more users
  RETURN current_count < max_allowed;
END;
$$;


ALTER FUNCTION "public"."can_add_user_to_account"("account_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_account_reactivation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If account is being reactivated (deleted_at being set to NULL)
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    -- Update the reactivated_at timestamp
    NEW.reactivated_at = NOW();
    
    -- Reset trial if this is the first reactivation
    IF OLD.reactivated_at IS NULL THEN
      NEW.trial_start = NOW();
      NEW.trial_end = NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_account_reactivation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_account_reactivation"() IS 'Handles account reactivation logic';



CREATE OR REPLACE FUNCTION "public"."check_daily_submission_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    daily_count INTEGER;
    max_daily_submissions INTEGER := 50; -- Max 50 scores per IP per day
BEGIN
    -- Only check if IP address is provided
    IF NEW.ip_address IS NOT NULL THEN
        -- Count submissions from this IP in last 24 hours
        SELECT COUNT(*)
        INTO daily_count
        FROM game_scores
        WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '24 hours';

        -- Enforce daily limit
        IF daily_count >= max_daily_submissions THEN
            RAISE EXCEPTION 'Daily submission limit exceeded. Maximum % submissions per 24 hours.',
                max_daily_submissions
                USING ERRCODE = '23P01';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_daily_submission_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_game_score_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    recent_count INTEGER;
    rate_limit_window INTERVAL := '5 minutes';
    max_submissions INTEGER := 10;
BEGIN
    -- Only check if IP address is provided
    IF NEW.ip_address IS NOT NULL THEN
        -- Count recent submissions from this IP
        SELECT COUNT(*)
        INTO recent_count
        FROM game_scores
        WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - rate_limit_window;

        -- Enforce rate limit
        IF recent_count >= max_submissions THEN
            RAISE EXCEPTION 'Rate limit exceeded. Maximum % submissions per % minutes.',
                max_submissions, EXTRACT(EPOCH FROM rate_limit_window)/60
                USING ERRCODE = '23P01'; -- check_violation
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_game_score_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_gbp_location_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DECLARE
        location_count INTEGER;
        max_allowed INTEGER;
    BEGIN
        -- Get current count of selected locations for this account
        SELECT COUNT(*) INTO location_count
        FROM selected_gbp_locations
        WHERE account_id = NEW.account_id;
        
        -- Get max allowed locations for this account
        SELECT max_gbp_locations INTO max_allowed
        FROM accounts
        WHERE id = NEW.account_id;
        
        -- Check if limit would be exceeded
        IF location_count >= max_allowed THEN
            RAISE EXCEPTION 'Account has reached maximum GBP locations limit of %', max_allowed;
        END IF;
        
        RETURN NEW;
    END;
END;
$$;


ALTER FUNCTION "public"."check_gbp_location_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_location_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current location count and max allowed for the account
    SELECT location_count, max_locations INTO current_count, max_allowed
    FROM accounts WHERE id = NEW.account_id;
    
    -- Check if limit would be exceeded
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Location limit exceeded for this account tier. Current: %, Max: %', current_count, max_allowed;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_location_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications that are:
  -- 1. Older than 30 days AND (read OR dismissed)
  -- 2. OR older than 90 days (regardless of read status)
  WITH deleted AS (
    DELETE FROM notifications
    WHERE
      (created_at < NOW() - INTERVAL '30 days' AND (read = true OR dismissed = true))
      OR created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  account_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO account_count
  FROM accounts a
  WHERE a.deleted_at IS NOT NULL
    AND a.deleted_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  RETURN account_count;
END;
$$;


ALTER FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer) IS 'Counts accounts eligible for permanent deletion';



CREATE OR REPLACE FUNCTION "public"."create_account_for_user"("user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
$$;


ALTER FUNCTION "public"."create_account_for_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_additional_account"("p_user_id" "uuid", "p_account_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_new_account_id uuid;
    v_user_email text;
    v_user_first_name text;
    v_user_last_name text;
BEGIN
    -- Get user details
    SELECT email, raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name'
    INTO v_user_email, v_user_first_name, v_user_last_name
    FROM auth.users
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;
    
    -- Generate random UUID for additional account
    v_new_account_id := gen_random_uuid();
    
    -- Create the additional account
    INSERT INTO public.accounts (
        id,
        email,
        user_id,
        first_name,
        last_name,
        plan,
        is_free_account,
        has_had_paid_plan,
        created_at,
        updated_at
    ) VALUES (
        v_new_account_id,
        v_user_email,
        p_user_id,
        COALESCE(p_account_name, v_user_first_name || ' ' || v_user_last_name || ' (Additional)'),
        v_user_last_name,
        'no_plan',
        false,
        false,
        NOW(),
        NOW()
    );
    
    -- Create account_users link
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        v_new_account_id,
        p_user_id,
        'owner',
        NOW()
    );
    
    RETURN v_new_account_id;
END;
$$;


ALTER FUNCTION "public"."create_additional_account"("p_user_id" "uuid", "p_account_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_article_revision"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create revision if content or metadata actually changed
    IF OLD.content IS DISTINCT FROM NEW.content OR
       OLD.metadata IS DISTINCT FROM NEW.metadata THEN
        INSERT INTO article_revisions (article_id, content, metadata, editor_id)
        VALUES (OLD.id, OLD.content, OLD.metadata, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_article_revision"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO notification_preferences (account_id)
  VALUES (NEW.id)
  ON CONFLICT (account_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_username TEXT;
    v_user_id UUID;
    v_count INT := 0;
BEGIN
    -- Create mention record for each valid user
    FOREACH v_username IN ARRAY p_mentioned_usernames
    LOOP
        -- Get user_id for username
        SELECT user_id INTO v_user_id
        FROM community_profiles
        WHERE username = v_username
        AND opted_in_at IS NOT NULL; -- Only notify opted-in users

        -- Skip if not found or self-mention
        IF v_user_id IS NULL OR v_user_id = p_author_id THEN
            CONTINUE;
        END IF;

        -- Insert mention (ON CONFLICT DO NOTHING prevents duplicates)
        INSERT INTO mentions (source_type, source_id, mentioned_user_id, author_id)
        VALUES (p_source_type, p_source_id, v_user_id, p_author_id)
        ON CONFLICT DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) IS 'Creates mention notification records for array of usernames';



CREATE OR REPLACE FUNCTION "public"."current_user_owns_account"("account_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_users
    WHERE account_users.account_id = $1
    AND account_users.user_id = auth.uid()
    AND account_users.role = 'owner'
  );
END;
$_$;


ALTER FUNCTION "public"."current_user_owns_account"("account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_account_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Prefer created_by field if explicitly set
    v_user_id := NEW.created_by;

    -- If no created_by, try to get authenticated user
    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            -- auth.uid() not available in this context
            v_user_id := NULL;
        END;
    END IF;

    -- If we have a user ID, create the account_user link
    IF v_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (NEW.id, v_user_id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- Log warning but don't fail the trigger
            RAISE WARNING 'Could not create account_user link: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_account_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ensure_account_user"() IS 'Ensures account has at least one owner';



CREATE OR REPLACE FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_slug TEXT;
    slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert business name to slug
    base_slug := LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    slug := base_slug;

    -- Check if slug exists and append number if needed
    WHILE EXISTS (
        SELECT 1 FROM public.prompt_pages 
        WHERE slug = slug 
        AND (existing_id IS NULL OR id != existing_id)
    ) LOOP
        slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_username"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_first_name TEXT;
    v_email TEXT;
    v_username TEXT;
    v_hash TEXT;
    v_attempt INT := 0;
    v_max_attempts INT := 5;
BEGIN
    -- Get user's first name and email from auth.users
    SELECT
        COALESCE(
            (raw_user_meta_data->>'first_name'),
            (raw_user_meta_data->>'firstName'),
            split_part(email, '@', 1)
        ),
        email
    INTO v_first_name, v_email
    FROM auth.users
    WHERE id = p_user_id;

    -- Fallback if no data found
    IF v_first_name IS NULL THEN
        v_first_name := 'user';
    END IF;

    -- Normalize first name: lowercase, remove non-alphanumeric, max 12 chars
    v_first_name := lower(regexp_replace(v_first_name, '[^a-z0-9]', '', 'g'));
    v_first_name := left(v_first_name, 12);

    -- If empty after normalization, use 'user'
    IF v_first_name = '' THEN
        v_first_name := 'user';
    END IF;

    -- Try to generate unique username
    WHILE v_attempt < v_max_attempts LOOP
        -- Generate 4-char hash from user_id + attempt + random
        v_hash := left(
            lower(
                encode(
                    digest(p_user_id::text || v_attempt::text || random()::text, 'sha256'),
                    'hex'
                )
            ),
            4
        );

        -- Combine firstname-hash
        v_username := v_first_name || '-' || v_hash;

        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM community_profiles WHERE username = v_username) THEN
            RETURN v_username;
        END IF;

        v_attempt := v_attempt + 1;
    END LOOP;

    -- If all attempts failed, raise error
    RAISE EXCEPTION 'Failed to generate unique username after % attempts for user %', v_max_attempts, p_user_id;
END;
$$;


ALTER FUNCTION "public"."generate_username"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_username"("p_user_id" "uuid") IS 'Generates unique username in format: firstname-hash (e.g., alex-7h3n)';



CREATE OR REPLACE FUNCTION "public"."get_account_info"("account_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "email" "text", "plan" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.business_name, a.first_name || ' ' || a.last_name) as name,
    a.email,
    a.plan
  FROM accounts a
  WHERE a.id = account_id;
END;
$$;


ALTER FUNCTION "public"."get_account_info"("account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_user_count"("account_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM account_users
  WHERE account_users.account_id = $1;
  
  RETURN user_count;
END;
$_$;


ALTER FUNCTION "public"."get_account_user_count"("account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer DEFAULT 90) RETURNS TABLE("id" "uuid", "email" "text", "deleted_at" timestamp with time zone, "days_since_deletion" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.deleted_at,
    EXTRACT(DAY FROM NOW() - a.deleted_at)::INTEGER as days_since_deletion
  FROM accounts a
  WHERE a.deleted_at IS NOT NULL
    AND a.deleted_at < NOW() - (retention_days || ' days')::INTERVAL
  ORDER BY a.deleted_at;
END;
$$;


ALTER FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer) IS 'Gets accounts eligible for permanent deletion after retention period';



CREATE OR REPLACE FUNCTION "public"."get_active_sessions"() RETURNS TABLE("user_id" "uuid", "email" "text", "last_sign_in" timestamp with time zone, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.last_sign_in_at,
        au.created_at
    FROM auth.users au
    WHERE au.confirmed_at IS NOT NULL
    ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_active_sessions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_sessions"() IS 'Returns active user sessions for debugging session issues';



CREATE OR REPLACE FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_event_category" "text" DEFAULT NULL::"text", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" "uuid", "user_id" "uuid", "event_type" "text", "event_category" "text", "resource_type" "text", "resource_id" "uuid", "details" "jsonb", "ip_address" "inet", "user_agent" "text", "success" boolean, "error_message" "text", "created_at" timestamp with time zone, "user_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.event_type,
    al.event_category,
    al.resource_type,
    al.resource_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.success,
    al.error_message,
    al.created_at,
    au.email as user_email
  FROM audit_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE al.account_id = p_account_id
    AND (p_event_category IS NULL OR al.event_category = p_event_category)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer, "p_offset" integer, "p_event_category" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer, "p_offset" integer, "p_event_category" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) IS 'Retrieves audit logs for an account with filtering and pagination';



CREATE OR REPLACE FUNCTION "public"."get_comparison_table_data"("table_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  result jsonb;
  table_record comparison_tables%ROWTYPE;
BEGIN
  -- Get the table configuration
  SELECT * INTO table_record
  FROM comparison_tables
  WHERE slug = table_slug AND status = 'published';

  IF table_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build the response
  SELECT jsonb_build_object(
    'id', table_record.id,
    'slug', table_record.slug,
    'name', table_record.name,
    'tableType', table_record.table_type,
    'design', table_record.design,
    'promptreviewsOverrides', table_record.promptreviews_overrides,
    'categories', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'name', c.name,
          'icon', c.icon_name,
          'features', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', f.id,
                'slug', f.slug,
                'name', f.name,
                'benefitName', COALESCE(f.benefit_framing, f.name),
                'type', f.feature_type,
                'description', f.description
              ) ORDER BY f.display_order
            )
            FROM comparison_features f
            WHERE f.category_id = c.id
            AND (
              array_length(table_record.feature_ids, 1) IS NULL
              OR f.id = ANY(table_record.feature_ids)
            )
          )
        ) ORDER BY c.display_order
      )
      FROM comparison_categories c
      WHERE c.id = ANY(table_record.category_ids)
    ),
    'competitors', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', comp.id,
          'slug', comp.slug,
          'name', comp.name,
          'logo', comp.logo_url,
          'website', comp.website_url,
          'pricing', comp.pricing,
          'features', (
            SELECT jsonb_object_agg(
              f.slug,
              jsonb_build_object(
                'hasFeature', cf.has_feature,
                'value', COALESCE(cf.value_text, cf.value_number::text),
                'isLimited', cf.is_limited,
                'notes', cf.notes
              )
            )
            FROM competitor_features cf
            JOIN comparison_features f ON f.id = cf.feature_id
            WHERE cf.competitor_id = comp.id
          )
        ) ORDER BY array_position(table_record.competitor_ids, comp.id)
      )
      FROM competitors comp
      WHERE comp.id = ANY(table_record.competitor_ids)
      AND comp.status = 'active'
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_comparison_table_data"("table_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_comparison_table_data"("table_slug" "text") IS 'Get all data needed to render a comparison widget by slug';



CREATE OR REPLACE FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer DEFAULT 6) RETURNS TABLE("id" "uuid", "slug" "text", "title" "text", "content" "text", "metadata" "jsonb", "relevance_score" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.title,
    a.content,
    a.metadata,
    ac.priority AS relevance_score
  FROM articles a
  INNER JOIN article_contexts ac ON ac.article_id = a.id
  WHERE
    a.status = 'published'
    AND (ac.route_pattern = route OR route LIKE ac.route_pattern || '%')
  ORDER BY ac.priority DESC, a.updated_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer) IS 'Get most relevant articles for a specific app route';



CREATE OR REPLACE FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer DEFAULT 3, "user_plan" "text" DEFAULT 'grower'::"text") RETURNS TABLE("id" "uuid", "question" "text", "answer" "text", "category" "text", "plans" "text"[], "order_index" integer, "article_id" "uuid", "relevance_score" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.plans,
    f.order_index,
    f.article_id,
    fc.priority AS relevance_score
  FROM faqs f
  INNER JOIN faq_contexts fc ON fc.faq_id = f.id
  WHERE
    -- Match route pattern (exact or prefix match)
    (fc.route_pattern = route OR route LIKE fc.route_pattern || '%')
    -- Filter by user's plan
    AND user_plan = ANY(f.plans)
  ORDER BY fc.priority DESC, f.order_index ASC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer, "user_plan" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer, "user_plan" "text") IS 'Get most relevant FAQs for a specific app route and user plan';



CREATE OR REPLACE FUNCTION "public"."get_current_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_id"() IS 'Returns the current authenticated user ID';



CREATE OR REPLACE FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") RETURNS TABLE("invitation_id" "uuid", "email" "text", "role" "text", "created_at" timestamp with time zone, "expires_at" timestamp with time zone, "accepted_at" timestamp with time zone, "sent_count" bigint, "opened_count" bigint, "clicked_count" bigint, "last_activity" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id as invitation_id,
    ai.email,
    ai.role,
    ai.created_at,
    ai.expires_at,
    ai.accepted_at,
    COALESCE(sent.count, 0) as sent_count,
    COALESCE(opened.count, 0) as opened_count,
    COALESCE(clicked.count, 0) as clicked_count,
    events.last_activity
  FROM account_invitations ai
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type IN ('sent', 'resent')
    GROUP BY invitation_id
  ) sent ON ai.id = sent.invitation_id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type = 'opened'
    GROUP BY invitation_id
  ) opened ON ai.id = opened.invitation_id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type = 'clicked'
    GROUP BY invitation_id
  ) clicked ON ai.id = clicked.invitation_id
  LEFT JOIN (
    SELECT invitation_id, MAX(created_at) as last_activity
    FROM invitation_events
    GROUP BY invitation_id
  ) events ON ai.id = events.invitation_id
  WHERE ai.account_id = p_account_id
  ORDER BY ai.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") IS 'Returns invitation analytics summary for an account';



CREATE OR REPLACE FUNCTION "public"."get_metric"("p_metric_name" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_value BIGINT;
BEGIN
  SELECT metric_value INTO v_value
  FROM platform_metrics
  WHERE metric_name = p_metric_name;

  RETURN COALESCE(v_value, 0);
END;
$$;


ALTER FUNCTION "public"."get_metric"("p_metric_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_navigation_tree"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get all top-level nodes and build them recursively
  SELECT COALESCE(jsonb_agg(build_nav_node(id) ORDER BY order_index), '[]'::jsonb)
  INTO result
  FROM navigation
  WHERE parent_id IS NULL AND is_active = true;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_navigation_tree"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_navigation_tree"() IS 'Builds a hierarchical navigation tree from the navigation table. Returns top-level items with nested children at any depth. Each node includes id, title, href, icon, and children array.';



CREATE OR REPLACE FUNCTION "public"."get_table_schema"("table_name" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
        )
    ) INTO result
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public';
    
    RETURN result;
END;
$_$;


ALTER FUNCTION "public"."get_table_schema"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_username TEXT;
    v_display_override TEXT;
    v_business_name TEXT;
    v_result TEXT;
BEGIN
    -- Get username, display override, and business override from community profile
    SELECT username, display_name_override, business_name_override
    INTO v_username, v_display_override, v_business_name
    FROM community_profiles
    WHERE user_id = p_user_id;

    -- If no business override, get user's primary business name (first account)
    IF v_business_name IS NULL THEN
        SELECT a.business_name
        INTO v_business_name
        FROM accounts a
        JOIN account_users au ON au.account_id = a.id
        WHERE au.user_id = p_user_id
        ORDER BY au.created_at ASC
        LIMIT 1;
    END IF;

    -- Build display name
    IF v_display_override IS NOT NULL AND v_business_name IS NOT NULL THEN
        -- "Display Name (username) • Business Name"
        v_result := v_display_override || ' (' || v_username || ') • ' || v_business_name;
    ELSIF v_display_override IS NOT NULL THEN
        -- "Display Name (username)"
        v_result := v_display_override || ' (' || v_username || ')';
    ELSIF v_business_name IS NOT NULL THEN
        -- "username • Business Name"
        v_result := v_username || ' • ' || v_business_name;
    ELSE
        -- Just username
        v_result := v_username;
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") IS 'Returns formatted display name: "Username • Business Name" or "Display Name (username) • Business" - uses business_name_override if set';



CREATE OR REPLACE FUNCTION "public"."group_reviews"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If this is a new review group, generate a new group_id
    IF NEW.review_group_id IS NULL THEN
        NEW.review_group_id = gen_random_uuid();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."group_reviews"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_clean"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user_clean"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_with_proper_pattern"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_account_count integer;
    v_new_account_id uuid;
BEGIN
    -- Log for debugging
    RAISE LOG 'handle_new_user_with_proper_pattern triggered for user %', NEW.id;
    
    -- Check if user already has any accounts
    SELECT COUNT(*) INTO v_account_count
    FROM public.account_users
    WHERE user_id = NEW.id;
    
    -- Determine account ID based on whether this is first account
    IF v_account_count = 0 THEN
        -- First account: use user ID for backwards compatibility
        v_new_account_id := NEW.id;
        RAISE LOG 'Creating FIRST account for user % with account.id = user.id', NEW.id;
    ELSE
        -- Additional account: use random UUID
        v_new_account_id := gen_random_uuid();
        RAISE LOG 'Creating ADDITIONAL account for user % with random UUID %', NEW.id, v_new_account_id;
    END IF;
    
    -- Create account
    INSERT INTO public.accounts (
        id,
        email,
        user_id,
        first_name,
        last_name,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        has_had_paid_plan,
        created_at,
        updated_at
    ) VALUES (
        v_new_account_id,
        COALESCE(NEW.email, ''),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'no_plan',
        NULL,  -- Trial dates are set when user selects a paid plan
        NULL,
        false,
        false,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Create account_users link
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        v_new_account_id,
        NEW.id,
        'owner',
        NOW()
    ) ON CONFLICT (user_id, account_id) DO NOTHING;

    RAISE LOG 'Successfully created account % for user %', v_new_account_id, NEW.id;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block auth
        RAISE WARNING 'Error in handle_new_user_with_proper_pattern for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_with_proper_pattern"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_updated_at"() IS 'Updates updated_at timestamp on row modification';



CREATE OR REPLACE FUNCTION "public"."handle_user_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_user_confirmation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_metric"("p_metric_name" "text", "p_increment" bigint DEFAULT 1) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  INSERT INTO platform_metrics (metric_name, metric_value, updated_at)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name)
  DO UPDATE SET
    metric_value = platform_metrics.metric_value + p_increment,
    updated_at = NOW()
  RETURNING metric_value INTO v_new_value;

  RETURN v_new_value;
END;
$$;


ALTER FUNCTION "public"."increment_metric"("p_metric_name" "text", "p_increment" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_rss_posts_today"("feed_id" "uuid", "increment_by" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE rss_feed_sources
  SET
    posts_today = posts_today + increment_by,
    updated_at = NOW()
  WHERE id = feed_id;
END;
$$;


ALTER FUNCTION "public"."increment_rss_posts_today"("feed_id" "uuid", "increment_by" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  email_domain TEXT;
  has_whitelist BOOLEAN;
  is_whitelisted BOOLEAN DEFAULT FALSE;
  is_blacklisted BOOLEAN DEFAULT FALSE;
BEGIN
  -- Extract domain from email
  email_domain := split_part(p_email, '@', 2);
  
  -- Check if account has any whitelist policies
  SELECT EXISTS(
    SELECT 1 FROM email_domain_policies 
    WHERE account_id = p_account_id 
      AND policy_type = 'whitelist' 
      AND is_active = TRUE
  ) INTO has_whitelist;
  
  -- If whitelist exists, check if domain is whitelisted
  IF has_whitelist THEN
    SELECT EXISTS(
      SELECT 1 FROM email_domain_policies 
      WHERE account_id = p_account_id 
        AND domain = email_domain 
        AND policy_type = 'whitelist' 
        AND is_active = TRUE
    ) INTO is_whitelisted;
    
    -- If whitelist exists but domain is not whitelisted, reject
    IF NOT is_whitelisted THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check if domain is blacklisted
  SELECT EXISTS(
    SELECT 1 FROM email_domain_policies 
    WHERE account_id = p_account_id 
      AND domain = email_domain 
      AND policy_type = 'blacklist' 
      AND is_active = TRUE
  ) INTO is_blacklisted;
  
  -- If blacklisted, reject
  IF is_blacklisted THEN
    RETURN FALSE;
  END IF;
  
  -- If we get here, email is allowed
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") IS 'Checks if an email domain is allowed based on account policies';



CREATE OR REPLACE FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text" DEFAULT NULL::"text", "p_resource_id" "uuid" DEFAULT NULL::"uuid", "p_details" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    account_id,
    user_id,
    event_type,
    event_category,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_account_id,
    p_user_id,
    p_event_type,
    p_event_category,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_error_message" "text") IS 'Logs security and audit events for tracking and compliance';



CREATE OR REPLACE FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb" DEFAULT '{}'::"jsonb", "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO invitation_events (
    invitation_id,
    event_type,
    event_data,
    user_agent,
    ip_address
  ) VALUES (
    p_invitation_id,
    p_event_type,
    p_event_data,
    p_user_agent,
    p_ip_address
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb", "p_user_agent" "text", "p_ip_address" "inet") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb", "p_user_agent" "text", "p_ip_address" "inet") IS 'Logs invitation events for analytics tracking';



CREATE OR REPLACE FUNCTION "public"."parse_mentions"("p_content" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_matches TEXT[];
BEGIN
    -- Extract all @username patterns (format: @firstname-hash)
    SELECT array_agg(DISTINCT match[1])
    INTO v_matches
    FROM regexp_matches(p_content, '@([a-z0-9-]+)', 'g') AS match;

    RETURN COALESCE(v_matches, ARRAY[]::TEXT[]);
END;
$$;


ALTER FUNCTION "public"."parse_mentions"("p_content" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."parse_mentions"("p_content" "text") IS 'Extracts @usernames from text content (returns array of usernames without @ prefix)';



CREATE OR REPLACE FUNCTION "public"."populate_account_users_readable_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Get account info
  SELECT 
    COALESCE(a.first_name || ' ' || a.last_name, a.email) as account_name,
    a.email as account_email,
    a.first_name,
    a.last_name,
    b.name as business_name
  INTO 
    NEW.account_name,
    NEW.account_email,
    NEW.first_name,
    NEW.last_name,
    NEW.business_name
  FROM accounts a
  LEFT JOIN businesses b ON b.account_id = a.id
  WHERE a.id = NEW.account_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."populate_account_users_readable_fields"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."populate_account_users_readable_fields"() IS 'Populates readable fields in account_users table';



CREATE OR REPLACE FUNCTION "public"."populate_historical_metrics"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_total_accounts BIGINT;
  v_total_reviews BIGINT;
  v_total_widgets BIGINT;
  v_total_prompt_pages BIGINT;
  v_total_gbp_locations BIGINT;
BEGIN
  -- Count existing accounts
  SELECT COUNT(*) INTO v_total_accounts FROM accounts;
  UPDATE platform_metrics SET metric_value = v_total_accounts, updated_at = NOW()
  WHERE metric_name = 'total_accounts_created';

  -- Count existing reviews
  SELECT COUNT(*) INTO v_total_reviews FROM review_submissions;
  UPDATE platform_metrics SET metric_value = v_total_reviews, updated_at = NOW()
  WHERE metric_name = 'total_reviews_captured';

  -- Count existing widgets
  SELECT COUNT(*) INTO v_total_widgets FROM widgets;
  UPDATE platform_metrics SET metric_value = v_total_widgets, updated_at = NOW()
  WHERE metric_name = 'total_widgets_created';

  -- Count existing prompt pages
  SELECT COUNT(*) INTO v_total_prompt_pages FROM prompt_pages;
  UPDATE platform_metrics SET metric_value = v_total_prompt_pages, updated_at = NOW()
  WHERE metric_name = 'total_prompt_pages_created';

  -- Count GBP locations (if table exists)
  BEGIN
    SELECT COUNT(DISTINCT location_id) INTO v_total_gbp_locations
    FROM google_business_locations
    WHERE location_id IS NOT NULL;

    UPDATE platform_metrics SET metric_value = v_total_gbp_locations, updated_at = NOW()
    WHERE metric_name = 'total_gbp_locations_connected';
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, skip
      NULL;
  END;

  RAISE NOTICE 'Historical metrics populated successfully';
  RAISE NOTICE 'Total accounts: %', v_total_accounts;
  RAISE NOTICE 'Total reviews: %', v_total_reviews;
  RAISE NOTICE 'Total widgets: %', v_total_widgets;
  RAISE NOTICE 'Total prompt pages: %', v_total_prompt_pages;
END;
$$;


ALTER FUNCTION "public"."populate_historical_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "slug" "text", "title" "text", "content" "text", "metadata" "jsonb", "rank" real)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.title,
    a.content,
    a.metadata,
    ts_rank(to_tsvector('english', a.title || ' ' || a.content), plainto_tsquery('english', search_query)) AS rank
  FROM articles a
  WHERE
    a.status = 'published'
    AND to_tsvector('english', a.title || ' ' || a.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer) IS 'Full-text search across published articles with ranking';



CREATE OR REPLACE FUNCTION "public"."set_optimizer_leads_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_optimizer_leads_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."simple_ensure_account"("user_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Simple insert, ignore if exists
    INSERT INTO public.accounts (email, plan, created_at, updated_at)
    VALUES (user_email, 'no_plan', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."simple_ensure_account"("user_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."simple_ensure_account"("user_email" "text") IS 'Minimal account creation - no postgres grants';



CREATE OR REPLACE FUNCTION "public"."track_feature_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO analytics_events (
    prompt_page_id,
    event_type,
    created_at,
    user_agent,
    ip_address,
    session_id,
    metadata
  ) VALUES (
    NEW.prompt_page_id,
    'feature_used',
    NEW.created_at,
    NEW.user_agent,
    NEW.ip_address,
    NEW.session_id,
    jsonb_build_object(
      'feature', NEW.metadata->>'feature',
      'action', NEW.metadata->>'action',
      'platform', NEW.platform
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_feature_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_feature_usage"() IS 'Tracks feature usage across the application';



CREATE OR REPLACE FUNCTION "public"."track_time_spent"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only track if time_spent is provided in metadata
  IF NEW.metadata->>'time_spent' IS NOT NULL THEN
    INSERT INTO analytics_events (
      prompt_page_id,
      event_type,
      created_at,
      user_agent,
      ip_address,
      session_id,
      metadata
    ) VALUES (
      NEW.prompt_page_id,
      'time_spent',
      NEW.created_at,
      NEW.user_agent,
      NEW.ip_address,
      NEW.session_id,
      jsonb_build_object(
        'time_spent_seconds', NEW.metadata->>'time_spent',
        'platform', NEW.platform
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_time_spent"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_time_spent"() IS 'Tracks time spent on pages';



CREATE OR REPLACE FUNCTION "public"."trigger_account_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_accounts_created', 1);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_account_deleted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_accounts_deleted', 1);
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."trigger_account_deleted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_gbp_post_published"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only count when status changes to 'completed' (previously incorrectly used 'published')
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM increment_metric('total_gbp_posts_published', 1);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_gbp_post_published"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_populate_account_user_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_account_name TEXT;
    v_user_email TEXT;
    v_business_name TEXT;
BEGIN
    -- CRITICAL: Only run on account_users table, not on accounts table
    IF TG_TABLE_NAME != 'account_users' THEN
        -- If this is being called on the wrong table, just return without modification
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations, check what changed
    IF TG_OP = 'UPDATE' THEN
        -- If only business_name changed and nothing else, just return
        -- This prevents the recursion issue
        IF OLD.business_name IS DISTINCT FROM NEW.business_name AND
           OLD.account_id = NEW.account_id AND
           OLD.user_id = NEW.user_id AND
           OLD.role = NEW.role THEN
            RETURN NEW;
        END IF;
    END IF;
    
    -- Fetch account data including the concatenated name
    SELECT 
        COALESCE(a.first_name || ' ' || a.last_name, a.email),
        b.name
    INTO 
        v_account_name,
        v_business_name
    FROM accounts a
    LEFT JOIN businesses b ON b.account_id = a.id
    WHERE a.id = NEW.account_id;
    
    -- Get user email from auth.users
    SELECT email INTO v_user_email
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    -- Only update fields that exist in account_users table
    IF v_account_name IS NOT NULL AND 
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'account_name') THEN
        NEW.account_name := v_account_name;
    END IF;
    
    IF v_user_email IS NOT NULL AND
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'user_email') THEN
        NEW.user_email := v_user_email;
    END IF;
    
    -- For business_name, keep the NEW value if it was explicitly set
    IF NEW.business_name IS NULL AND v_business_name IS NOT NULL AND
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'business_name') THEN
        NEW.business_name := v_business_name;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_populate_account_user_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_prompt_page_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_prompt_pages_created', 1);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_prompt_page_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_review_captured"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_reviews_captured', 1);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_review_captured"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_review_deleted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_reviews_deleted', 1);
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."trigger_review_deleted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_account_users_business_name"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only update if name actually changed
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Direct update to account_users
        -- The populate_account_user_fields trigger will handle this better now
        UPDATE account_users
        SET business_name = NEW.name
        WHERE account_id = NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_account_users_business_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_widget_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM increment_metric('total_widgets_created', 1);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_widget_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_invitations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_account_invitations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_campaign_actions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_campaign_actions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_concept_schedule_next_scheduled_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_concept_schedule_next_scheduled_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_credit_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_credit_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_domain_policies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_email_domain_policies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_game_scores_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_game_scores_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_google_business_media_uploads_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_google_business_media_uploads_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_keyword_groups_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_keyword_groups_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_keyword_questions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_keyword_questions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_keywords_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_keywords_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_llm_next_scheduled_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_llm_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_llm_next_scheduled_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_llm_summary_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_llm_summary_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_location_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment location count
        UPDATE accounts 
        SET location_count = location_count + 1
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement location count
        UPDATE accounts 
        SET location_count = location_count - 1
        WHERE id = OLD.account_id;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_location_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_metadata_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_metadata_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_next_scheduled_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_next_scheduled_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_onboarding_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_onboarding_tasks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rank_next_scheduled_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_rank_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_rank_next_scheduled_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wm_boards_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_wm_boards_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wm_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_wm_tasks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_game_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    max_possible_score INTEGER;
    max_score_per_level INTEGER := 10000; -- Adjust based on actual game mechanics
BEGIN
    -- Calculate maximum theoretically possible score for the level reached
    max_possible_score := NEW.level_reached * max_score_per_level;

    -- Check if score exceeds reasonable bounds
    IF NEW.score > max_possible_score THEN
        RAISE EXCEPTION 'Score % exceeds maximum possible score % for level %',
            NEW.score, max_possible_score, NEW.level_reached
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    -- Additional sanity check: score should generally increase with level
    -- Allow some flexibility but flag obvious cheating (high score on level 1)
    IF NEW.level_reached = 1 AND NEW.score > 5000 THEN
        RAISE EXCEPTION 'Score too high for level 1'
            USING ERRCODE = '23514';
    END IF;

    -- Check play time is reasonable (not too fast to be humanly possible)
    -- Minimum 10 seconds per level seems reasonable
    IF NEW.play_time_seconds > 0 AND NEW.play_time_seconds < (NEW.level_reached * 10) THEN
        RAISE WARNING 'Suspiciously fast completion time: % seconds for level %',
            NEW.play_time_seconds, NEW.level_reached;
        -- Log but don't block - could be legitimate speedrun
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_game_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_rls_enabled"() RETURNS TABLE("table_name" "text", "rls_enabled" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname IN ('accounts', 'account_users', 'businesses')
  ORDER BY c.relname;
$$;


ALTER FUNCTION "public"."verify_rls_enabled"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."account_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "account_invitations_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."account_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."account_invitations" IS 'Team invitations table. RLS enabled with owner-only access. Invitation acceptance flows use service role client for token-based lookups. Only account owners can view, create, update, or delete invitations for their accounts.';



COMMENT ON COLUMN "public"."account_invitations"."role" IS 'Invitation role: owner (full access), member (limited access), support (development/support access, does not count against team limits)';



COMMENT ON COLUMN "public"."account_invitations"."updated_at" IS 'Timestamp when invitation was last modified (resent, etc.)';



CREATE TABLE IF NOT EXISTS "public"."account_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_email" "text",
    "business_name" "text",
    "account_name" "text",
    CONSTRAINT "account_users_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."account_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."account_users" IS 'TEMPORARY: Permissive RLS policies until we can implement proper security without breaking app functionality';



COMMENT ON COLUMN "public"."account_users"."account_id" IS 'The account this user belongs to';



COMMENT ON COLUMN "public"."account_users"."user_id" IS 'The user ID from auth.users';



COMMENT ON COLUMN "public"."account_users"."role" IS 'User role: owner (full access), member (limited access), support (development/support access, does not count against team limits)';



COMMENT ON COLUMN "public"."account_users"."user_email" IS 'Auto-populated from auth.users.email for easier admin viewing';



COMMENT ON COLUMN "public"."account_users"."business_name" IS 'Auto-populated from businesses.name for easier admin viewing';



COMMENT ON COLUMN "public"."account_users"."account_name" IS 'Display name of the account owner (first_name + last_name or email)';



CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "facebook_url" "text",
    "instagram_url" "text",
    "bluesky_url" "text",
    "tiktok_url" "text",
    "youtube_url" "text",
    "linkedin_url" "text",
    "pinterest_url" "text",
    "primary_font" "text" DEFAULT 'Inter'::"text",
    "secondary_font" "text" DEFAULT 'Inter'::"text",
    "primary_color" "text" DEFAULT '#4F46E5'::"text",
    "secondary_color" "text" DEFAULT '#818CF8'::"text",
    "background_color" "text" DEFAULT '#FFFFFF'::"text",
    "text_color" "text" DEFAULT '#1F2937'::"text",
    "address_street" "text",
    "address_city" "text",
    "address_state" "text",
    "address_zip" "text",
    "address_country" "text",
    "offer_url" "text",
    "background_type" "text" DEFAULT 'gradient'::"text",
    "gradient_start" "text" DEFAULT '#4F46E5'::"text",
    "gradient_middle" "text" DEFAULT '#818CF8'::"text",
    "gradient_end" "text" DEFAULT '#C7D2FE'::"text",
    "offer_learn_more_url" "text",
    "default_offer_enabled" boolean DEFAULT false,
    "default_offer_title" "text" DEFAULT 'Special Offer'::"text",
    "default_offer_body" "text",
    "account_id" "uuid" NOT NULL,
    "card_inner_shadow" boolean DEFAULT false,
    "card_shadow_color" "text" DEFAULT '#222222'::"text",
    "card_shadow_intensity" numeric(3,2) DEFAULT 0.20,
    "card_transparency" numeric(3,2) DEFAULT 1.00,
    "logo_print_url" "text",
    "about_us" "text",
    "kickstarters_enabled" boolean DEFAULT false,
    "selected_kickstarters" "jsonb" DEFAULT '[]'::"jsonb",
    "kickstarters_background_design" boolean DEFAULT false,
    "ai_dos" "text",
    "ai_donts" "text",
    "taglines" "text",
    "team_info" "text",
    "review_platforms" "jsonb",
    "platform_word_counts" "text",
    "logo_url" "text",
    "keywords" "text"[] DEFAULT ARRAY[]::"text"[],
    "tagline" "text",
    "business_website" "text",
    "phone" "text",
    "signup_email" "text",
    "business_email" "text",
    "default_offer_url" "text",
    "industries_other" "text",
    "industry" "text"[],
    "services_offered" "jsonb",
    "company_values" "text",
    "differentiators" "text",
    "years_in_business" "text",
    "industries_served" "text",
    "card_bg" "text",
    "card_text" "text",
    "default_recent_reviews_enabled" boolean DEFAULT false,
    "emoji_sentiment_enabled" boolean DEFAULT false,
    "emoji_sentiment_question" "text" DEFAULT 'How was your experience?'::"text",
    "emoji_feedback_message" "text" DEFAULT 'Please tell us more about your experience'::"text",
    "emoji_thank_you_message" "text" DEFAULT 'Thank you for your feedback!'::"text",
    "emoji_feedback_popup_header" "text" DEFAULT ''::"text",
    "emoji_feedback_page_header" "text" DEFAULT ''::"text",
    "falling_enabled" boolean DEFAULT true,
    "falling_icon" "text" DEFAULT 'star'::"text",
    "falling_icon_color" "text" DEFAULT '#FFD700'::"text",
    "show_friendly_note" boolean DEFAULT false,
    "friendly_note" "text" DEFAULT ''::"text",
    "recent_reviews_enabled" boolean DEFAULT false,
    "recent_reviews_scope" "text" DEFAULT 'current_page'::"text",
    "ai_button_enabled" boolean DEFAULT false,
    "fix_grammar_enabled" boolean DEFAULT false,
    "default_offer_timelock" boolean DEFAULT false,
    "recent_reviews_count" integer DEFAULT 5,
    "falling_stars_theme" "text" DEFAULT 'default'::"text",
    "personalized_note_enabled" boolean DEFAULT false,
    "personalized_note_text" "text" DEFAULT ''::"text",
    "falling_stars_enabled" boolean DEFAULT false,
    "emoji_sentiment_selected" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_kickstarters" "jsonb" DEFAULT '[]'::"jsonb",
    "card_backdrop_blur" integer DEFAULT 0,
    "card_border_width" numeric(3,1) DEFAULT 0,
    "card_border_color" "text" DEFAULT 'rgba(255, 255, 255, 0.2)'::"text",
    "card_glassmorphism" boolean DEFAULT false,
    "card_border_transparency" numeric(3,2) DEFAULT 1.00,
    "card_placeholder_color" "text" DEFAULT '#9CA3AF'::"text",
    "referral_source" character varying(50),
    "referral_source_other" "text",
    "kickstarters_accent_color" "text",
    "input_text_color" "text" DEFAULT '#1F2937'::"text",
    "style_preset" "text",
    "default_keyword_inspiration_enabled" boolean DEFAULT false,
    "default_selected_keyword_inspirations" "text"[] DEFAULT ARRAY[]::"text"[],
    "kickstarters_primary_color" "text",
    "twitter_url" "text",
    "location_code" integer,
    "location_name" "text",
    CONSTRAINT "check_background_type" CHECK (("background_type" = ANY (ARRAY['solid'::"text", 'gradient'::"text"]))),
    CONSTRAINT "check_card_backdrop_blur" CHECK ((("card_backdrop_blur" >= 0) AND ("card_backdrop_blur" <= 20))),
    CONSTRAINT "check_card_border_transparency" CHECK ((("card_border_transparency" >= (0)::numeric) AND ("card_border_transparency" <= (1)::numeric))),
    CONSTRAINT "check_card_border_width" CHECK ((("card_border_width" >= (0)::numeric) AND ("card_border_width" <= (4)::numeric))),
    CONSTRAINT "check_card_transparency" CHECK ((("card_transparency" >= 0.20) AND ("card_transparency" <= 1.00))),
    CONSTRAINT "check_shadow_intensity" CHECK ((("card_shadow_intensity" >= 0.00) AND ("card_shadow_intensity" <= 1.00)))
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


COMMENT ON TABLE "public"."businesses" IS 'Business profiles owned by accounts. The reviewer_id column was removed as business owners are not reviewers.';



COMMENT ON COLUMN "public"."businesses"."id" IS 'Auto-generated unique identifier for the business';



COMMENT ON COLUMN "public"."businesses"."facebook_url" IS 'URL to the business Facebook page';



COMMENT ON COLUMN "public"."businesses"."instagram_url" IS 'URL to the business Instagram profile';



COMMENT ON COLUMN "public"."businesses"."bluesky_url" IS 'URL to the business Bluesky profile';



COMMENT ON COLUMN "public"."businesses"."tiktok_url" IS 'URL to the business TikTok profile';



COMMENT ON COLUMN "public"."businesses"."youtube_url" IS 'URL to the business YouTube channel';



COMMENT ON COLUMN "public"."businesses"."linkedin_url" IS 'URL to the business LinkedIn page';



COMMENT ON COLUMN "public"."businesses"."pinterest_url" IS 'URL to the business Pinterest profile';



COMMENT ON COLUMN "public"."businesses"."primary_font" IS 'The main font used for headings and important text';



COMMENT ON COLUMN "public"."businesses"."secondary_font" IS 'The font used for body text and secondary content';



COMMENT ON COLUMN "public"."businesses"."primary_color" IS 'The main brand color used for primary elements';



COMMENT ON COLUMN "public"."businesses"."secondary_color" IS 'The secondary brand color used for accents';



COMMENT ON COLUMN "public"."businesses"."background_color" IS 'The background color of the prompt page';



COMMENT ON COLUMN "public"."businesses"."text_color" IS 'The main text color used throughout the prompt page';



COMMENT ON COLUMN "public"."businesses"."address_street" IS 'Primary street address of the business';



COMMENT ON COLUMN "public"."businesses"."address_city" IS 'Primary city of the business';



COMMENT ON COLUMN "public"."businesses"."address_state" IS 'Primary state/province of the business';



COMMENT ON COLUMN "public"."businesses"."address_zip" IS 'Primary ZIP/postal code of the business';



COMMENT ON COLUMN "public"."businesses"."address_country" IS 'Primary country of the business';



COMMENT ON COLUMN "public"."businesses"."offer_url" IS 'Default URL for the learn more page about the offer';



COMMENT ON COLUMN "public"."businesses"."default_offer_enabled" IS 'Default: Whether special offer is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."default_offer_title" IS 'Default title for review offers';



COMMENT ON COLUMN "public"."businesses"."default_offer_body" IS 'Default body text for review offers';



COMMENT ON COLUMN "public"."businesses"."account_id" IS 'Foreign key reference to accounts table';



COMMENT ON COLUMN "public"."businesses"."card_inner_shadow" IS 'Whether to show inner shadow/vignette effect on cards';



COMMENT ON COLUMN "public"."businesses"."card_shadow_color" IS 'Color of the inner shadow effect (hex color)';



COMMENT ON COLUMN "public"."businesses"."card_shadow_intensity" IS 'Intensity of the inner shadow effect (0.00 to 1.00)';



COMMENT ON COLUMN "public"."businesses"."card_transparency" IS 'Transparency level of prompt page cards (0.50 to 1.00, where 1.00 is fully opaque)';



COMMENT ON COLUMN "public"."businesses"."logo_print_url" IS 'High-quality version of business logo optimized for print materials (QR codes, etc.)';



COMMENT ON COLUMN "public"."businesses"."about_us" IS 'Business description/about us section';



COMMENT ON COLUMN "public"."businesses"."kickstarters_enabled" IS 'Default: Whether kickstarters are enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."selected_kickstarters" IS 'Default: Selected kickstarter questions as JSON array';



COMMENT ON COLUMN "public"."businesses"."kickstarters_background_design" IS 'Default: Whether kickstarters use background design';



COMMENT ON COLUMN "public"."businesses"."ai_dos" IS 'Global: AI dos instructions across all prompt pages';



COMMENT ON COLUMN "public"."businesses"."ai_donts" IS 'Global: AI donts instructions across all prompt pages';



COMMENT ON COLUMN "public"."businesses"."taglines" IS 'Multiple taglines for the business';



COMMENT ON COLUMN "public"."businesses"."team_info" IS 'Information about the business team';



COMMENT ON COLUMN "public"."businesses"."review_platforms" IS 'Default: Selected review platforms as JSON array';



COMMENT ON COLUMN "public"."businesses"."platform_word_counts" IS 'Word count limits for different platforms';



COMMENT ON COLUMN "public"."businesses"."logo_url" IS 'URL to the business logo';



COMMENT ON COLUMN "public"."businesses"."keywords" IS 'Global keywords array that pre-populates new prompt pages. Each prompt page can then customize their keywords independently.';



COMMENT ON COLUMN "public"."businesses"."tagline" IS 'Primary tagline for the business';



COMMENT ON COLUMN "public"."businesses"."business_website" IS 'Main website URL for the business';



COMMENT ON COLUMN "public"."businesses"."phone" IS 'Business phone number';



COMMENT ON COLUMN "public"."businesses"."signup_email" IS 'Email used for signup';



COMMENT ON COLUMN "public"."businesses"."business_email" IS 'Primary business email';



COMMENT ON COLUMN "public"."businesses"."default_offer_url" IS 'Default URL for review offers';



COMMENT ON COLUMN "public"."businesses"."industries_other" IS 'Other industries not in the main list';



COMMENT ON COLUMN "public"."businesses"."industry" IS 'Array of industry categories';



COMMENT ON COLUMN "public"."businesses"."services_offered" IS 'JSON array of services offered by the business';



COMMENT ON COLUMN "public"."businesses"."company_values" IS 'Core values of the company';



COMMENT ON COLUMN "public"."businesses"."differentiators" IS 'What makes the business unique';



COMMENT ON COLUMN "public"."businesses"."years_in_business" IS 'Number of years the business has been operating';



COMMENT ON COLUMN "public"."businesses"."industries_served" IS 'Industries that the business serves';



COMMENT ON COLUMN "public"."businesses"."card_bg" IS 'Background color for review cards';



COMMENT ON COLUMN "public"."businesses"."card_text" IS 'Text color for review cards';



COMMENT ON COLUMN "public"."businesses"."default_recent_reviews_enabled" IS 'Default setting for Recent Reviews feature on new prompt pages';



COMMENT ON COLUMN "public"."businesses"."emoji_sentiment_enabled" IS 'Default: Whether emoji sentiment is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."emoji_sentiment_question" IS 'Default: Question to ask users for emoji sentiment';



COMMENT ON COLUMN "public"."businesses"."emoji_feedback_message" IS 'Default: Message shown when collecting feedback';



COMMENT ON COLUMN "public"."businesses"."emoji_thank_you_message" IS 'Default: Thank you message after feedback';



COMMENT ON COLUMN "public"."businesses"."emoji_feedback_popup_header" IS 'Default: Header for feedback popup';



COMMENT ON COLUMN "public"."businesses"."emoji_feedback_page_header" IS 'Default: Header for feedback page';



COMMENT ON COLUMN "public"."businesses"."falling_enabled" IS 'Default: Whether falling stars animation is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."falling_icon" IS 'Default: Icon to use for falling animation';



COMMENT ON COLUMN "public"."businesses"."falling_icon_color" IS 'Default: Color for falling icons';



COMMENT ON COLUMN "public"."businesses"."show_friendly_note" IS 'Default: Whether friendly note is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."friendly_note" IS 'Default: Text for the friendly note';



COMMENT ON COLUMN "public"."businesses"."recent_reviews_enabled" IS 'Default: Whether recent reviews section is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."recent_reviews_scope" IS 'Default: Scope for recent reviews display (current_page or all_pages)';



COMMENT ON COLUMN "public"."businesses"."ai_button_enabled" IS 'Default: Whether AI generation button is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."fix_grammar_enabled" IS 'Default: Whether grammar fix button is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."default_offer_timelock" IS 'Default: Whether to add a 3-minute timer to offer banners for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."recent_reviews_count" IS 'Default: Number of recent reviews to display';



COMMENT ON COLUMN "public"."businesses"."falling_stars_theme" IS 'Default: Theme for falling stars animation';



COMMENT ON COLUMN "public"."businesses"."personalized_note_enabled" IS 'Default: Whether personalized note is enabled';



COMMENT ON COLUMN "public"."businesses"."personalized_note_text" IS 'Default: Text for personalized note';



COMMENT ON COLUMN "public"."businesses"."falling_stars_enabled" IS 'Default: Whether falling stars animation is enabled for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."emoji_sentiment_selected" IS 'Default: Selected emoji sentiments as JSON array';



COMMENT ON COLUMN "public"."businesses"."custom_kickstarters" IS 'Array of custom kickstarter questions created by the business';



COMMENT ON COLUMN "public"."businesses"."card_backdrop_blur" IS 'Backdrop blur intensity in pixels (0-20, 0 means no blur)';



COMMENT ON COLUMN "public"."businesses"."card_border_width" IS 'Border width in pixels (0-3, supports 0.5 for thin borders)';



COMMENT ON COLUMN "public"."businesses"."card_border_color" IS 'Border color in any CSS format (hex, rgb, rgba)';



COMMENT ON COLUMN "public"."businesses"."card_glassmorphism" IS 'Enable glassmorphic effect (combines blur, transparency, and border)';



COMMENT ON COLUMN "public"."businesses"."card_border_transparency" IS 'Border opacity from 0 (transparent) to 1 (opaque)';



COMMENT ON COLUMN "public"."businesses"."referral_source" IS 'How the user heard about Prompt Reviews (google_search, chatgpt, social_media, podcast_blog, online_community, word_of_mouth, conference_event, other)';



COMMENT ON COLUMN "public"."businesses"."referral_source_other" IS 'Additional details when referral_source is "other"';



COMMENT ON COLUMN "public"."businesses"."input_text_color" IS 'Text color for input fields and textareas on prompt pages';



COMMENT ON COLUMN "public"."businesses"."style_preset" IS 'Selected style preset name (glassy, solid, paper, snazzy, neon, or custom). Used to preserve preset selection across saves.';



COMMENT ON COLUMN "public"."businesses"."default_keyword_inspiration_enabled" IS 'Default value for keyword inspiration enabled on new prompt pages';



COMMENT ON COLUMN "public"."businesses"."default_selected_keyword_inspirations" IS 'Default selected keywords for new prompt pages';



COMMENT ON COLUMN "public"."businesses"."kickstarters_primary_color" IS 'Dedicated color for Kickstarters elements (independent from primary_color)';



COMMENT ON COLUMN "public"."businesses"."twitter_url" IS 'Twitter/X profile URL for the business';



COMMENT ON COLUMN "public"."businesses"."location_code" IS 'DataForSEO location code (e.g., 1022858 for Portland, OR)';



COMMENT ON COLUMN "public"."businesses"."location_name" IS 'Human-readable location name (e.g., Portland, Oregon, United States)';



CREATE OR REPLACE VIEW "public"."account_users_readable" AS
 SELECT "au"."account_id",
    "au"."user_id",
    "au"."role",
    "au"."created_at" AS "joined_at",
    ( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = "au"."user_id")) AS "user_email",
    "b"."name" AS "business_name",
    "b"."business_email",
    "b"."phone" AS "business_phone"
   FROM ("public"."account_users" "au"
     LEFT JOIN "public"."businesses" "b" ON (("b"."account_id" = "au"."account_id")));


ALTER TABLE "public"."account_users_readable" OWNER TO "postgres";


COMMENT ON VIEW "public"."account_users_readable" IS 'INTERNAL ADMIN ONLY: Account users with email and business details from joined tables. Access restricted to service_role. Query via authenticated admin API routes that check permissions.';



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan" "text" DEFAULT 'no_plan'::"text" NOT NULL,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "is_free_account" boolean DEFAULT false,
    "custom_prompt_page_count" integer DEFAULT 0,
    "contact_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_name" "text",
    "first_name" "text",
    "last_name" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text",
    "has_had_paid_plan" boolean DEFAULT false NOT NULL,
    "email" "text",
    "plan_lookup_key" "text",
    "review_notifications_enabled" boolean DEFAULT true,
    "user_id" "uuid",
    "max_users" integer DEFAULT 1,
    "location_count" integer DEFAULT 0,
    "max_locations" integer DEFAULT 0,
    "deleted_at" timestamp with time zone,
    "is_admin" boolean DEFAULT false,
    "free_plan_level" "text",
    "promotion_code" "text",
    "max_contacts" integer DEFAULT 0,
    "max_prompt_pages" integer DEFAULT 3,
    "prompt_page_count" integer DEFAULT 0,
    "reactivated_at" timestamp with time zone,
    "reactivation_count" integer DEFAULT 0,
    "last_cancellation_reason" "text",
    "onboarding_step" "text" DEFAULT 'incomplete'::"text",
    "prompt_page_status_labels" "jsonb" DEFAULT '{"sent": "Sent", "draft": "Draft", "complete": "Complete", "in_queue": "In Queue", "follow_up": "Follow Up"}'::"jsonb",
    "business_creation_complete" boolean DEFAULT false,
    "billing_period" "text" DEFAULT 'monthly'::"text",
    "max_gbp_locations" integer DEFAULT 5,
    "email_review_notifications" boolean DEFAULT true,
    "gbp_insights_enabled" boolean DEFAULT true,
    "is_additional_account" boolean DEFAULT false,
    "had_paid_plan" boolean DEFAULT false,
    "created_by_user_id" "uuid",
    "created_by" "uuid",
    "sentiment_analyses_this_month" integer DEFAULT 0,
    "sentiment_last_reset_date" "date" DEFAULT CURRENT_DATE,
    "keyword_analyses_this_month" integer DEFAULT 0,
    "keyword_last_reset_date" "date",
    "keyword_suggestions_this_month" integer DEFAULT 0,
    "keyword_suggestions_last_reset_date" "date",
    "is_client_account" boolean DEFAULT false,
    "monthly_credit_allocation" integer,
    "low_balance_warning_count" integer DEFAULT 0,
    CONSTRAINT "accounts_billing_period_check" CHECK (("billing_period" = ANY (ARRAY['monthly'::"text", 'annual'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."accounts" IS 'Business accounts with independent IDs. No longer tied to auth.users.id to support multi-account architecture.';



COMMENT ON COLUMN "public"."accounts"."plan" IS 'The user''s subscription plan. no_plan means no plan selected yet.';



COMMENT ON COLUMN "public"."accounts"."trial_start" IS 'Trial start date - only set when user selects a paid plan, not during signup';



COMMENT ON COLUMN "public"."accounts"."trial_end" IS 'Trial end date - only set when user selects a paid plan, not during signup';



COMMENT ON COLUMN "public"."accounts"."is_free_account" IS 'Whether the account is marked as free';



COMMENT ON COLUMN "public"."accounts"."custom_prompt_page_count" IS 'Number of custom prompt pages created';



COMMENT ON COLUMN "public"."accounts"."contact_count" IS 'Number of contacts created';



COMMENT ON COLUMN "public"."accounts"."created_at" IS 'Account creation timestamp';



COMMENT ON COLUMN "public"."accounts"."updated_at" IS 'Account last update timestamp';



COMMENT ON COLUMN "public"."accounts"."business_name" IS 'Name of the business associated with this account';



COMMENT ON COLUMN "public"."accounts"."first_name" IS 'First name of the account owner';



COMMENT ON COLUMN "public"."accounts"."last_name" IS 'Last name of the account owner';



COMMENT ON COLUMN "public"."accounts"."stripe_customer_id" IS 'Stripe customer ID';



COMMENT ON COLUMN "public"."accounts"."stripe_subscription_id" IS 'Stripe subscription ID';



COMMENT ON COLUMN "public"."accounts"."subscription_status" IS 'Stripe subscription status';



COMMENT ON COLUMN "public"."accounts"."has_had_paid_plan" IS 'Whether the user has ever had a paid plan';



COMMENT ON COLUMN "public"."accounts"."email" IS 'Email address associated with this account';



COMMENT ON COLUMN "public"."accounts"."plan_lookup_key" IS 'Key used for plan lookup and billing';



COMMENT ON COLUMN "public"."accounts"."review_notifications_enabled" IS 'Whether review notifications are enabled';



COMMENT ON COLUMN "public"."accounts"."user_id" IS 'User ID associated with this account';



COMMENT ON COLUMN "public"."accounts"."location_count" IS 'Current number of locations created';



COMMENT ON COLUMN "public"."accounts"."max_locations" IS 'Maximum number of locations allowed for this plan';



COMMENT ON COLUMN "public"."accounts"."deleted_at" IS 'Soft deletion timestamp. Account can be reactivated within 90 days.';



COMMENT ON COLUMN "public"."accounts"."is_admin" IS 'Simple boolean flag to identify admin users';



COMMENT ON COLUMN "public"."accounts"."free_plan_level" IS 'The plan level for free accounts (grower, builder, maven). When is_free_account is true, this determines the feature limits.';



COMMENT ON COLUMN "public"."accounts"."promotion_code" IS 'Promotion code entered during account creation for tracking marketing campaigns and partnerships';



COMMENT ON COLUMN "public"."accounts"."max_contacts" IS 'Maximum number of contacts allowed for this plan';



COMMENT ON COLUMN "public"."accounts"."max_prompt_pages" IS 'Maximum number of prompt pages allowed for this plan';



COMMENT ON COLUMN "public"."accounts"."prompt_page_count" IS 'Current number of prompt pages created';



COMMENT ON COLUMN "public"."accounts"."reactivated_at" IS 'Last reactivation timestamp for tracking returning users.';



COMMENT ON COLUMN "public"."accounts"."reactivation_count" IS 'Number of times account has been reactivated.';



COMMENT ON COLUMN "public"."accounts"."onboarding_step" IS 'Tracks user onboarding progress: incomplete, needs_business, needs_plan, complete';



COMMENT ON COLUMN "public"."accounts"."prompt_page_status_labels" IS 'Custom display labels for prompt page statuses. Keys must match prompt_page_status enum values. Max 20 characters per label.';



COMMENT ON COLUMN "public"."accounts"."business_creation_complete" IS 'Indicates if the account has completed business profile creation. Used to determine navigation flow: false + no_plan = create-business, true + no_plan = pricing modal';



COMMENT ON COLUMN "public"."accounts"."billing_period" IS 'User''s selected billing period (monthly or annual), stored even during trial period';



COMMENT ON COLUMN "public"."accounts"."max_gbp_locations" IS 'Maximum number of GBP locations allowed based on plan';



COMMENT ON COLUMN "public"."accounts"."is_additional_account" IS 'True if this account was created as an additional account by an existing user. These accounts are not eligible for free trials or comeback offers.';



COMMENT ON COLUMN "public"."accounts"."created_by" IS 'User who initiated account creation';



COMMENT ON COLUMN "public"."accounts"."sentiment_analyses_this_month" IS 'Counter for sentiment analyses run this month, resets monthly';



COMMENT ON COLUMN "public"."accounts"."sentiment_last_reset_date" IS 'Date when sentiment analysis counter was last reset';



COMMENT ON COLUMN "public"."accounts"."is_client_account" IS 'When true, account receives monthly credits even without a paid subscription';



COMMENT ON COLUMN "public"."accounts"."monthly_credit_allocation" IS 'Custom monthly credit amount. If NULL, uses plan default. If set, overrides plan tier.';



CREATE TABLE IF NOT EXISTS "public"."ai_enrichment_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "phrase" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_enrichment_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_enrichment_usage" IS 'Tracks AI keyword enrichment usage for daily limit enforcement (30/day per account)';



CREATE TABLE IF NOT EXISTS "public"."ai_keyword_generation_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_keyword_generation_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_keyword_generation_usage" IS 'Tracks AI keyword generation usage for daily limit enforcement (20/day per account)';



CREATE TABLE IF NOT EXISTS "public"."ai_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "cost_usd" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "feature_type" "text",
    "account_id" "uuid"
);


ALTER TABLE "public"."ai_usage" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ai_usage"."feature_type" IS 'Type of AI feature used (e.g., keyword_generation, review_generation, grammar_fix)';



COMMENT ON COLUMN "public"."ai_usage"."account_id" IS 'Account that used the AI feature';



CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_page_id" "uuid",
    "event_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "platform" "text",
    "session_id" "text",
    "user_agent" "text",
    "ip_address" "text",
    CONSTRAINT "valid_event_type" CHECK (("event_type" = ANY (ARRAY['view'::"text", 'copy_submit'::"text", 'ai_generate'::"text", 'login'::"text", 'prompt_page_created'::"text", 'contacts_uploaded'::"text", 'review_submitted'::"text", 'save_for_later'::"text", 'unsave_for_later'::"text", 'time_spent'::"text", 'feature_used'::"text", 'emoji_sentiment'::"text", 'emoji_sentiment_choice'::"text", 'constructive_feedback'::"text"])))
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'Tracks various events related to prompt pages (views, AI generations, etc.)';



COMMENT ON COLUMN "public"."analytics_events"."event_type" IS 'Type of event (page_view, ai_generate, etc.)';



COMMENT ON COLUMN "public"."analytics_events"."metadata" IS 'Additional event data stored as JSON';



COMMENT ON COLUMN "public"."analytics_events"."platform" IS 'Platform where the event occurred';



COMMENT ON COLUMN "public"."analytics_events"."session_id" IS 'Unique session identifier for tracking user sessions';



COMMENT ON COLUMN "public"."analytics_events"."user_agent" IS 'User agent string from the browser';



COMMENT ON COLUMN "public"."analytics_events"."ip_address" IS 'IP address of the user';



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "button_text" "text",
    "button_url" "text"
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcements" IS 'Admin announcements table - now uses accounts.is_admin for permission checking';



COMMENT ON COLUMN "public"."announcements"."button_text" IS 'Optional button text for the announcement';



COMMENT ON COLUMN "public"."announcements"."button_url" IS 'Optional button URL for the announcement';



CREATE TABLE IF NOT EXISTS "public"."article_contexts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "route_pattern" "text" NOT NULL,
    "keywords" "text"[] DEFAULT ARRAY[]::"text"[],
    "priority" integer DEFAULT 50,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "article_contexts_priority_check" CHECK ((("priority" >= 0) AND ("priority" <= 100)))
);


ALTER TABLE "public"."article_contexts" OWNER TO "postgres";


COMMENT ON TABLE "public"."article_contexts" IS 'Maps app routes to relevant help articles for contextual help system';



COMMENT ON COLUMN "public"."article_contexts"."route_pattern" IS 'App route pattern (exact match or prefix) to show this article';



COMMENT ON COLUMN "public"."article_contexts"."keywords" IS 'Keywords for relevance scoring when matching articles to routes';



COMMENT ON COLUMN "public"."article_contexts"."priority" IS 'Priority weight (0-100) for ranking articles in context';



CREATE TABLE IF NOT EXISTS "public"."article_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "editor_id" "uuid",
    "change_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."article_revisions" OWNER TO "postgres";


COMMENT ON TABLE "public"."article_revisions" IS 'Version history for documentation articles';



CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "articles_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "content_not_empty" CHECK (("length"(TRIM(BOTH FROM "content")) > 0)),
    CONSTRAINT "title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "valid_slug" CHECK (("slug" ~ '^[a-z0-9/-]+$'::"text"))
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


COMMENT ON TABLE "public"."articles" IS 'Documentation articles and help content';



COMMENT ON COLUMN "public"."articles"."metadata" IS 'JSONB field containing: description, keywords, category, tags, icons, featured content, CTAs, plan availability';



COMMENT ON COLUMN "public"."articles"."status" IS 'Workflow status: draft (not visible), published (live), archived (hidden but searchable)';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid",
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_logs_event_category_check" CHECK (("event_category" = ANY (ARRAY['auth'::"text", 'invitation'::"text", 'team'::"text", 'permission'::"text", 'security'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Comprehensive audit logging for security events and user activities';



COMMENT ON COLUMN "public"."audit_logs"."event_category" IS 'Category of event: auth, invitation, team, permission, security';



COMMENT ON COLUMN "public"."audit_logs"."details" IS 'Additional event details and context as JSON';



CREATE TABLE IF NOT EXISTS "public"."billing_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "event_type" character varying(50) NOT NULL,
    "event_source" character varying(20) NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb",
    "stripe_event_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "stripe_subscription_id" character varying(255),
    "old_plan" character varying(50),
    "new_plan" character varying(50),
    "old_billing_period" character varying(20),
    "new_billing_period" character varying(20),
    "amount" integer,
    "currency" character varying(3),
    "error_message" "text",
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."billing_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."billing_audit_log" IS 'Audit log for all billing-related events including plan changes, payments, and errors';



CREATE TABLE IF NOT EXISTS "public"."business_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "business_name" "text",
    "address_street" "text",
    "address_city" "text",
    "address_state" "text",
    "address_zip" "text",
    "address_country" "text",
    "business_description" "text",
    "unique_aspects" "text",
    "phone" "text",
    "email" "text",
    "website_url" "text",
    "ai_dos" "text",
    "ai_donts" "text",
    "review_platforms" "jsonb",
    "logo_url" "text",
    "hours" "text",
    "manager_name" "text",
    "manager_email" "text",
    "parking_info" "text",
    "accessibility_info" "text",
    "primary_color" "text",
    "secondary_color" "text",
    "custom_css" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "emoji_sentiment_enabled" boolean DEFAULT false,
    "emoji_sentiment_question" "text" DEFAULT 'How was your experience?'::"text",
    "emoji_feedback_message" "text" DEFAULT 'How can we improve?'::"text",
    "emoji_thank_you_message" "text" DEFAULT 'Thank you for your feedback. It''s important to us.'::"text",
    "emoji_labels" "text"[] DEFAULT ARRAY['Excellent'::"text", 'Satisfied'::"text", 'Neutral'::"text", 'Unsatisfied'::"text", 'Frustrated'::"text"],
    "falling_enabled" boolean DEFAULT true,
    "falling_icon" "text" DEFAULT 'star'::"text",
    "offer_enabled" boolean DEFAULT false,
    "offer_title" "text" DEFAULT ''::"text",
    "offer_body" "text" DEFAULT ''::"text",
    "offer_url" "text" DEFAULT ''::"text",
    "ai_review_enabled" boolean DEFAULT true,
    "show_friendly_note" boolean DEFAULT false,
    "friendly_note" "text" DEFAULT ''::"text",
    "emoji_feedback_popup_header" "text" DEFAULT 'How can we Improve?'::"text",
    "emoji_feedback_page_header" "text" DEFAULT 'Your feedback helps us grow'::"text",
    "location_photo_url" "text",
    "falling_icon_color" "text" DEFAULT '#fbbf24'::"text",
    "prompt_page_slug" "text",
    "prompt_page_id" "uuid",
    "kickstarters_enabled" boolean,
    "selected_kickstarters" "jsonb",
    "kickstarters_background_design" boolean DEFAULT false,
    "recent_reviews_enabled" boolean,
    "offer_timelock" boolean DEFAULT false,
    "custom_kickstarters" "jsonb"
);


ALTER TABLE "public"."business_locations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."business_locations"."falling_enabled" IS 'Whether the falling stars animation is enabled for this business location (default: true for better UX)';



COMMENT ON COLUMN "public"."business_locations"."show_friendly_note" IS 'Whether to display the friendly note popup for this location. Should only be true when friendly_note has content.';



COMMENT ON COLUMN "public"."business_locations"."friendly_note" IS 'The personalized note text to display in the popup';



COMMENT ON COLUMN "public"."business_locations"."emoji_feedback_popup_header" IS 'Header text shown in the choice modal for negative sentiment users - fixed capitalization';



COMMENT ON COLUMN "public"."business_locations"."emoji_feedback_page_header" IS 'Header text shown on the feedback form page';



COMMENT ON COLUMN "public"."business_locations"."location_photo_url" IS 'URL to the location-specific featured photo/image';



COMMENT ON COLUMN "public"."business_locations"."falling_icon_color" IS 'Hex color value for the falling stars animation icons';



COMMENT ON COLUMN "public"."business_locations"."prompt_page_slug" IS 'Slug of the automatically created prompt page for this location';



COMMENT ON COLUMN "public"."business_locations"."prompt_page_id" IS 'ID of the automatically created prompt page for this location';



COMMENT ON COLUMN "public"."business_locations"."kickstarters_enabled" IS 'Whether kickstarters feature is enabled for this location (overrides business setting if not null)';



COMMENT ON COLUMN "public"."business_locations"."selected_kickstarters" IS 'Array of selected kickstarter IDs for this location (overrides business setting if not null)';



COMMENT ON COLUMN "public"."business_locations"."kickstarters_background_design" IS 'Design style for kickstarters: false for no background (default), true for background';



COMMENT ON COLUMN "public"."business_locations"."recent_reviews_enabled" IS 'Location-specific Recent Reviews setting (overrides business default when not null)';



COMMENT ON COLUMN "public"."business_locations"."offer_timelock" IS 'Whether to add a 3-minute timer to the offer banner for this location';



COMMENT ON COLUMN "public"."business_locations"."custom_kickstarters" IS 'Array of custom kickstarter questions for this location (overrides business setting if not null)';



CREATE TABLE IF NOT EXISTS "public"."campaign_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_page_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "account_id" "uuid" NOT NULL,
    "activity_type" "public"."activity_type" DEFAULT 'note'::"public"."activity_type" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaign_actions" IS 'Activity log for prompt page campaigns including notes, communications, and status changes';



CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_slug" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."channels" OWNER TO "postgres";


COMMENT ON TABLE "public"."channels" IS 'Global community channels - visible to all authenticated users';



CREATE TABLE IF NOT EXISTS "public"."comeback_email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "email_type" "text" NOT NULL,
    "success" boolean DEFAULT false NOT NULL,
    "resend_email_id" "text",
    "days_since_cancel" integer,
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comeback_email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "comment_reactions_reaction_check" CHECK (("reaction" = ANY (ARRAY['thumbs_up'::"text", 'star'::"text", 'celebrate'::"text", 'clap'::"text", 'laugh'::"text"])))
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment_reactions" IS 'Emoji reactions to comments - one per user per reaction type';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "account_id" "uuid" NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "prompt_page_id" "uuid",
    "communication_type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subject" "text",
    "message_content" "text" NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_agent" "text",
    "ip_address" "inet",
    CONSTRAINT "communication_records_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['email'::"text", 'sms'::"text"]))),
    CONSTRAINT "communication_records_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."communication_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "communication_type" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "subject_template" "text",
    "message_template" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "communication_templates_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['email'::"text", 'sms'::"text"]))),
    CONSTRAINT "communication_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['initial'::"text", 'follow_up'::"text"])))
);


ALTER TABLE "public"."communication_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_profiles" (
    "user_id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name_override" "text",
    "opted_in_at" timestamp with time zone,
    "guidelines_ack_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_name_override" "text",
    "profile_photo_url" "text",
    CONSTRAINT "username_format" CHECK (("username" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 30)))
);


ALTER TABLE "public"."community_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."community_profiles" IS 'User profiles for community - one per user, not per account';



COMMENT ON COLUMN "public"."community_profiles"."username" IS 'Immutable username format: firstname-hash (e.g. alex-7h3n)';



COMMENT ON COLUMN "public"."community_profiles"."display_name_override" IS 'Optional custom display name (e.g. "Alex the Baker")';



COMMENT ON COLUMN "public"."community_profiles"."business_name_override" IS 'Optional override for business name display (if user has multiple accounts)';



COMMENT ON COLUMN "public"."community_profiles"."profile_photo_url" IS 'URL to user''s uploaded profile photo in the profile-photos storage bucket. Takes precedence over business logo_url for display in community.';



CREATE TABLE IF NOT EXISTS "public"."comparison_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon_name" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comparison_categories_name_not_empty" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "comparison_categories_valid_slug" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."comparison_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."comparison_categories" IS 'Feature categories for grouping comparison features (e.g., Local SEO, Reviews)';



COMMENT ON COLUMN "public"."comparison_categories"."display_order" IS 'Order for display (lower numbers first, primacy effect)';



CREATE TABLE IF NOT EXISTS "public"."comparison_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "benefit_framing" "text",
    "description" "text",
    "category_id" "uuid",
    "feature_type" "text" DEFAULT 'boolean'::"text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comparison_features_feature_type_check" CHECK (("feature_type" = ANY (ARRAY['boolean'::"text", 'text'::"text", 'number'::"text", 'limited'::"text"]))),
    CONSTRAINT "comparison_features_name_not_empty" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "comparison_features_valid_slug" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."comparison_features" OWNER TO "postgres";


COMMENT ON TABLE "public"."comparison_features" IS 'Individual features to compare across competitors';



COMMENT ON COLUMN "public"."comparison_features"."benefit_framing" IS 'Benefit-focused alternative name (e.g., "Build custom integrations" vs "API Access")';



COMMENT ON COLUMN "public"."comparison_features"."feature_type" IS 'Rendering type: boolean (checkmark), text (custom text), number (numeric value), limited (partial support)';



CREATE TABLE IF NOT EXISTS "public"."comparison_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "table_type" "text" DEFAULT 'multi'::"text",
    "competitor_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "single_competitor_id" "uuid",
    "category_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "feature_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "promptreviews_overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "design" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "pricing_notes" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "comparison_tables_name_not_empty" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "comparison_tables_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "comparison_tables_table_type_check" CHECK (("table_type" = ANY (ARRAY['single'::"text", 'multi'::"text"]))),
    CONSTRAINT "comparison_tables_type_check" CHECK (((("table_type" = 'single'::"text") AND ("single_competitor_id" IS NOT NULL)) OR (("table_type" = 'multi'::"text") AND ("array_length"("competitor_ids", 1) > 0)) OR ("status" = 'draft'::"text"))),
    CONSTRAINT "comparison_tables_valid_slug" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."comparison_tables" OWNER TO "postgres";


COMMENT ON TABLE "public"."comparison_tables" IS 'Embeddable comparison table configurations';



COMMENT ON COLUMN "public"."comparison_tables"."table_type" IS 'single: 1-on-1 comparison, multi: multiple competitors';



COMMENT ON COLUMN "public"."comparison_tables"."promptreviews_overrides" IS 'Override PromptReviews feature values per table (default: all features = true)';



COMMENT ON COLUMN "public"."comparison_tables"."design" IS 'Widget styling: accentColor, showPricing, headerStyle, etc.';



COMMENT ON COLUMN "public"."comparison_tables"."pricing_notes" IS 'Freeform pricing text per competitor. Keys are competitor slugs or "promptreviews"';



CREATE TABLE IF NOT EXISTS "public"."competitor_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "competitor_id" "uuid" NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "has_feature" boolean DEFAULT false,
    "value_text" "text",
    "value_number" numeric,
    "is_limited" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."competitor_features" OWNER TO "postgres";


COMMENT ON TABLE "public"."competitor_features" IS 'Junction table mapping feature values to competitors';



COMMENT ON COLUMN "public"."competitor_features"."is_limited" IS 'Shows "Limited" badge instead of checkmark (amber color)';



CREATE TABLE IF NOT EXISTS "public"."competitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "website_url" "text",
    "pricing" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "competitors_name_not_empty" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "competitors_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"]))),
    CONSTRAINT "competitors_valid_slug" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."competitors" OWNER TO "postgres";


COMMENT ON TABLE "public"."competitors" IS 'Competitor profiles for comparison tables';



COMMENT ON COLUMN "public"."competitors"."pricing" IS 'JSONB with pricing tiers: {"tier": {"price": number, "period": "month"|"year"}}';



CREATE TABLE IF NOT EXISTS "public"."concept_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "schedule_frequency" character varying(20),
    "schedule_day_of_week" integer,
    "schedule_day_of_month" integer,
    "schedule_hour" integer DEFAULT 9 NOT NULL,
    "search_rank_enabled" boolean DEFAULT true NOT NULL,
    "geo_grid_enabled" boolean DEFAULT true NOT NULL,
    "llm_visibility_enabled" boolean DEFAULT true NOT NULL,
    "llm_providers" "text"[] DEFAULT ARRAY['chatgpt'::"text", 'claude'::"text", 'gemini'::"text", 'perplexity'::"text"] NOT NULL,
    "estimated_credits" integer DEFAULT 0 NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "next_scheduled_at" timestamp with time zone,
    "last_scheduled_run_at" timestamp with time zone,
    "last_credit_warning_sent_at" timestamp with time zone,
    "paused_llm_schedule_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "concept_schedules_schedule_day_of_month_check" CHECK ((("schedule_day_of_month" IS NULL) OR (("schedule_day_of_month" >= 1) AND ("schedule_day_of_month" <= 28)))),
    CONSTRAINT "concept_schedules_schedule_day_of_week_check" CHECK ((("schedule_day_of_week" IS NULL) OR (("schedule_day_of_week" >= 0) AND ("schedule_day_of_week" <= 6)))),
    CONSTRAINT "concept_schedules_schedule_frequency_check" CHECK ((("schedule_frequency" IS NULL) OR (("schedule_frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::"text"[])))),
    CONSTRAINT "concept_schedules_schedule_hour_check" CHECK ((("schedule_hour" >= 0) AND ("schedule_hour" <= 23)))
);


ALTER TABLE "public"."concept_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "category" "text",
    "notes" "text",
    "google_url" "text",
    "yelp_url" "text",
    "facebook_url" "text",
    "google_review" "text",
    "yelp_review" "text",
    "facebook_review" "text",
    "google_instructions" "text",
    "yelp_instructions" "text",
    "facebook_instructions" "text",
    "review_rewards" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "role" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "business_name" "text",
    "imported_from_google" boolean DEFAULT false,
    "google_reviewer_name" "text"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Contact management table with RLS policies that support both direct account ownership and account_users relationships for team access';



COMMENT ON COLUMN "public"."contacts"."account_id" IS 'The ID of the account that owns this contact';



COMMENT ON COLUMN "public"."contacts"."email" IS 'The email address of the contact';



COMMENT ON COLUMN "public"."contacts"."phone" IS 'The phone number of the contact';



COMMENT ON COLUMN "public"."contacts"."category" IS 'Optional category for organizing contacts';



COMMENT ON COLUMN "public"."contacts"."notes" IS 'Optional notes about the contact';



COMMENT ON COLUMN "public"."contacts"."status" IS 'Workflow status for the contact (draft, in_queue, sent, completed)';



COMMENT ON COLUMN "public"."contacts"."role" IS 'Role/Position/Occupation of the contact';



CREATE TABLE IF NOT EXISTS "public"."credit_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "included_credits" integer DEFAULT 0 NOT NULL,
    "purchased_credits" integer DEFAULT 0 NOT NULL,
    "included_credits_expire_at" timestamp with time zone,
    "last_monthly_grant_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_balances_included_non_negative" CHECK (("included_credits" >= 0)),
    CONSTRAINT "credit_balances_purchased_non_negative" CHECK (("purchased_credits" >= 0))
);


ALTER TABLE "public"."credit_balances" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_balances" IS 'Current credit balance per account. Denormalized for fast reads.';



COMMENT ON COLUMN "public"."credit_balances"."included_credits_expire_at" IS 'When current included credits expire (end of billing period).';



CREATE TABLE IF NOT EXISTS "public"."credit_included_by_tier" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier" character varying(30) NOT NULL,
    "monthly_credits" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_included_by_tier" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_included_by_tier" IS 'Monthly included credits per subscription tier.';



CREATE TABLE IF NOT EXISTS "public"."credit_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "credit_type" character varying(20) NOT NULL,
    "transaction_type" character varying(30) NOT NULL,
    "feature_type" character varying(30),
    "feature_metadata" "jsonb",
    "idempotency_key" character varying(255),
    "stripe_session_id" character varying(255),
    "stripe_invoice_id" character varying(255),
    "stripe_charge_id" character varying(255),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "credit_ledger_credit_type_check" CHECK ((("credit_type")::"text" = ANY ((ARRAY['included'::character varying, 'purchased'::character varying])::"text"[]))),
    CONSTRAINT "credit_ledger_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['monthly_grant'::character varying, 'monthly_expire'::character varying, 'purchase'::character varying, 'refund'::character varying, 'feature_debit'::character varying, 'feature_refund'::character varying, 'manual_adjust'::character varying, 'promo_grant'::character varying])::"text"[])))
);


ALTER TABLE "public"."credit_ledger" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_ledger" IS 'Immutable audit log of all credit transactions.';



COMMENT ON COLUMN "public"."credit_ledger"."credit_type" IS 'Whether this affects included or purchased credits.';



COMMENT ON COLUMN "public"."credit_ledger"."idempotency_key" IS 'Unique key to prevent duplicate transactions on retries.';



CREATE TABLE IF NOT EXISTS "public"."credit_packs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "credits" integer NOT NULL,
    "price_cents" integer NOT NULL,
    "stripe_price_id" character varying(255),
    "stripe_price_id_recurring" character varying(255),
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_packs" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_packs" IS 'Available credit pack configurations for purchase.';



CREATE TABLE IF NOT EXISTS "public"."credit_pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_type" character varying(30) NOT NULL,
    "rule_key" character varying(50) NOT NULL,
    "credit_cost" integer NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "active_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_pricing_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_pricing_rules" IS 'Configurable pricing for credit-based features.';



CREATE TABLE IF NOT EXISTS "public"."critical_function_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "user_id" "uuid",
    "prompt_page_id" "uuid",
    "platform" "text",
    "error_message" "text" NOT NULL,
    "stack_trace" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_agent" "text",
    "url" "text",
    "additional_context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."critical_function_errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."critical_function_successes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "user_id" "uuid",
    "prompt_page_id" "uuid",
    "platform" "text",
    "duration" integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "additional_context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."critical_function_successes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."critical_function_health" AS
 SELECT "combined"."function_name",
    "date_trunc"('hour'::"text", "combined"."timestamp") AS "hour",
    "count"(*) AS "total_calls",
    "count"(*) FILTER (WHERE ("errors"."id" IS NOT NULL)) AS "error_count",
    "count"(*) FILTER (WHERE ("successes"."id" IS NOT NULL)) AS "success_count",
    "round"(((("count"(*) FILTER (WHERE ("errors"."id" IS NOT NULL)))::numeric / ("count"(*))::numeric) * (100)::numeric), 2) AS "error_rate_percent",
    "avg"("successes"."duration") AS "avg_duration_ms"
   FROM ((( SELECT "critical_function_errors"."function_name",
            "critical_function_errors"."timestamp",
            "critical_function_errors"."id"
           FROM "public"."critical_function_errors"
        UNION ALL
         SELECT "critical_function_successes"."function_name",
            "critical_function_successes"."timestamp",
            "critical_function_successes"."id"
           FROM "public"."critical_function_successes") "combined"
     LEFT JOIN "public"."critical_function_errors" "errors" ON (("errors"."id" = "combined"."id")))
     LEFT JOIN "public"."critical_function_successes" "successes" ON (("successes"."id" = "combined"."id")))
  WHERE ("combined"."timestamp" > ("now"() - '24:00:00'::interval))
  GROUP BY "combined"."function_name", ("date_trunc"('hour'::"text", "combined"."timestamp"))
  ORDER BY ("date_trunc"('hour'::"text", "combined"."timestamp")) DESC, "combined"."function_name";


ALTER TABLE "public"."critical_function_health" OWNER TO "postgres";


COMMENT ON VIEW "public"."critical_function_health" IS 'INTERNAL ADMIN ONLY: Global critical function health metrics across all tenants (function names, failure rates, average runtime). Access restricted to service_role. Query via authenticated admin API routes that check permissions before using service role.';



CREATE TABLE IF NOT EXISTS "public"."daily_stats" (
    "date" "date" NOT NULL,
    "accounts_created_today" integer DEFAULT 0,
    "accounts_deleted_today" integer DEFAULT 0,
    "accounts_total" integer DEFAULT 0,
    "accounts_active" integer DEFAULT 0,
    "accounts_trial" integer DEFAULT 0,
    "accounts_paid" integer DEFAULT 0,
    "reviews_captured_today" integer DEFAULT 0,
    "reviews_deleted_today" integer DEFAULT 0,
    "reviews_total" integer DEFAULT 0,
    "reviews_active" integer DEFAULT 0,
    "active_users_today" integer DEFAULT 0,
    "active_users_7day" integer DEFAULT 0,
    "active_users_30day" integer DEFAULT 0,
    "widgets_created_today" integer DEFAULT 0,
    "widgets_total" integer DEFAULT 0,
    "prompt_pages_created_today" integer DEFAULT 0,
    "prompt_pages_total" integer DEFAULT 0,
    "ai_generations_today" integer DEFAULT 0,
    "gbp_locations_connected" integer DEFAULT 0,
    "gbp_posts_published_today" integer DEFAULT 0,
    "gbp_posts_total" integer DEFAULT 0,
    "gbp_reviews_responded_today" integer DEFAULT 0,
    "gbp_photos_uploaded_today" integer DEFAULT 0,
    "mrr" numeric(12,2) DEFAULT 0,
    "paying_accounts" integer DEFAULT 0,
    "reviews_by_platform" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_domain_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid",
    "domain" "text" NOT NULL,
    "policy_type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_domain_policies_policy_type_check" CHECK (("policy_type" = ANY (ARRAY['whitelist'::"text", 'blacklist'::"text"])))
);


ALTER TABLE "public"."email_domain_policies" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_domain_policies" IS 'Email domain whitelist/blacklist policies for account security';



CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "text_content" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_templates" IS 'Stores email templates for various system emails including review notifications';



COMMENT ON COLUMN "public"."email_templates"."name" IS 'Unique identifier for the template (e.g., welcome, trial_reminder)';



COMMENT ON COLUMN "public"."email_templates"."subject" IS 'Email subject line';



COMMENT ON COLUMN "public"."email_templates"."html_content" IS 'HTML version of the email content with template variables';



COMMENT ON COLUMN "public"."email_templates"."text_content" IS 'Plain text version of the email content with template variables';



COMMENT ON COLUMN "public"."email_templates"."is_active" IS 'Whether this template is currently active';



CREATE TABLE IF NOT EXISTS "public"."faq_contexts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "faq_id" "uuid" NOT NULL,
    "route_pattern" "text" NOT NULL,
    "keywords" "text"[] DEFAULT ARRAY[]::"text"[],
    "priority" integer DEFAULT 50,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "faq_contexts_priority_check" CHECK ((("priority" >= 0) AND ("priority" <= 100)))
);


ALTER TABLE "public"."faq_contexts" OWNER TO "postgres";


COMMENT ON TABLE "public"."faq_contexts" IS 'Maps app routes to relevant FAQs for contextual help system';



COMMENT ON COLUMN "public"."faq_contexts"."route_pattern" IS 'App route pattern (exact match or prefix) to show this FAQ';



COMMENT ON COLUMN "public"."faq_contexts"."keywords" IS 'Keywords for relevance scoring when matching FAQs to routes';



COMMENT ON COLUMN "public"."faq_contexts"."priority" IS 'Priority weight (0-100) for ranking FAQs in context';



CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "category" "text" NOT NULL,
    "plans" "text"[] DEFAULT ARRAY['grower'::"text", 'builder'::"text", 'maven'::"text", 'enterprise'::"text"],
    "order_index" integer DEFAULT 0,
    "article_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "answer_not_empty" CHECK (("length"(TRIM(BOTH FROM "answer")) > 0)),
    CONSTRAINT "question_not_empty" CHECK (("length"(TRIM(BOTH FROM "question")) > 0)),
    CONSTRAINT "valid_plans" CHECK (("plans" <@ ARRAY['grower'::"text", 'builder'::"text", 'maven'::"text", 'enterprise'::"text"]))
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";


COMMENT ON TABLE "public"."faqs" IS 'Frequently Asked Questions with plan-based filtering';



COMMENT ON COLUMN "public"."faqs"."plans" IS 'Array of plan names this FAQ applies to';



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "message" "text" NOT NULL,
    "email" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feedback_category_check" CHECK (("category" = ANY (ARRAY['bug_report'::"text", 'feature_request'::"text", 'general_feedback'::"text"])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback" IS 'User feedback and bug reports. Supports both authenticated and anonymous submissions to ensure no feedback is lost due to auth issues.';



CREATE TABLE IF NOT EXISTS "public"."follow_up_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "communication_record_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "reminder_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "custom_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "follow_up_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['1_week'::"text", '2_weeks'::"text", '3_weeks'::"text", '1_month'::"text", '2_months'::"text", '3_months'::"text", '4_months'::"text", '5_months'::"text", '6_months'::"text"]))),
    CONSTRAINT "follow_up_reminders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."follow_up_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_leaderboard" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_name" character varying(50) NOT NULL,
    "score" integer NOT NULL,
    "level" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_leaderboard" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_leaderboard" IS 'Game leaderboard with RLS enabled. Public read/insert only. UPDATE/DELETE restricted to service_role.';



CREATE TABLE IF NOT EXISTS "public"."game_scores" (
    "id" bigint NOT NULL,
    "player_handle" "text" NOT NULL,
    "email" "text",
    "score" integer NOT NULL,
    "level_reached" integer DEFAULT 1 NOT NULL,
    "play_time_seconds" integer DEFAULT 0,
    "game_data" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "website" "text",
    "business_name" "text",
    CONSTRAINT "check_website_format" CHECK ((("website" IS NULL) OR (("website" ~* '^https?://.+'::"text") AND ("length"("website") <= 255)))),
    CONSTRAINT "game_scores_level_reached_check" CHECK (("level_reached" >= 1)),
    CONSTRAINT "game_scores_play_time_seconds_check" CHECK (("play_time_seconds" >= 0)),
    CONSTRAINT "game_scores_player_handle_check" CHECK ((("length"("player_handle") >= 2) AND ("length"("player_handle") <= 20))),
    CONSTRAINT "game_scores_score_check" CHECK (("score" >= 0))
);


ALTER TABLE "public"."game_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_scores" IS 'Game scores with full security hardening. Direct SELECT revoked - use public_leaderboard view instead. Rate limiting and score validation enforced via triggers.';



COMMENT ON COLUMN "public"."game_scores"."player_handle" IS 'Player chosen display name (2-20 characters)';



COMMENT ON COLUMN "public"."game_scores"."email" IS 'Optional email for marketing leads and score tracking';



COMMENT ON COLUMN "public"."game_scores"."score" IS 'Final game score (authority points)';



COMMENT ON COLUMN "public"."game_scores"."level_reached" IS 'Highest level completed';



COMMENT ON COLUMN "public"."game_scores"."game_data" IS 'Additional game statistics (customers converted, bosses defeated, etc.)';



COMMENT ON COLUMN "public"."game_scores"."website" IS 'Optional player website URL for business promotion and lead generation';



ALTER TABLE "public"."game_scores" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."game_scores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."gbp_change_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text",
    "field_changed" "text" NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "change_source" "text" DEFAULT 'google'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "email_sent" boolean DEFAULT false,
    "email_sent_at" timestamp with time zone,
    "detected_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gbp_alerts_valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."gbp_change_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."gbp_change_alerts" IS 'Pending or resolved change alerts detected by the protection system';



COMMENT ON COLUMN "public"."gbp_change_alerts"."field_changed" IS 'The specific field that was modified: hours, address, phone, website, title, description, categories';



COMMENT ON COLUMN "public"."gbp_change_alerts"."change_source" IS 'Source of the change: google (suggested by Google) or owner (made by profile owner)';



CREATE TABLE IF NOT EXISTS "public"."gbp_location_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text",
    "title" "text",
    "address" "jsonb",
    "phone" "text",
    "website" "text",
    "hours" "jsonb",
    "description" "text",
    "categories" "jsonb",
    "snapshot_hash" "text",
    "snapshot_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gbp_location_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."gbp_location_snapshots" IS 'Stores baseline state of GBP location data for change detection';



COMMENT ON COLUMN "public"."gbp_location_snapshots"."snapshot_hash" IS 'MD5 hash of tracked fields for quick change detection';



CREATE TABLE IF NOT EXISTS "public"."gbp_protection_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true,
    "notification_frequency" "text" DEFAULT 'immediate'::"text",
    "auto_reject_enabled" boolean DEFAULT false,
    "protected_fields" "text"[] DEFAULT ARRAY['hours'::"text", 'address'::"text", 'phone'::"text", 'website'::"text", 'title'::"text", 'description'::"text"],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gbp_settings_valid_frequency" CHECK (("notification_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."gbp_protection_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."gbp_protection_settings" IS 'Per-account settings for GBP profile protection feature';



COMMENT ON COLUMN "public"."gbp_protection_settings"."notification_frequency" IS 'How often to send alerts: immediate, daily digest, or weekly digest';



COMMENT ON COLUMN "public"."gbp_protection_settings"."protected_fields" IS 'Array of field names to monitor for changes';



CREATE TABLE IF NOT EXISTS "public"."gg_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "config_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "check_point" "text" NOT NULL,
    "point_lat" numeric(10,7) NOT NULL,
    "point_lng" numeric(10,7) NOT NULL,
    "position" integer,
    "position_bucket" "text",
    "business_found" boolean DEFAULT false,
    "top_competitors" "jsonb",
    "our_rating" numeric(2,1),
    "our_review_count" integer,
    "our_place_id" "text",
    "checked_at" timestamp with time zone DEFAULT "now"(),
    "api_cost_usd" numeric(10,6),
    "raw_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "search_query" "text",
    CONSTRAINT "gg_checks_position_bucket_check" CHECK (("position_bucket" = ANY (ARRAY['top3'::"text", 'top10'::"text", 'top20'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."gg_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."gg_checks" IS 'Individual rank check results per keyword per point';



COMMENT ON COLUMN "public"."gg_checks"."position_bucket" IS 'Visibility tier: top3, top10, top20, or none';



COMMENT ON COLUMN "public"."gg_checks"."raw_response" IS 'Full DataForSEO response, nulled after 30 days';



COMMENT ON COLUMN "public"."gg_checks"."search_query" IS 'The actual search term used for this check. A keyword concept can have multiple search terms, each tracked separately.';



CREATE TABLE IF NOT EXISTS "public"."gg_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "google_business_location_id" "uuid",
    "center_lat" numeric(10,7) NOT NULL,
    "center_lng" numeric(10,7) NOT NULL,
    "radius_miles" numeric(5,2) DEFAULT 3.0,
    "check_points" "jsonb" DEFAULT '["center", "n", "s", "e", "w"]'::"jsonb",
    "target_place_id" "text",
    "is_enabled" boolean DEFAULT true,
    "last_checked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "schedule_frequency" character varying(20) DEFAULT NULL::character varying,
    "schedule_day_of_week" integer,
    "schedule_day_of_month" integer,
    "schedule_hour" integer DEFAULT 9,
    "next_scheduled_at" timestamp with time zone,
    "last_scheduled_run_at" timestamp with time zone,
    "last_credit_warning_sent_at" timestamp with time zone,
    "location_name" "text",
    CONSTRAINT "gg_configs_schedule_day_of_month_check" CHECK ((("schedule_day_of_month" IS NULL) OR (("schedule_day_of_month" >= 1) AND ("schedule_day_of_month" <= 28)))),
    CONSTRAINT "gg_configs_schedule_day_of_week_check" CHECK ((("schedule_day_of_week" IS NULL) OR (("schedule_day_of_week" >= 0) AND ("schedule_day_of_week" <= 6)))),
    CONSTRAINT "gg_configs_schedule_frequency_check" CHECK ((("schedule_frequency" IS NULL) OR (("schedule_frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::"text"[])))),
    CONSTRAINT "gg_configs_schedule_hour_check" CHECK ((("schedule_hour" >= 0) AND ("schedule_hour" <= 23)))
);


ALTER TABLE "public"."gg_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."gg_configs" IS 'Geo Grid rank tracking configuration per account';



COMMENT ON COLUMN "public"."gg_configs"."check_points" IS 'JSON array of points to check: center, n, s, e, w';



COMMENT ON COLUMN "public"."gg_configs"."target_place_id" IS 'Google Place ID of the business we are tracking';



COMMENT ON COLUMN "public"."gg_configs"."location_name" IS 'Denormalized location name for display. Sync with google_business_locations on update.';



CREATE TABLE IF NOT EXISTS "public"."gg_daily_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "config_id" "uuid" NOT NULL,
    "check_date" "date" NOT NULL,
    "total_keywords_checked" integer,
    "keywords_in_top3" integer,
    "keywords_in_top10" integer,
    "keywords_in_top20" integer,
    "keywords_not_found" integer,
    "point_summaries" "jsonb",
    "total_api_cost_usd" numeric(10,6),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gg_daily_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."gg_daily_summary" IS 'Daily aggregated visibility summaries for trends';



COMMENT ON COLUMN "public"."gg_daily_summary"."point_summaries" IS 'Per-point breakdown: {point: {top3: n, top10: n, ...}}';



CREATE TABLE IF NOT EXISTS "public"."gg_tracked_keywords" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gg_tracked_keywords" OWNER TO "postgres";


COMMENT ON TABLE "public"."gg_tracked_keywords" IS 'Keywords selected for geo grid tracking';



CREATE TABLE IF NOT EXISTS "public"."google_api_rate_limits" (
    "id" bigint NOT NULL,
    "project_id" "text" NOT NULL,
    "last_api_call_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_id" "uuid" NOT NULL
);


ALTER TABLE "public"."google_api_rate_limits" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."google_api_rate_limits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."google_api_rate_limits_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."google_api_rate_limits_id_seq" OWNED BY "public"."google_api_rate_limits"."id";



CREATE TABLE IF NOT EXISTS "public"."google_business_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text" NOT NULL,
    "address" "text",
    "primary_phone" "text",
    "website_uri" "text",
    "status" "text" DEFAULT 'UNKNOWN'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "account_name" "text",
    "google_place_id" "text",
    "lat" double precision,
    "lng" double precision,
    "account_id" "uuid" NOT NULL
);


ALTER TABLE "public"."google_business_locations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."google_business_locations"."account_name" IS 'Full Google Business Profile account identifier (accounts/{id})';



COMMENT ON COLUMN "public"."google_business_locations"."google_place_id" IS 'Google Maps Place ID (ChIJ...) for this location, used for rank tracking';



COMMENT ON COLUMN "public"."google_business_locations"."lat" IS 'Latitude of the business location';



COMMENT ON COLUMN "public"."google_business_locations"."lng" IS 'Longitude of the business location';



COMMENT ON COLUMN "public"."google_business_locations"."account_id" IS 'Account that owns this Google Business location';



CREATE TABLE IF NOT EXISTS "public"."google_business_media_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "description" "text",
    "google_media_name" "text",
    "upload_status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "google_business_media_uploads_upload_status_check" CHECK (("upload_status" = ANY (ARRAY['pending'::"text", 'uploading'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."google_business_media_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_business_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "scopes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "google_email" "text",
    "selected_account_id" "text",
    "selected_account_name" "text",
    "account_id" "uuid" NOT NULL
);


ALTER TABLE "public"."google_business_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."google_business_profiles"."google_email" IS 'The email address of the connected Google account to prevent cross-account token confusion';



COMMENT ON COLUMN "public"."google_business_profiles"."account_id" IS 'Account that owns this Google Business connection';



CREATE TABLE IF NOT EXISTS "public"."google_business_scheduled_post_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scheduled_post_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text",
    "status" "public"."google_business_scheduled_post_result_status" DEFAULT 'pending'::"public"."google_business_scheduled_post_result_status" NOT NULL,
    "published_at" timestamp with time zone,
    "error_message" "text",
    "google_resource_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "platform" "text" DEFAULT 'google'::"text" NOT NULL
);


ALTER TABLE "public"."google_business_scheduled_post_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."google_business_scheduled_post_results" IS 'Per-location execution details for scheduled Google Business actions.';



COMMENT ON COLUMN "public"."google_business_scheduled_post_results"."platform" IS 'Platform for this result: "google", "bluesky", "twitter", "slack"';



CREATE TABLE IF NOT EXISTS "public"."google_business_scheduled_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_kind" "public"."google_business_scheduled_post_kind" DEFAULT 'post'::"public"."google_business_scheduled_post_kind" NOT NULL,
    "post_type" "text",
    "content" "jsonb",
    "caption" "text",
    "scheduled_date" "date",
    "timezone" "text" NOT NULL,
    "selected_locations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "media_paths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "public"."google_business_scheduled_post_status" DEFAULT 'pending'::"public"."google_business_scheduled_post_status" NOT NULL,
    "published_at" timestamp with time zone,
    "error_log" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "additional_platforms" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "queue_order" integer DEFAULT 0,
    "source_type" "text" DEFAULT 'manual'::"text",
    "rss_feed_item_id" "uuid",
    CONSTRAINT "chk_google_business_scheduled_posts_post_type" CHECK (((("post_kind" = 'post'::"public"."google_business_scheduled_post_kind") AND ("post_type" IS NOT NULL)) OR (("post_kind" = 'photo'::"public"."google_business_scheduled_post_kind") AND ("post_type" IS NULL)) OR (("post_kind" = 'post'::"public"."google_business_scheduled_post_kind") AND ("post_type" IS NULL))))
);


ALTER TABLE "public"."google_business_scheduled_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."google_business_scheduled_posts" IS 'Scheduled Google Business posts and photo uploads queued for daily processing.';



COMMENT ON COLUMN "public"."google_business_scheduled_posts"."selected_locations" IS 'JSON array of locations { id, name } for UI rendering and auditing.';



COMMENT ON COLUMN "public"."google_business_scheduled_posts"."media_paths" IS 'Array of Supabase storage objects (bucket, path, size, mime, publicUrl, checksum, originalName).';



COMMENT ON COLUMN "public"."google_business_scheduled_posts"."additional_platforms" IS 'Optional platforms for cross-posting. Structure: {"bluesky": {"enabled": true, "connection_id": "uuid"}, "twitter": {...}, "slack": {...}}';



CREATE TABLE IF NOT EXISTS "public"."invitation_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invitation_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invitation_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['sent'::"text", 'resent'::"text", 'opened'::"text", 'clicked'::"text", 'accepted'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."invitation_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitation_events" IS 'Tracks invitation engagement events for analytics';



COMMENT ON COLUMN "public"."invitation_events"."event_type" IS 'Type of event: sent, resent, opened, clicked, accepted, expired';



COMMENT ON COLUMN "public"."invitation_events"."event_data" IS 'Additional event metadata (email provider, referrer, etc.)';



CREATE TABLE IF NOT EXISTS "public"."keyword_analysis_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "run_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "review_count_analyzed" integer DEFAULT 0 NOT NULL,
    "date_range_start" timestamp with time zone,
    "date_range_end" timestamp with time zone,
    "keywords_analyzed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "results_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_mentions" integer DEFAULT 0 NOT NULL,
    "keywords_with_mentions" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."keyword_analysis_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."keyword_analysis_runs" IS 'Stores historical keyword mention analysis results for tracking trends over time';



COMMENT ON COLUMN "public"."keyword_analysis_runs"."results_json" IS 'Array of keyword results: [{ keyword, mentionCount, reviewIds, excerpts }]';



CREATE TABLE IF NOT EXISTS "public"."keyword_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."keyword_groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."keyword_groups" IS 'Groups for organizing keywords (e.g., General, Seasonal, Services)';



COMMENT ON COLUMN "public"."keyword_groups"."name" IS 'Display name of the group';



COMMENT ON COLUMN "public"."keyword_groups"."display_order" IS 'Order for UI display (lower = first)';



CREATE TABLE IF NOT EXISTS "public"."keyword_prompt_page_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "prompt_page_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "is_in_active_pool" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "rotated_out_at" timestamp with time zone,
    "rotated_in_at" timestamp with time zone,
    "rotation_count" integer DEFAULT 0
);


ALTER TABLE "public"."keyword_prompt_page_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."keyword_prompt_page_usage" IS 'Junction table linking keywords to prompt pages';



COMMENT ON COLUMN "public"."keyword_prompt_page_usage"."is_in_active_pool" IS 'Whether keyword is shown to customers (true) or in reserve (false)';



COMMENT ON COLUMN "public"."keyword_prompt_page_usage"."display_order" IS 'Order for UI display';



COMMENT ON COLUMN "public"."keyword_prompt_page_usage"."rotated_out_at" IS 'When the keyword was last moved to reserve';



COMMENT ON COLUMN "public"."keyword_prompt_page_usage"."rotated_in_at" IS 'When the keyword was last moved to active pool';



COMMENT ON COLUMN "public"."keyword_prompt_page_usage"."rotation_count" IS 'Number of times this keyword has been rotated';



CREATE TABLE IF NOT EXISTS "public"."keyword_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "funnel_stage" "text" DEFAULT 'middle'::"text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "keyword_questions_funnel_stage_check" CHECK (("funnel_stage" = ANY (ARRAY['top'::"text", 'middle'::"text", 'bottom'::"text"])))
);


ALTER TABLE "public"."keyword_questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."keyword_questions" IS 'Normalized table for keyword-related questions with funnel stage tracking. Replaces the JSONB related_questions column on keywords table.';



COMMENT ON COLUMN "public"."keyword_questions"."funnel_stage" IS 'Marketing funnel stage: top (awareness), middle (consideration), bottom (decision)';



CREATE TABLE IF NOT EXISTS "public"."keyword_review_matches_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "review_submission_id" "uuid",
    "google_review_id" "text",
    "matched_at" timestamp with time zone DEFAULT "now"(),
    "matched_phrase" "text",
    "match_type" "text" DEFAULT 'exact'::"text",
    CONSTRAINT "keyword_review_matches_v2_match_type_check" CHECK (("match_type" = ANY (ARRAY['exact'::"text", 'alias'::"text"])))
);


ALTER TABLE "public"."keyword_review_matches_v2" OWNER TO "postgres";


COMMENT ON TABLE "public"."keyword_review_matches_v2" IS 'Tracks which reviews contain which keywords';



COMMENT ON COLUMN "public"."keyword_review_matches_v2"."review_submission_id" IS 'For reviews submitted through PromptReviews';



COMMENT ON COLUMN "public"."keyword_review_matches_v2"."google_review_id" IS 'For reviews from Google Business Profile';



COMMENT ON COLUMN "public"."keyword_review_matches_v2"."matched_phrase" IS 'The actual phrase that was matched in the review text';



COMMENT ON COLUMN "public"."keyword_review_matches_v2"."match_type" IS 'How the keyword was matched: exact (normalized_phrase) or alias';



CREATE TABLE IF NOT EXISTS "public"."keyword_rotation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "prompt_page_id" "uuid" NOT NULL,
    "rotated_out_keyword_id" "uuid",
    "rotated_in_keyword_id" "uuid",
    "trigger_type" "text" NOT NULL,
    "usage_count_at_rotation" integer,
    "threshold_at_rotation" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "keyword_rotation_log_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['auto'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."keyword_rotation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keywords" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "group_id" "uuid",
    "phrase" "text" NOT NULL,
    "normalized_phrase" "text" NOT NULL,
    "word_count" integer NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "review_usage_count" integer DEFAULT 0,
    "last_used_in_review_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "related_questions" "jsonb" DEFAULT '[]'::"jsonb",
    "review_phrase" "text",
    "search_query" "text",
    "aliases" "text"[] DEFAULT '{}'::"text"[],
    "location_scope" "text",
    "ai_generated" boolean DEFAULT false,
    "ai_suggestions" "jsonb",
    "alias_match_count" integer DEFAULT 0,
    "name" "text" NOT NULL,
    "search_intent" "text",
    "keyword_difficulty" integer,
    "search_volume" integer,
    "cpc" numeric(10,2),
    "competition_level" "text",
    "low_top_of_page_bid" numeric(10,2),
    "high_top_of_page_bid" numeric(10,2),
    "categories" "text"[],
    "search_volume_trend" "jsonb",
    "metrics_updated_at" timestamp with time zone,
    "search_terms" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "keywords_competition_level_check" CHECK ((("competition_level" IS NULL) OR ("competition_level" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text"])))),
    CONSTRAINT "keywords_keyword_difficulty_check" CHECK ((("keyword_difficulty" IS NULL) OR (("keyword_difficulty" >= 0) AND ("keyword_difficulty" <= 100)))),
    CONSTRAINT "keywords_location_scope_check" CHECK ((("location_scope" IS NULL) OR ("location_scope" = ANY (ARRAY['local'::"text", 'city'::"text", 'region'::"text", 'state'::"text", 'national'::"text"])))),
    CONSTRAINT "keywords_search_intent_check" CHECK ((("search_intent" IS NULL) OR ("search_intent" = ANY (ARRAY['informational'::"text", 'navigational'::"text", 'commercial'::"text", 'transactional'::"text"])))),
    CONSTRAINT "keywords_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."keywords" OWNER TO "postgres";


COMMENT ON TABLE "public"."keywords" IS 'Central storage for all keywords, account-level';



COMMENT ON COLUMN "public"."keywords"."phrase" IS 'Original keyword phrase as entered by user';



COMMENT ON COLUMN "public"."keywords"."normalized_phrase" IS 'Lowercase, trimmed version for matching';



COMMENT ON COLUMN "public"."keywords"."word_count" IS 'Number of words (for color threshold logic)';



COMMENT ON COLUMN "public"."keywords"."status" IS 'active or paused';



COMMENT ON COLUMN "public"."keywords"."review_usage_count" IS 'Denormalized count of reviews containing this keyword';



COMMENT ON COLUMN "public"."keywords"."related_questions" IS 'Questions/queries related to this keyword (e.g., "Where can I find X?"). AI generates 3-5, users can add up to 10 total.';



COMMENT ON COLUMN "public"."keywords"."review_phrase" IS 'Customer-facing phrase shown on prompt pages (e.g., "best marketing consultant in Portland")';



COMMENT ON COLUMN "public"."keywords"."search_query" IS 'Phrase used for geo-grid tracking and Google searches (e.g., "portland marketing consultant")';



COMMENT ON COLUMN "public"."keywords"."aliases" IS 'Array of variant phrases that should match to this keyword concept';



COMMENT ON COLUMN "public"."keywords"."location_scope" IS 'Geographic scope: local, city, region, state, or national';



COMMENT ON COLUMN "public"."keywords"."ai_generated" IS 'Whether the review_phrase and search_query were AI-generated';



COMMENT ON COLUMN "public"."keywords"."ai_suggestions" IS 'JSON object storing AI recommendations and alternatives';



COMMENT ON COLUMN "public"."keywords"."alias_match_count" IS 'Count of reviews matching via aliases (for SEO tracking). Does not affect rotation.';



COMMENT ON COLUMN "public"."keywords"."name" IS 'Editable display name for the keyword concept';



COMMENT ON COLUMN "public"."keywords"."search_intent" IS 'Primary search intent: informational, navigational, commercial, or transactional';



COMMENT ON COLUMN "public"."keywords"."keyword_difficulty" IS 'SEO difficulty score 0-100 (higher = harder to rank)';



COMMENT ON COLUMN "public"."keywords"."search_volume" IS 'Average monthly search volume';



COMMENT ON COLUMN "public"."keywords"."cpc" IS 'Average cost per click in USD';



COMMENT ON COLUMN "public"."keywords"."competition_level" IS 'PPC competition level: LOW, MEDIUM, or HIGH';



COMMENT ON COLUMN "public"."keywords"."low_top_of_page_bid" IS 'Minimum bid for top of page ad placement';



COMMENT ON COLUMN "public"."keywords"."high_top_of_page_bid" IS 'Maximum bid for top of page ad placement';



COMMENT ON COLUMN "public"."keywords"."categories" IS 'Topic/industry categories for the keyword';



COMMENT ON COLUMN "public"."keywords"."search_volume_trend" IS 'Search volume trends: {monthly: %, quarterly: %, yearly: %}';



COMMENT ON COLUMN "public"."keywords"."metrics_updated_at" IS 'When SEO metrics were last fetched from DataForSEO';



CREATE TABLE IF NOT EXISTS "public"."prompt_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "client_name" "text",
    "category" "text",
    "notes" "text",
    "google_url" "text",
    "yelp_url" "text",
    "facebook_url" "text",
    "review_platforms" "jsonb",
    "services_offered" "jsonb",
    "outcomes" "jsonb",
    "project_type" "text",
    "offer_enabled" boolean DEFAULT false,
    "offer_title" "text" DEFAULT 'Special Offer'::"text",
    "offer_body" "text",
    "is_universal" boolean DEFAULT false,
    "team_member" "text",
    "location" "text",
    "tone_of_voice" "text",
    "date_completed" timestamp with time zone,
    "assigned_team_members" "jsonb",
    "qr_code_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "slug" "text",
    "offer_url" "text",
    "status" "public"."prompt_page_status" DEFAULT 'draft'::"public"."prompt_page_status",
    "offer_learn_more_url" "text",
    "role" "text",
    "friendly_note" "text",
    "falling_icon" "text" DEFAULT 'star'::"text",
    "review_type" "text" DEFAULT 'review'::"text",
    "no_platform_review_template" "text",
    "video_max_length" integer,
    "video_quality" "text",
    "video_preset" "text",
    "video_questions" "jsonb",
    "video_note" "text",
    "video_tips" "text",
    "video_recipient" "text",
    "emoji_sentiment_enabled" boolean DEFAULT false,
    "emoji_sentiment_question" "text",
    "emoji_feedback_message" "text",
    "emoji_thank_you_message" "text",
    "ai_button_enabled" boolean DEFAULT true,
    "product_description" "text",
    "features_or_benefits" "jsonb",
    "product_name" "text",
    "product_photo" "text",
    "product_subcopy" "text",
    "show_friendly_note" boolean DEFAULT true NOT NULL,
    "note_popup_enabled" boolean DEFAULT false,
    "contact_id" "uuid",
    "business_location_id" "uuid",
    "emoji_labels" "text"[] DEFAULT ARRAY['Excellent'::"text", 'Satisfied'::"text", 'Neutral'::"text", 'Unsatisfied'::"text", 'Frustrated'::"text"],
    "ai_review_enabled" boolean DEFAULT true,
    "falling_enabled" boolean DEFAULT true,
    "emoji_feedback_popup_header" "text" DEFAULT 'How can we Improve?'::"text",
    "emoji_feedback_page_header" "text" DEFAULT 'Your feedback helps us grow'::"text",
    "nfc_text_enabled" boolean DEFAULT false,
    "kickstarters_enabled" boolean,
    "selected_kickstarters" "jsonb",
    "kickstarters_background_design" boolean DEFAULT false,
    "fix_grammar_enabled" boolean DEFAULT true,
    "falling_icon_color" "text" DEFAULT '#fbbf24'::"text",
    "recent_reviews_enabled" boolean DEFAULT false,
    "service_description" "text",
    "service_name" "text",
    "type" "public"."prompt_page_type" DEFAULT 'service'::"public"."prompt_page_type",
    "campaign_type" "public"."prompt_page_campaign_type" DEFAULT 'individual'::"public"."prompt_page_campaign_type" NOT NULL,
    "name" "text",
    "photo_context" "text",
    "photo_description" "text",
    "photo_upload_url" "text",
    "photo_display_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "instagram_url" "text",
    "bluesky_url" "text",
    "tiktok_url" "text",
    "youtube_url" "text",
    "linkedin_url" "text",
    "pinterest_url" "text",
    "visibility" "public"."prompt_page_visibility" DEFAULT 'individual'::"public"."prompt_page_visibility",
    "ai_instructions" "text",
    "recent_reviews_scope" "text" DEFAULT 'current_page'::"text",
    "emp_first_name" "text",
    "emp_last_name" "text",
    "emp_pronouns" "text",
    "emp_headshot_url" "text",
    "emp_position" "text",
    "emp_location" "text",
    "emp_years_at_business" "text",
    "emp_bio" "text",
    "emp_fun_facts" "jsonb",
    "emp_skills" "jsonb",
    "emp_review_guidance" "text",
    "eve_name" "text",
    "eve_type" "text",
    "eve_date" "date",
    "eve_location" "text",
    "eve_description" "text",
    "eve_duration" "text",
    "eve_capacity" integer,
    "eve_organizer" "text",
    "eve_special_features" "jsonb",
    "eve_review_guidance" "text",
    "offer_timelock" boolean DEFAULT false,
    "custom_kickstarters" "jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "keywords" "text"[] DEFAULT ARRAY[]::"text"[],
    "keyword_inspiration_enabled" boolean DEFAULT false,
    "selected_keyword_inspirations" "text"[] DEFAULT ARRAY[]::"text"[],
    "sort_order" integer DEFAULT 0,
    "motivational_nudge_enabled" boolean DEFAULT true,
    "motivational_nudge_text" "text" DEFAULT '{business_name} needs your STAR POWER so more people find them online!'::"text",
    "role_field_enabled" boolean DEFAULT false,
    "builder_questions" "jsonb" DEFAULT '[]'::"jsonb",
    "keyword_auto_rotate_enabled" boolean DEFAULT false,
    "keyword_auto_rotate_threshold" integer DEFAULT 16,
    "keyword_active_pool_size" integer DEFAULT 10,
    CONSTRAINT "check_universal_or_location" CHECK (((("is_universal" = true) AND ("business_location_id" IS NULL)) OR ("is_universal" = false))),
    CONSTRAINT "prompt_pages_recent_reviews_scope_check" CHECK (("recent_reviews_scope" = ANY (ARRAY['current_page'::"text", 'all_pages'::"text"])))
);


ALTER TABLE "public"."prompt_pages" OWNER TO "postgres";


COMMENT ON TABLE "public"."prompt_pages" IS 'Prompt pages for collecting reviews. RLS enabled with account-based access for authenticated users. Anonymous users can view any universal prompt pages regardless of status.';



COMMENT ON COLUMN "public"."prompt_pages"."first_name" IS 'First name of the reviewer';



COMMENT ON COLUMN "public"."prompt_pages"."last_name" IS 'Last name of the reviewer';



COMMENT ON COLUMN "public"."prompt_pages"."facebook_url" IS 'URL to the business Facebook page (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."services_offered" IS 'Array of services offered';



COMMENT ON COLUMN "public"."prompt_pages"."outcomes" IS 'Outcomes or results of the project';



COMMENT ON COLUMN "public"."prompt_pages"."project_type" IS 'Type of project or service provided';



COMMENT ON COLUMN "public"."prompt_pages"."offer_enabled" IS 'Whether the featured offer is enabled for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_title" IS 'Title of the featured offer for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_body" IS 'Body/description of the featured offer for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_url" IS 'URL for the learn more page about the offer';



COMMENT ON COLUMN "public"."prompt_pages"."status" IS 'Status of the prompt page. Default is draft for new individual prompt pages.';



COMMENT ON COLUMN "public"."prompt_pages"."role" IS 'Role/Position of the reviewer';



COMMENT ON COLUMN "public"."prompt_pages"."show_friendly_note" IS 'Whether to display the friendly note popup. Should only be true when friendly_note has content.';



COMMENT ON COLUMN "public"."prompt_pages"."contact_id" IS 'Links prompt page to a contact for better organization and relationship management';



COMMENT ON COLUMN "public"."prompt_pages"."ai_review_enabled" IS 'Whether AI review generation is enabled for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."falling_enabled" IS 'Whether the falling stars animation is enabled for this prompt page (default: true for better UX)';



COMMENT ON COLUMN "public"."prompt_pages"."emoji_feedback_popup_header" IS 'Header text shown in the choice modal for negative sentiment users - fixed capitalization';



COMMENT ON COLUMN "public"."prompt_pages"."emoji_feedback_page_header" IS 'Header text shown on the feedback form page';



COMMENT ON COLUMN "public"."prompt_pages"."nfc_text_enabled" IS 'When enabled, QR codes will show "Tap phone or scan with camera" text underneath';



COMMENT ON COLUMN "public"."prompt_pages"."kickstarters_enabled" IS 'Whether kickstarters feature is enabled for this prompt page (overrides business setting if not null)';



COMMENT ON COLUMN "public"."prompt_pages"."selected_kickstarters" IS 'Array of selected kickstarter IDs for this prompt page (overrides business setting if not null)';



COMMENT ON COLUMN "public"."prompt_pages"."kickstarters_background_design" IS 'Design style for kickstarters: false for no background (default), true for background';



COMMENT ON COLUMN "public"."prompt_pages"."fix_grammar_enabled" IS 'Controls whether the "Fix My Grammar" feature is enabled for this prompt page. Defaults to true.';



COMMENT ON COLUMN "public"."prompt_pages"."falling_icon_color" IS 'Hex color value for the falling stars animation icons';



COMMENT ON COLUMN "public"."prompt_pages"."recent_reviews_enabled" IS 'Whether to show Recent Reviews button on public prompt pages (requires 3+ reviews)';



COMMENT ON COLUMN "public"."prompt_pages"."service_description" IS 'Description of the service for service-specific prompt pages';



COMMENT ON COLUMN "public"."prompt_pages"."service_name" IS 'Name of the service for service-specific prompt pages';



COMMENT ON COLUMN "public"."prompt_pages"."type" IS 'Type of prompt page (universal, product, service, custom)';



COMMENT ON COLUMN "public"."prompt_pages"."campaign_type" IS 'Type of campaign: public, individual, universal, or location';



COMMENT ON COLUMN "public"."prompt_pages"."name" IS 'Name of the campaign (required for public campaigns)';



COMMENT ON COLUMN "public"."prompt_pages"."photo_context" IS 'Context or instructions for photo capture';



COMMENT ON COLUMN "public"."prompt_pages"."photo_description" IS 'Description of the photo being requested';



COMMENT ON COLUMN "public"."prompt_pages"."photo_upload_url" IS 'URL where the captured photo is stored';



COMMENT ON COLUMN "public"."prompt_pages"."photo_display_settings" IS 'Settings for how the photo should be displayed (size, position, etc.)';



COMMENT ON COLUMN "public"."prompt_pages"."instagram_url" IS 'URL to the business Instagram profile (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."bluesky_url" IS 'URL to the business Bluesky profile (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."tiktok_url" IS 'URL to the business TikTok profile (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."youtube_url" IS 'URL to the business YouTube channel (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."linkedin_url" IS 'URL to the business LinkedIn page (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."pinterest_url" IS 'URL to the business Pinterest profile (inherited from business profile)';



COMMENT ON COLUMN "public"."prompt_pages"."visibility" IS 'Whether the prompt page is public or individual (personal)';



COMMENT ON COLUMN "public"."prompt_pages"."recent_reviews_scope" IS 'Scope for recent reviews: current_page (reviews from this prompt page only) or all_pages (reviews from all account prompt pages)';



COMMENT ON COLUMN "public"."prompt_pages"."emp_first_name" IS 'Employee first name for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_last_name" IS 'Employee last name for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_pronouns" IS 'Employee pronouns for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_headshot_url" IS 'URL to employee headshot photo for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_position" IS 'Employee job title/position for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_location" IS 'Employee work location/branch for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_years_at_business" IS 'Years employee has worked at business';



COMMENT ON COLUMN "public"."prompt_pages"."emp_bio" IS 'Employee short biography for employee spotlight pages';



COMMENT ON COLUMN "public"."prompt_pages"."emp_fun_facts" IS 'JSON array of fun facts about the employee';



COMMENT ON COLUMN "public"."prompt_pages"."emp_skills" IS 'JSON array of employee skills and competencies';



COMMENT ON COLUMN "public"."prompt_pages"."emp_review_guidance" IS 'What customers should mention in reviews about this employee';



COMMENT ON COLUMN "public"."prompt_pages"."eve_name" IS 'Event name for event review pages';



COMMENT ON COLUMN "public"."prompt_pages"."eve_type" IS 'Type of event (conference, workshop, party, etc.)';



COMMENT ON COLUMN "public"."prompt_pages"."eve_date" IS 'Date when the event took place';



COMMENT ON COLUMN "public"."prompt_pages"."eve_location" IS 'Event venue/location';



COMMENT ON COLUMN "public"."prompt_pages"."eve_description" IS 'Event description and details';



COMMENT ON COLUMN "public"."prompt_pages"."eve_duration" IS 'Event duration (e.g., "2 hours", "3 days")';



COMMENT ON COLUMN "public"."prompt_pages"."eve_capacity" IS 'Maximum number of attendees for the event';



COMMENT ON COLUMN "public"."prompt_pages"."eve_organizer" IS 'Event organizer name or department';



COMMENT ON COLUMN "public"."prompt_pages"."eve_special_features" IS 'JSON array of special features or highlights of the event';



COMMENT ON COLUMN "public"."prompt_pages"."eve_review_guidance" IS 'What attendees should mention in reviews about this event';



COMMENT ON COLUMN "public"."prompt_pages"."offer_timelock" IS 'Enable 3-minute countdown timer for special offers on this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."custom_kickstarters" IS 'Array of custom kickstarter questions for this prompt page (overrides business setting if not null)';



COMMENT ON COLUMN "public"."prompt_pages"."keywords" IS 'Array of keywords for this prompt page. Can include both global keywords from business profile and page-specific keywords.';



COMMENT ON COLUMN "public"."prompt_pages"."keyword_inspiration_enabled" IS 'Whether the keyword inspiration feature is enabled for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."selected_keyword_inspirations" IS 'Selected keywords to display (max 10) from the page keywords';



COMMENT ON COLUMN "public"."prompt_pages"."sort_order" IS 'Manual sort order within each status column for Kanban view';



COMMENT ON COLUMN "public"."prompt_pages"."motivational_nudge_enabled" IS 'Whether the motivational nudge is displayed on the prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."motivational_nudge_text" IS 'The motivational text shown to encourage users to submit reviews';



COMMENT ON COLUMN "public"."prompt_pages"."role_field_enabled" IS 'Whether to show the Role/Occupation input field on the prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."keyword_auto_rotate_enabled" IS 'Whether to automatically rotate overused keywords';



COMMENT ON COLUMN "public"."prompt_pages"."keyword_auto_rotate_threshold" IS 'Usage count at which a keyword should be rotated (default: 16)';



COMMENT ON COLUMN "public"."prompt_pages"."keyword_active_pool_size" IS 'Maximum number of keywords in the active pool (default: 10)';



CREATE OR REPLACE VIEW "public"."keyword_rotation_status" WITH ("security_invoker"='true') AS
 SELECT "kppu"."prompt_page_id",
    "kppu"."account_id",
    "pp"."keyword_auto_rotate_enabled",
    "pp"."keyword_auto_rotate_threshold",
    "pp"."keyword_active_pool_size",
    "count"(*) FILTER (WHERE ("kppu"."is_in_active_pool" = true)) AS "active_pool_count",
    "count"(*) FILTER (WHERE ("kppu"."is_in_active_pool" = false)) AS "reserve_pool_count",
    "count"(*) FILTER (WHERE (("kppu"."is_in_active_pool" = true) AND ("k"."review_usage_count" >= "pp"."keyword_auto_rotate_threshold"))) AS "overused_active_count",
    "count"(*) FILTER (WHERE (("kppu"."is_in_active_pool" = false) AND ("k"."review_usage_count" < "pp"."keyword_auto_rotate_threshold"))) AS "available_reserve_count"
   FROM (("public"."keyword_prompt_page_usage" "kppu"
     JOIN "public"."prompt_pages" "pp" ON (("pp"."id" = "kppu"."prompt_page_id")))
     JOIN "public"."keywords" "k" ON (("k"."id" = "kppu"."keyword_id")))
  GROUP BY "kppu"."prompt_page_id", "kppu"."account_id", "pp"."keyword_auto_rotate_enabled", "pp"."keyword_auto_rotate_threshold", "pp"."keyword_active_pool_size";


ALTER TABLE "public"."keyword_rotation_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."keyword_rotation_status" IS 'Aggregated keyword rotation status per prompt page. Uses SECURITY INVOKER to respect RLS on underlying tables.';



CREATE TABLE IF NOT EXISTS "public"."keyword_set_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword_set_id" "uuid" NOT NULL,
    "google_business_location_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."keyword_set_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_set_terms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword_set_id" "uuid" NOT NULL,
    "phrase" "text" NOT NULL,
    "normalized_phrase" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."keyword_set_terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keyword_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "scope_type" "text" DEFAULT 'account'::"text" NOT NULL,
    "scope_payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."keyword_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kickstarters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "category" "text" NOT NULL,
    "is_default" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "kickstarters_category_check" CHECK (("category" = ANY (ARRAY['PROCESS'::"text", 'EXPERIENCE'::"text", 'OUTCOMES'::"text", 'PEOPLE'::"text"])))
);


ALTER TABLE "public"."kickstarters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."llm_visibility_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "llm_provider" "text" NOT NULL,
    "domain_cited" boolean DEFAULT false NOT NULL,
    "citation_position" integer,
    "citation_url" "text",
    "total_citations" integer DEFAULT 0 NOT NULL,
    "response_snippet" "text",
    "citations" "jsonb",
    "api_cost_usd" numeric(10,6),
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "brand_mentioned" boolean DEFAULT false NOT NULL,
    "mentioned_brands" "jsonb",
    CONSTRAINT "llm_visibility_checks_llm_provider_check" CHECK (("llm_provider" = ANY (ARRAY['chatgpt'::"text", 'claude'::"text", 'gemini'::"text", 'perplexity'::"text"])))
);


ALTER TABLE "public"."llm_visibility_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."llm_visibility_checks" IS 'Individual LLM visibility check results over time';



COMMENT ON COLUMN "public"."llm_visibility_checks"."question" IS 'The question sent to the LLM (from keywords.related_questions)';



COMMENT ON COLUMN "public"."llm_visibility_checks"."llm_provider" IS 'Which AI assistant: chatgpt, claude, gemini, perplexity';



COMMENT ON COLUMN "public"."llm_visibility_checks"."domain_cited" IS 'Whether the business website domain was cited as a source/reference by the AI';



COMMENT ON COLUMN "public"."llm_visibility_checks"."citation_position" IS '1-based position in citations list (NULL if not cited)';



COMMENT ON COLUMN "public"."llm_visibility_checks"."citations" IS 'Full citation data: [{domain, url, title, position, isOurs}]';



COMMENT ON COLUMN "public"."llm_visibility_checks"."brand_mentioned" IS 'Whether the business name was mentioned in the AI response text';



COMMENT ON COLUMN "public"."llm_visibility_checks"."mentioned_brands" IS 'Array of brand entities mentioned in the AI response (from DataForSEO brand_entities field)';



CREATE TABLE IF NOT EXISTS "public"."llm_visibility_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "providers" "text"[] DEFAULT ARRAY['chatgpt'::"text"] NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "schedule_frequency" "text",
    "schedule_day_of_week" integer,
    "schedule_day_of_month" integer,
    "schedule_hour" integer DEFAULT 9 NOT NULL,
    "next_scheduled_at" timestamp with time zone,
    "last_scheduled_run_at" timestamp with time zone,
    "last_credit_warning_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "llm_visibility_schedules_schedule_day_of_month_check" CHECK ((("schedule_day_of_month" >= 1) AND ("schedule_day_of_month" <= 28))),
    CONSTRAINT "llm_visibility_schedules_schedule_day_of_week_check" CHECK ((("schedule_day_of_week" >= 0) AND ("schedule_day_of_week" <= 6))),
    CONSTRAINT "llm_visibility_schedules_schedule_frequency_check" CHECK (("schedule_frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "llm_visibility_schedules_schedule_hour_check" CHECK ((("schedule_hour" >= 0) AND ("schedule_hour" <= 23)))
);


ALTER TABLE "public"."llm_visibility_schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."llm_visibility_schedules" IS 'Scheduling configuration for automated LLM visibility checks';



COMMENT ON COLUMN "public"."llm_visibility_schedules"."providers" IS 'Which LLMs to check: chatgpt, claude, gemini, perplexity';



CREATE TABLE IF NOT EXISTS "public"."llm_visibility_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "questions_with_citation" integer DEFAULT 0 NOT NULL,
    "visibility_score" numeric(5,2),
    "provider_stats" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_checked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."llm_visibility_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."llm_visibility_summary" IS 'Aggregated LLM visibility metrics per keyword';



COMMENT ON COLUMN "public"."llm_visibility_summary"."visibility_score" IS 'Percentage of questions where domain was cited (0-100)';



COMMENT ON COLUMN "public"."llm_visibility_summary"."provider_stats" IS 'Per-provider stats: {chatgpt: {checked, cited, avgPosition}, ...}';



CREATE TABLE IF NOT EXISTS "public"."media_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" "text" NOT NULL,
    "url" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "alt_text" "text",
    "caption" "text",
    "article_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uploaded_by" "uuid",
    CONSTRAINT "valid_url" CHECK (("url" ~ '^https?://.*'::"text"))
);


ALTER TABLE "public"."media_assets" OWNER TO "postgres";


COMMENT ON TABLE "public"."media_assets" IS 'Images, videos, and other media used in documentation';



CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "mentioned_user_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    CONSTRAINT "mentions_source_type_check" CHECK (("source_type" = ANY (ARRAY['post'::"text", 'comment'::"text"])))
);


ALTER TABLE "public"."mentions" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentions" IS '@mentions for notifications - tied to user, not account';



CREATE TABLE IF NOT EXISTS "public"."metadata_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_type" "public"."prompt_page_type" NOT NULL,
    "title_template" "text",
    "description_template" "text",
    "og_title_template" "text",
    "og_description_template" "text",
    "og_image_template" "text",
    "twitter_title_template" "text",
    "twitter_description_template" "text",
    "twitter_image_template" "text",
    "keywords_template" "text",
    "canonical_url_template" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."metadata_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."metadata_templates" IS 'Templates for SEO and social media metadata for different prompt page types';



COMMENT ON COLUMN "public"."metadata_templates"."page_type" IS 'Type of prompt page this template applies to';



COMMENT ON COLUMN "public"."metadata_templates"."title_template" IS 'Page title template with variable placeholders';



COMMENT ON COLUMN "public"."metadata_templates"."description_template" IS 'Meta description template with variable placeholders';



COMMENT ON COLUMN "public"."metadata_templates"."og_title_template" IS 'Open Graph title template';



COMMENT ON COLUMN "public"."metadata_templates"."og_description_template" IS 'Open Graph description template';



COMMENT ON COLUMN "public"."metadata_templates"."keywords_template" IS 'Meta keywords template with variable placeholders';



CREATE TABLE IF NOT EXISTS "public"."navigation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "title" "text" NOT NULL,
    "href" "text",
    "icon_name" "text",
    "order_index" integer DEFAULT 0,
    "visibility" "text"[] DEFAULT ARRAY['docs'::"text", 'help'::"text"],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "valid_visibility" CHECK (("visibility" <@ ARRAY['docs'::"text", 'help'::"text"]))
);


ALTER TABLE "public"."navigation" OWNER TO "postgres";


COMMENT ON TABLE "public"."navigation" IS 'Hierarchical navigation structure for docs site and help modal';



COMMENT ON COLUMN "public"."navigation"."visibility" IS 'Where this nav item appears: docs site, help modal, or both';



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "in_app_gbp_changes" boolean DEFAULT true,
    "in_app_new_reviews" boolean DEFAULT true,
    "in_app_team_updates" boolean DEFAULT true,
    "in_app_subscription_updates" boolean DEFAULT true,
    "in_app_announcements" boolean DEFAULT true,
    "email_gbp_changes" boolean DEFAULT true,
    "email_new_reviews" boolean DEFAULT true,
    "email_team_updates" boolean DEFAULT true,
    "email_subscription_updates" boolean DEFAULT true,
    "email_announcements" boolean DEFAULT false,
    "email_digest_frequency" "text" DEFAULT 'immediate'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "in_app_review_auto_verified" boolean DEFAULT true,
    "email_review_auto_verified" boolean DEFAULT true,
    "in_app_credit_warnings" boolean DEFAULT true,
    "email_credit_warnings" boolean DEFAULT true,
    CONSTRAINT "notification_preferences_email_digest_frequency_check" CHECK (("email_digest_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "action_url" "text",
    "action_label" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "dismissed" boolean DEFAULT false,
    "dismissed_at" timestamp with time zone,
    "email_sent" boolean DEFAULT false,
    "email_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "task_id" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."optimizer_email_sends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "email_type" character varying(50) NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "success" boolean DEFAULT false NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."optimizer_email_sends" OWNER TO "postgres";


COMMENT ON TABLE "public"."optimizer_email_sends" IS 'Tracks automated email sends for Google Biz Optimizer leads';



COMMENT ON COLUMN "public"."optimizer_email_sends"."lead_id" IS 'References the optimizer lead who received the email';



COMMENT ON COLUMN "public"."optimizer_email_sends"."email_type" IS 'Type of email sent (welcome, followup, nurture_tips, nurture_case_study, trial_offer)';



COMMENT ON COLUMN "public"."optimizer_email_sends"."sent_at" IS 'When the email was sent';



COMMENT ON COLUMN "public"."optimizer_email_sends"."success" IS 'Whether the email was sent successfully';



COMMENT ON COLUMN "public"."optimizer_email_sends"."error_message" IS 'Error message if send failed';



CREATE TABLE IF NOT EXISTS "public"."optimizer_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "business_name" "text",
    "google_maps_url" "text",
    "source_business" character varying(100) DEFAULT 'promptreviews'::character varying,
    "source_domain" character varying(255),
    "lead_segment" character varying(50),
    "business_size" character varying(50),
    "industry" character varying(80),
    "utm_source" character varying(100),
    "utm_medium" character varying(100),
    "utm_campaign" character varying(100),
    "referrer_url" "text",
    "lead_score" integer,
    "lead_status" character varying(50) DEFAULT 'new'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_analysis_date" timestamp with time zone,
    "pdf_downloaded" boolean DEFAULT false,
    "pdf_download_date" timestamp with time zone,
    "signed_up_for_trial" boolean DEFAULT false,
    "trial_start_date" timestamp with time zone,
    "converted_to_customer" boolean DEFAULT false,
    "customer_conversion_date" timestamp with time zone,
    "google_account_email" character varying(255),
    "place_id" character varying(255),
    "location_name" "text",
    "location_address" "text",
    "email_unsubscribed" boolean DEFAULT false,
    "email_unsubscribed_at" timestamp with time zone
);


ALTER TABLE "public"."optimizer_leads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."optimizer_leads"."email_unsubscribed" IS 'Whether the lead has unsubscribed from emails';



COMMENT ON COLUMN "public"."optimizer_leads"."email_unsubscribed_at" IS 'When the lead unsubscribed from emails';



CREATE TABLE IF NOT EXISTS "public"."optimizer_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_token_hash" character(64) NOT NULL,
    "session_scope" "jsonb" DEFAULT '{}'::"jsonb",
    "session_key_version" character varying(32) DEFAULT 'v1'::character varying,
    "email" character varying(255),
    "lead_id" "uuid",
    "google_access_token_cipher" "text",
    "google_refresh_token_cipher" "text",
    "google_token_iv" "text",
    "google_token_key_version" character varying(32),
    "google_token_expires_at" timestamp with time zone,
    "api_calls_count" integer DEFAULT 0,
    "last_api_call_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:45:00'::interval) NOT NULL
);


ALTER TABLE "public"."optimizer_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_metrics" (
    "metric_name" "text" NOT NULL,
    "metric_value" bigint DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "valid_comment_length" CHECK ((("char_length"("body") > 0) AND ("char_length"("body") <= 2000)))
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_comments" IS 'Comments on posts - single-level threading only';



CREATE TABLE IF NOT EXISTS "public"."post_reactions" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "post_reactions_reaction_check" CHECK (("reaction" = ANY (ARRAY['thumbs_up'::"text", 'star'::"text", 'celebrate'::"text", 'clap'::"text", 'laugh'::"text"])))
);


ALTER TABLE "public"."post_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_reactions" IS 'Emoji reactions to posts - one per user per reaction type';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "external_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "account_id" "uuid" NOT NULL,
    CONSTRAINT "valid_body_length" CHECK ((("body" IS NULL) OR ("char_length"("body") <= 5000))),
    CONSTRAINT "valid_external_url" CHECK ((("external_url" IS NULL) OR ("external_url" ~* '^https?://'::"text"))),
    CONSTRAINT "valid_title_length" CHECK ((("char_length"("title") > 0) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."posts" IS 'Global community posts - visible to all authenticated users';



COMMENT ON COLUMN "public"."posts"."deleted_at" IS 'Soft delete timestamp for moderation';



CREATE OR REPLACE VIEW "public"."public_leaderboard" AS
 SELECT "game_scores"."player_handle",
    "game_scores"."business_name",
    "game_scores"."score",
    "game_scores"."level_reached",
    "game_scores"."created_at",
    "game_scores"."website",
        CASE
            WHEN ("game_scores"."email" IS NOT NULL) THEN
            CASE
                WHEN (POSITION(('@'::"text") IN ("game_scores"."email")) > 0) THEN ('***@'::"text" || "split_part"("game_scores"."email", '@'::"text", 2))
                ELSE '***'::"text"
            END
            ELSE NULL::"text"
        END AS "email_domain"
   FROM "public"."game_scores"
  ORDER BY "game_scores"."score" DESC, "game_scores"."created_at"
 LIMIT 100;


ALTER TABLE "public"."public_leaderboard" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_leaderboard" IS 'Public game leaderboard view with masked emails. Access restricted to service_role. Query via /api/game/leaderboard endpoint which provides rate limiting and caching. Direct client access prevented to avoid scraping and abuse.';



CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "author" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "button_text" "text",
    "button_url" "text"
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotes" IS 'Admin quotes table - now uses accounts.is_admin for permission checking';



COMMENT ON COLUMN "public"."quotes"."button_text" IS 'Optional button text to display with the quote';



COMMENT ON COLUMN "public"."quotes"."button_url" IS 'Optional URL for the button link';



CREATE TABLE IF NOT EXISTS "public"."rank_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "group_id" "uuid",
    "keyword_id" "uuid" NOT NULL,
    "search_query_used" "text" NOT NULL,
    "location_code" integer,
    "location_name" "text",
    "device" "text",
    "position" integer,
    "found_url" "text",
    "matched_target_url" boolean,
    "serp_features" "jsonb",
    "top_competitors" "jsonb",
    "api_cost_usd" numeric(10,6),
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "paa_question_count" integer DEFAULT 0,
    "paa_ours_count" integer DEFAULT 0,
    "ai_overview_present" boolean DEFAULT false,
    "ai_overview_ours_cited" boolean DEFAULT false,
    "ai_overview_citation_count" integer DEFAULT 0,
    "featured_snippet_present" boolean DEFAULT false,
    "featured_snippet_ours" boolean DEFAULT false,
    CONSTRAINT "rank_checks_device_check" CHECK (("device" = ANY (ARRAY['desktop'::"text", 'mobile'::"text"])))
);


ALTER TABLE "public"."rank_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."rank_checks" IS 'Individual rank check results over time';



COMMENT ON COLUMN "public"."rank_checks"."search_query_used" IS 'Actual query sent to API (from keywords.search_query or keywords.phrase)';



COMMENT ON COLUMN "public"."rank_checks"."serp_features" IS 'Detected SERP features: featured snippet, map pack, FAQ, images, etc.';



COMMENT ON COLUMN "public"."rank_checks"."top_competitors" IS 'Top 10 competing domains with positions';



COMMENT ON COLUMN "public"."rank_checks"."paa_question_count" IS 'Number of People Also Ask questions found in SERP';



COMMENT ON COLUMN "public"."rank_checks"."paa_ours_count" IS 'Number of PAA questions where our domain is the answer source';



COMMENT ON COLUMN "public"."rank_checks"."ai_overview_present" IS 'Whether AI Overview appeared in the SERP';



COMMENT ON COLUMN "public"."rank_checks"."ai_overview_ours_cited" IS 'Whether our domain is cited in the AI Overview';



COMMENT ON COLUMN "public"."rank_checks"."ai_overview_citation_count" IS 'Total number of citations in the AI Overview';



COMMENT ON COLUMN "public"."rank_checks"."featured_snippet_present" IS 'Whether a featured snippet appeared in the SERP';



COMMENT ON COLUMN "public"."rank_checks"."featured_snippet_ours" IS 'Whether our domain owns the featured snippet';



CREATE TABLE IF NOT EXISTS "public"."rank_discovery_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "usage_date" "date" NOT NULL,
    "keywords_discovered" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rank_discovery_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."rank_discovery_usage" IS 'Daily limit tracking for keyword discovery feature';



COMMENT ON COLUMN "public"."rank_discovery_usage"."keywords_discovered" IS 'Number of keywords discovered via DataForSEO autocomplete today';



CREATE TABLE IF NOT EXISTS "public"."rank_group_keywords" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "keyword_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "target_url" "text",
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rank_group_keywords" OWNER TO "postgres";


COMMENT ON TABLE "public"."rank_group_keywords" IS 'Junction table linking keyword concepts to groups';



COMMENT ON COLUMN "public"."rank_group_keywords"."target_url" IS 'Expected URL to rank (for cannibalization alerts)';



CREATE TABLE IF NOT EXISTS "public"."rank_keyword_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "device" "text" NOT NULL,
    "location_code" integer NOT NULL,
    "location_name" "text" NOT NULL,
    "schedule_frequency" "text",
    "schedule_day_of_week" integer,
    "schedule_day_of_month" integer,
    "schedule_hour" integer DEFAULT 9 NOT NULL,
    "next_scheduled_at" timestamp with time zone,
    "last_scheduled_run_at" timestamp with time zone,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "last_checked_at" timestamp with time zone,
    "last_credit_warning_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rank_keyword_groups_device_check" CHECK (("device" = ANY (ARRAY['desktop'::"text", 'mobile'::"text"]))),
    CONSTRAINT "rank_keyword_groups_schedule_day_of_month_check" CHECK ((("schedule_day_of_month" >= 1) AND ("schedule_day_of_month" <= 28))),
    CONSTRAINT "rank_keyword_groups_schedule_day_of_week_check" CHECK ((("schedule_day_of_week" >= 0) AND ("schedule_day_of_week" <= 6))),
    CONSTRAINT "rank_keyword_groups_schedule_frequency_check" CHECK (("schedule_frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "rank_keyword_groups_schedule_hour_check" CHECK ((("schedule_hour" >= 0) AND ("schedule_hour" <= 23)))
);


ALTER TABLE "public"."rank_keyword_groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."rank_keyword_groups" IS 'Keyword groups defined by device + location + schedule';



COMMENT ON COLUMN "public"."rank_keyword_groups"."location_code" IS 'DataForSEO location code';



COMMENT ON COLUMN "public"."rank_keyword_groups"."schedule_frequency" IS 'How often to check: daily, weekly, monthly';



CREATE TABLE IF NOT EXISTS "public"."rank_locations" (
    "id" integer NOT NULL,
    "location_code" integer NOT NULL,
    "location_name" "text" NOT NULL,
    "location_type" "text",
    "country_iso_code" "text",
    "location_code_parent" integer,
    "canonical_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rank_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."rank_locations" IS 'Cached DataForSEO location codes for fast lookups';



COMMENT ON COLUMN "public"."rank_locations"."location_name" IS 'Primary location name (e.g., "Portland")';



COMMENT ON COLUMN "public"."rank_locations"."canonical_name" IS 'Full hierarchy (e.g., "Portland, Oregon, United States")';



CREATE SEQUENCE IF NOT EXISTS "public"."rank_locations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."rank_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rank_locations_id_seq" OWNED BY "public"."rank_locations"."id";



CREATE TABLE IF NOT EXISTS "public"."rate_limit_counters" (
    "key" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "reset_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limit_counters" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."reactivation_metrics" AS
 SELECT "count"(DISTINCT "accounts"."id") AS "total_reactivations",
    ("avg"((EXTRACT(epoch FROM ("accounts"."reactivated_at" - "accounts"."deleted_at")) / (86400)::numeric)))::integer AS "avg_days_to_return",
    "max"("accounts"."reactivation_count") AS "max_reactivations_per_user",
    "count"(DISTINCT "accounts"."id") FILTER (WHERE ("accounts"."reactivated_at" > ("now"() - '30 days'::interval))) AS "reactivations_last_30_days",
    "count"(DISTINCT "accounts"."id") FILTER (WHERE ("accounts"."reactivated_at" > ("now"() - '7 days'::interval))) AS "reactivations_last_7_days"
   FROM "public"."accounts"
  WHERE ("accounts"."reactivated_at" IS NOT NULL);


ALTER TABLE "public"."reactivation_metrics" OWNER TO "postgres";


COMMENT ON VIEW "public"."reactivation_metrics" IS 'INTERNAL ADMIN ONLY: Global account reactivation metrics across all tenants. Access restricted to service_role. Query via authenticated admin API routes that check permissions before using service role.';



CREATE TABLE IF NOT EXISTS "public"."review_drafts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "prompt_page_id" "uuid",
    "platform" "text",
    "review_text" "text",
    "regeneration_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_keyword_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "keyword_term_id" "uuid" NOT NULL,
    "keyword_set_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "google_business_location_id" "uuid",
    "google_location_id" "text",
    "google_location_name" "text",
    "matched_phrase" "text" NOT NULL,
    "matched_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_keyword_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_reminder_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "account_id" "uuid" NOT NULL,
    "location_id" "text",
    "review_ids" "text"[],
    "reminder_type" "text" DEFAULT 'monthly_review'::"text",
    "sent_at" timestamp without time zone DEFAULT "now"(),
    "success" boolean,
    "error_message" "text",
    "email_sent_to" "text",
    "review_count" integer DEFAULT 0
);


ALTER TABLE "public"."review_reminder_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."review_reminder_logs"."account_id" IS 'Account associated with this reminder log entry';



CREATE TABLE IF NOT EXISTS "public"."review_reminder_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "enabled" boolean DEFAULT true,
    "frequency" "text" DEFAULT 'monthly'::"text",
    "last_reminder_sent" timestamp without time zone,
    "last_review_check" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "account_id" "uuid" NOT NULL,
    CONSTRAINT "review_reminder_settings_frequency_check" CHECK (("frequency" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'disabled'::"text"])))
);


ALTER TABLE "public"."review_reminder_settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."review_reminder_settings"."account_id" IS 'Account that owns these reminder settings';



CREATE TABLE IF NOT EXISTS "public"."review_share_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "platform" "public"."share_platform" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."review_share_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."review_share_events" IS 'Tracks social sharing events for reviews. Each row represents a single share action. Account isolation enforced via RLS policies.';



COMMENT ON COLUMN "public"."review_share_events"."review_id" IS 'UUID of the review (from review_submissions or widget_reviews). Validation enforced in API layer.';



COMMENT ON COLUMN "public"."review_share_events"."account_id" IS 'Account ID for isolation. CRITICAL for security - ensures users only see their own data.';



COMMENT ON COLUMN "public"."review_share_events"."platform" IS 'Social platform where review was shared. Uses share_platform enum.';



COMMENT ON COLUMN "public"."review_share_events"."timestamp" IS 'When the share occurred. Used for analytics and sorting.';



CREATE TABLE IF NOT EXISTS "public"."review_share_images" (
    "id" "text" NOT NULL,
    "review_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "image_type" "text" DEFAULT 'quote_card'::"text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."review_share_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."review_share_images" IS 'Tracks generated share images for reviews to enable caching and cleanup';



CREATE TABLE IF NOT EXISTS "public"."review_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_page_id" "uuid",
    "platform" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" NOT NULL,
    "user_agent" "text",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewer_name" "text",
    "reviewer_role" "text",
    "review_content" "text",
    "review_group_id" "uuid" DEFAULT "gen_random_uuid"(),
    "photo_url" "text",
    "emoji_sentiment_selection" character varying(32),
    "first_name" character varying(100),
    "last_name" character varying(100),
    "email" character varying(255),
    "phone" character varying(50),
    "prompt_page_type" "text",
    "review_type" "text",
    "verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "platform_url" "text",
    "business_id" "uuid",
    "google_review_id" "text",
    "imported_from_google" boolean DEFAULT false,
    "star_rating" integer,
    "contact_id" "uuid",
    "account_id" "uuid",
    "auto_verification_status" "text" DEFAULT 'pending'::"text",
    "auto_verified_at" timestamp with time zone,
    "verification_attempts" integer DEFAULT 0,
    "last_verification_attempt_at" timestamp with time zone,
    "review_text_copy" "text",
    "verification_match_score" numeric(3,2),
    "google_business_location_id" "uuid",
    "google_location_id" "text",
    "google_location_name" "text",
    "location_name" "text",
    "business_location_id" "uuid",
    "source_channel" "public"."review_source_channel" DEFAULT 'unknown'::"public"."review_source_channel",
    "source_id" "uuid",
    "communication_record_id" "uuid",
    "widget_id" "uuid",
    "referrer_url" "text",
    "utm_params" "jsonb" DEFAULT '{}'::"jsonb",
    "entry_url" "text",
    "customer_confirmed" "text",
    "customer_confirmed_at" timestamp with time zone,
    "builder_answers" "jsonb",
    "builder_keywords" "text"[] DEFAULT ARRAY[]::"text"[],
    CONSTRAINT "review_submissions_auto_verification_status_check" CHECK (("auto_verification_status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'not_found'::"text", 'failed'::"text"]))),
    CONSTRAINT "review_submissions_customer_confirmed_check" CHECK (("customer_confirmed" = ANY (ARRAY['confirmed'::"text", 'needs_help'::"text"]))),
    CONSTRAINT "review_submissions_status_check" CHECK (("status" = ANY (ARRAY['clicked'::"text", 'submitted'::"text"]))),
    CONSTRAINT "reviewer_name_required" CHECK ((("reviewer_name" IS NOT NULL) AND ("reviewer_name" <> ''::"text")))
);


ALTER TABLE "public"."review_submissions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."review_submissions"."prompt_page_id" IS 'Foreign key to prompt_pages. Can be NULL for imported reviews that were not collected through a prompt page.';



COMMENT ON COLUMN "public"."review_submissions"."reviewer_name" IS 'Name of the reviewer (required)';



COMMENT ON COLUMN "public"."review_submissions"."reviewer_role" IS 'Role/Position/Occupation of the reviewer (optional)';



COMMENT ON COLUMN "public"."review_submissions"."review_content" IS 'The actual review content submitted';



COMMENT ON COLUMN "public"."review_submissions"."review_group_id" IS 'Groups multiple reviews from the same user';



COMMENT ON COLUMN "public"."review_submissions"."google_review_id" IS 'Google Review ID from GBP API if matched';



COMMENT ON COLUMN "public"."review_submissions"."account_id" IS 'Account ID from the associated prompt_page, auto-populated via trigger for account isolation';



COMMENT ON COLUMN "public"."review_submissions"."auto_verification_status" IS 'Automated verification status: pending, verified, not_found, failed. Backfilled for existing reviews.';



COMMENT ON COLUMN "public"."review_submissions"."auto_verified_at" IS 'Timestamp when review was automatically verified via API';



COMMENT ON COLUMN "public"."review_submissions"."verification_attempts" IS 'Number of times auto-verification has been attempted';



COMMENT ON COLUMN "public"."review_submissions"."last_verification_attempt_at" IS 'Last time auto-verification was attempted';



COMMENT ON COLUMN "public"."review_submissions"."review_text_copy" IS 'Copy of review text that was submitted for matching';



COMMENT ON COLUMN "public"."review_submissions"."verification_match_score" IS 'Confidence score (0-1) of the automated match';



COMMENT ON COLUMN "public"."review_submissions"."source_channel" IS 'The channel through which the reviewer arrived (email, widget, QR, etc.)';



COMMENT ON COLUMN "public"."review_submissions"."source_id" IS 'Generic source identifier (deprecated, use specific *_id fields)';



COMMENT ON COLUMN "public"."review_submissions"."communication_record_id" IS 'Links to the email/SMS campaign that generated this review';



COMMENT ON COLUMN "public"."review_submissions"."widget_id" IS 'Links to the widget CTA that generated this review';



COMMENT ON COLUMN "public"."review_submissions"."referrer_url" IS 'HTTP referrer URL when the reviewer arrived at the prompt page';



COMMENT ON COLUMN "public"."review_submissions"."utm_params" IS 'UTM tracking parameters captured from the entry URL';



COMMENT ON COLUMN "public"."review_submissions"."entry_url" IS 'Full URL the reviewer used to access the prompt page';



COMMENT ON COLUMN "public"."review_submissions"."customer_confirmed" IS 'Customer confirmation status: "confirmed" if review was helpful, "needs_help" if customer needs assistance';



COMMENT ON COLUMN "public"."review_submissions"."customer_confirmed_at" IS 'Timestamp when customer provided confirmation feedback';



CREATE TABLE IF NOT EXISTS "public"."rss_feed_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_source_id" "uuid" NOT NULL,
    "item_guid" "text" NOT NULL,
    "item_url" "text",
    "title" "text",
    "description" "text",
    "image_url" "text",
    "published_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "scheduled_post_id" "uuid",
    "skip_reason" "text",
    "error_message" "text",
    "discovered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "rss_feed_items_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'scheduled'::"text", 'skipped'::"text", 'failed'::"text", 'initial_sync'::"text"])))
);


ALTER TABLE "public"."rss_feed_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."rss_feed_items" IS 'Tracks RSS items discovered and processed for auto-posting';



COMMENT ON COLUMN "public"."rss_feed_items"."item_guid" IS 'Unique identifier from RSS feed (guid or link)';



COMMENT ON COLUMN "public"."rss_feed_items"."status" IS 'pending=new, scheduled=post created, skipped=filtered out, failed=error, initial_sync=existed when feed was connected';



COMMENT ON COLUMN "public"."rss_feed_items"."skip_reason" IS 'Why item was skipped: insufficient_credits, daily_limit, duplicate, etc.';



CREATE TABLE IF NOT EXISTS "public"."rss_feed_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "feed_url" "text" NOT NULL,
    "feed_name" "text" NOT NULL,
    "polling_interval_minutes" integer DEFAULT 10080 NOT NULL,
    "last_polled_at" timestamp with time zone,
    "last_successful_poll_at" timestamp with time zone,
    "post_template" "text" DEFAULT '{title}

{description}'::"text" NOT NULL,
    "include_link" boolean DEFAULT true NOT NULL,
    "max_content_length" integer DEFAULT 1500 NOT NULL,
    "target_locations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "additional_platforms" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "posts_today" integer DEFAULT 0 NOT NULL,
    "posts_today_reset_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auto_post" boolean DEFAULT true NOT NULL,
    "auto_post_interval_days" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "rss_feed_sources_auto_post_interval_check" CHECK ((("auto_post_interval_days" >= 1) AND ("auto_post_interval_days" <= 30))),
    CONSTRAINT "rss_feed_sources_max_content_length_check" CHECK ((("max_content_length" >= 100) AND ("max_content_length" <= 4096))),
    CONSTRAINT "rss_feed_sources_polling_interval_minutes_check" CHECK (("polling_interval_minutes" >= 120))
);


ALTER TABLE "public"."rss_feed_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."rss_feed_sources" IS 'RSS feed configurations for auto-posting to GBP and Bluesky';



COMMENT ON COLUMN "public"."rss_feed_sources"."post_template" IS 'Template with tokens: {title}, {description}, {link}';



COMMENT ON COLUMN "public"."rss_feed_sources"."target_locations" IS 'Array of GBP location objects: [{ id, name }]';



COMMENT ON COLUMN "public"."rss_feed_sources"."additional_platforms" IS 'Cross-posting config: { bluesky: { enabled, connectionId } }';



CREATE TABLE IF NOT EXISTS "public"."selected_gbp_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text" NOT NULL,
    "address" "text",
    "selected_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "include_in_insights" boolean DEFAULT true
);


ALTER TABLE "public"."selected_gbp_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."selected_gbp_locations" IS 'Stores which Google Business Profile locations are selected for management per account';



COMMENT ON COLUMN "public"."selected_gbp_locations"."include_in_insights" IS 'Whether this location should be included in monthly insight emails';



CREATE TABLE IF NOT EXISTS "public"."sentiment_analysis_runs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "run_date" timestamp with time zone DEFAULT "now"(),
    "review_count_analyzed" integer NOT NULL,
    "date_range_start" timestamp with time zone NOT NULL,
    "date_range_end" timestamp with time zone NOT NULL,
    "plan_at_time" character varying(50) NOT NULL,
    "results_json" "jsonb" NOT NULL,
    "analysis_version" character varying(20) DEFAULT '1.0'::character varying,
    "processing_time_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sentiment_analysis_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."sentiment_analysis_runs" IS 'Stores historical sentiment analysis results for business reviews';



COMMENT ON COLUMN "public"."sentiment_analysis_runs"."plan_at_time" IS 'The account plan (grower, builder, maven) at the time of analysis';



COMMENT ON COLUMN "public"."sentiment_analysis_runs"."results_json" IS 'Full SentimentAnalysisResult object with summary and detailed metrics';



CREATE TABLE IF NOT EXISTS "public"."sidebar_favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "nav_item_path" character varying(255) NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sidebar_favorites" OWNER TO "postgres";


COMMENT ON TABLE "public"."sidebar_favorites" IS 'Stores user-pinned navigation items in the sidebar, per account';



CREATE TABLE IF NOT EXISTS "public"."social_platform_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "platform" "public"."social_platform_type" NOT NULL,
    "credentials" "jsonb" NOT NULL,
    "status" "public"."social_connection_status" DEFAULT 'active'::"public"."social_connection_status" NOT NULL,
    "metadata" "jsonb",
    "last_validated_at" timestamp with time zone,
    "error_message" "text",
    "error_details" "jsonb",
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."social_platform_connections" OWNER TO "postgres";


COMMENT ON TABLE "public"."social_platform_connections" IS 'Social platform credentials for multi-platform posting (Bluesky, Twitter/X, Slack). Google Business uses google_business_profiles.';



COMMENT ON COLUMN "public"."social_platform_connections"."account_id" IS 'Account that owns this connection. Enforces account isolation.';



COMMENT ON COLUMN "public"."social_platform_connections"."credentials" IS 'Encrypted platform credentials (tokens, passwords). Structure varies by platform.';



COMMENT ON COLUMN "public"."social_platform_connections"."metadata" IS 'Platform-specific display metadata (usernames, team names, etc.). Safe to expose to UI.';



CREATE TABLE IF NOT EXISTS "public"."trial_reminder_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trial_reminder_logs_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['trial_reminder'::"text", 'trial_expired'::"text"])))
);


ALTER TABLE "public"."trial_reminder_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."trial_reminder_logs" IS 'Tracks trial reminder emails sent to users to prevent duplicates';



COMMENT ON COLUMN "public"."trial_reminder_logs"."account_id" IS 'The account that received the reminder';



COMMENT ON COLUMN "public"."trial_reminder_logs"."email" IS 'The email address the reminder was sent to';



COMMENT ON COLUMN "public"."trial_reminder_logs"."reminder_type" IS 'Type of reminder (trial_reminder or trial_expired)';



COMMENT ON COLUMN "public"."trial_reminder_logs"."sent_at" IS 'When the reminder was sent';



COMMENT ON COLUMN "public"."trial_reminder_logs"."success" IS 'Whether the email was sent successfully';



COMMENT ON COLUMN "public"."trial_reminder_logs"."error_message" IS 'Error message if the email failed to send';



CREATE TABLE IF NOT EXISTS "public"."widget_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_id" "uuid" NOT NULL,
    "review_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "reviewer_role" "text",
    "review_content" "text" NOT NULL,
    "star_rating" numeric(2,1) DEFAULT 5,
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer,
    "emoji_sentiment_selection" character varying(32),
    "email" character varying(255),
    "phone" character varying(50),
    "prompt_page_type" "text",
    "review_type" "text",
    "verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "platform_url" "text",
    "business_id" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'submitted'::"text",
    "user_agent" "text",
    "ip_address" "text",
    "review_group_id" "uuid" DEFAULT "gen_random_uuid"(),
    "photo_url" "text",
    CONSTRAINT "widget_reviews_star_rating_check" CHECK ((("star_rating" >= 1.0) AND ("star_rating" <= 5.0) AND (("star_rating" * (2)::numeric) = "floor"(("star_rating" * (2)::numeric)))))
);


ALTER TABLE "public"."widget_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."widgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "theme" "jsonb" DEFAULT '{}'::"jsonb",
    "review_count" integer DEFAULT 5,
    "widget_type" "text" DEFAULT 'multi'::"text",
    "submit_reviews_enabled" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "name" "text" NOT NULL,
    CONSTRAINT "widgets_type_check" CHECK (("type" = ANY (ARRAY['single'::"text", 'multi'::"text", 'photo'::"text"]))),
    CONSTRAINT "widgets_widget_type_check" CHECK (("widget_type" = ANY (ARRAY['single'::"text", 'multi'::"text", 'photo'::"text"])))
);


ALTER TABLE "public"."widgets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."widgets"."theme" IS 'Widget theme settings including glassmorphic properties: backdropBlur (0-20), borderWidth (0-3), borderColor (CSS color), glassmorphism (boolean)';



CREATE TABLE IF NOT EXISTS "public"."wm_boards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text",
    "status_labels" "jsonb" DEFAULT '{"done": "Done", "todo": "To Do", "review": "Review", "backlog": "Backlog", "in_progress": "In Progress"}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wm_boards" OWNER TO "postgres";


COMMENT ON TABLE "public"."wm_boards" IS 'Work Manager boards - one per account for agency task management';



COMMENT ON COLUMN "public"."wm_boards"."status_labels" IS 'Custom labels for status columns: backlog, todo, in_progress, review, done';



CREATE TABLE IF NOT EXISTS "public"."wm_task_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "activity_type" "public"."wm_action_type" NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wm_task_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."wm_task_actions" IS 'Work Manager task activity log - tracks changes and notes';



CREATE TABLE IF NOT EXISTS "public"."wm_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."wm_task_status" DEFAULT 'backlog'::"public"."wm_task_status" NOT NULL,
    "priority" "public"."wm_task_priority" DEFAULT 'medium'::"public"."wm_task_priority",
    "due_date" timestamp with time zone,
    "assigned_to" "uuid",
    "sort_order" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wm_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."wm_tasks" IS 'Work Manager tasks - individual work items on a board';



COMMENT ON COLUMN "public"."wm_tasks"."sort_order" IS 'Order within a status column for drag-and-drop';



ALTER TABLE ONLY "public"."google_api_rate_limits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."google_api_rate_limits_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rank_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rank_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."account_events"
    ADD CONSTRAINT "account_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_invitations"
    ADD CONSTRAINT "account_invitations_account_id_email_key" UNIQUE ("account_id", "email");



ALTER TABLE ONLY "public"."account_invitations"
    ADD CONSTRAINT "account_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_invitations"
    ADD CONSTRAINT "account_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_unique_user_account" UNIQUE ("user_id", "account_id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_enrichment_usage"
    ADD CONSTRAINT "ai_enrichment_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_keyword_generation_usage"
    ADD CONSTRAINT "ai_keyword_generation_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_contexts"
    ADD CONSTRAINT "article_contexts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_revisions"
    ADD CONSTRAINT "article_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_audit_log"
    ADD CONSTRAINT "billing_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_locations"
    ADD CONSTRAINT "business_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comeback_email_logs"
    ADD CONSTRAINT "comeback_email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("comment_id", "user_id", "reaction");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_templates"
    ADD CONSTRAINT "communication_templates_account_id_communication_type_templ_key" UNIQUE ("account_id", "communication_type", "template_type", "is_default") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."communication_templates"
    ADD CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_profiles"
    ADD CONSTRAINT "community_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."community_profiles"
    ADD CONSTRAINT "community_profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."comparison_categories"
    ADD CONSTRAINT "comparison_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparison_categories"
    ADD CONSTRAINT "comparison_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comparison_features"
    ADD CONSTRAINT "comparison_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparison_features"
    ADD CONSTRAINT "comparison_features_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comparison_tables"
    ADD CONSTRAINT "comparison_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparison_tables"
    ADD CONSTRAINT "comparison_tables_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."competitor_features"
    ADD CONSTRAINT "competitor_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competitors"
    ADD CONSTRAINT "competitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competitors"
    ADD CONSTRAINT "competitors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."concept_schedules"
    ADD CONSTRAINT "concept_schedules_account_id_keyword_id_key" UNIQUE ("account_id", "keyword_id");



ALTER TABLE ONLY "public"."concept_schedules"
    ADD CONSTRAINT "concept_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_account_unique" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_included_by_tier"
    ADD CONSTRAINT "credit_included_by_tier_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_included_by_tier"
    ADD CONSTRAINT "credit_included_by_tier_tier_key" UNIQUE ("tier");



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_packs"
    ADD CONSTRAINT "credit_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_pricing_rules"
    ADD CONSTRAINT "credit_pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_pricing_rules"
    ADD CONSTRAINT "credit_pricing_rules_unique" UNIQUE ("feature_type", "rule_key", "active_from");



ALTER TABLE ONLY "public"."critical_function_errors"
    ADD CONSTRAINT "critical_function_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."critical_function_successes"
    ADD CONSTRAINT "critical_function_successes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_stats"
    ADD CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("date");



ALTER TABLE ONLY "public"."email_domain_policies"
    ADD CONSTRAINT "email_domain_policies_account_id_domain_policy_type_key" UNIQUE ("account_id", "domain", "policy_type");



ALTER TABLE ONLY "public"."email_domain_policies"
    ADD CONSTRAINT "email_domain_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq_contexts"
    ADD CONSTRAINT "faq_contexts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_up_reminders"
    ADD CONSTRAINT "follow_up_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_leaderboard"
    ADD CONSTRAINT "game_leaderboard_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_scores"
    ADD CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gbp_change_alerts"
    ADD CONSTRAINT "gbp_change_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gbp_location_snapshots"
    ADD CONSTRAINT "gbp_location_snapshots_account_id_location_id_key" UNIQUE ("account_id", "location_id");



ALTER TABLE ONLY "public"."gbp_location_snapshots"
    ADD CONSTRAINT "gbp_location_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gbp_protection_settings"
    ADD CONSTRAINT "gbp_protection_settings_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."gbp_protection_settings"
    ADD CONSTRAINT "gbp_protection_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gg_checks"
    ADD CONSTRAINT "gg_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gg_configs"
    ADD CONSTRAINT "gg_configs_account_location_unique" UNIQUE ("account_id", "google_business_location_id");



COMMENT ON CONSTRAINT "gg_configs_account_location_unique" ON "public"."gg_configs" IS 'One ranking grid config per business location per account. Maven accounts can have up to 10.';



ALTER TABLE ONLY "public"."gg_configs"
    ADD CONSTRAINT "gg_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gg_daily_summary"
    ADD CONSTRAINT "gg_daily_summary_config_date_unique" UNIQUE ("config_id", "check_date");



ALTER TABLE ONLY "public"."gg_daily_summary"
    ADD CONSTRAINT "gg_daily_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gg_tracked_keywords"
    ADD CONSTRAINT "gg_tracked_keywords_config_id_keyword_id_key" UNIQUE ("config_id", "keyword_id");



ALTER TABLE ONLY "public"."gg_tracked_keywords"
    ADD CONSTRAINT "gg_tracked_keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_api_rate_limits"
    ADD CONSTRAINT "google_api_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_api_rate_limits"
    ADD CONSTRAINT "google_api_rate_limits_project_account_unique" UNIQUE ("project_id", "account_id");



ALTER TABLE ONLY "public"."google_business_locations"
    ADD CONSTRAINT "google_business_locations_account_location" UNIQUE ("account_id", "location_id");



ALTER TABLE ONLY "public"."google_business_locations"
    ADD CONSTRAINT "google_business_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_media_uploads"
    ADD CONSTRAINT "google_business_media_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_profiles"
    ADD CONSTRAINT "google_business_profiles_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."google_business_profiles"
    ADD CONSTRAINT "google_business_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_scheduled_post_results"
    ADD CONSTRAINT "google_business_scheduled_post_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_scheduled_posts"
    ADD CONSTRAINT "google_business_scheduled_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_events"
    ADD CONSTRAINT "invitation_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_analysis_runs"
    ADD CONSTRAINT "keyword_analysis_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_groups"
    ADD CONSTRAINT "keyword_groups_account_id_name_key" UNIQUE ("account_id", "name");



ALTER TABLE ONLY "public"."keyword_groups"
    ADD CONSTRAINT "keyword_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_prompt_page_usage"
    ADD CONSTRAINT "keyword_prompt_page_usage_keyword_id_prompt_page_id_key" UNIQUE ("keyword_id", "prompt_page_id");



ALTER TABLE ONLY "public"."keyword_prompt_page_usage"
    ADD CONSTRAINT "keyword_prompt_page_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_questions"
    ADD CONSTRAINT "keyword_questions_keyword_id_question_key" UNIQUE ("keyword_id", "question");



ALTER TABLE ONLY "public"."keyword_questions"
    ADD CONSTRAINT "keyword_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "keyword_review_matches_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_set_locations"
    ADD CONSTRAINT "keyword_set_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_set_terms"
    ADD CONSTRAINT "keyword_set_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keyword_sets"
    ADD CONSTRAINT "keyword_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keywords"
    ADD CONSTRAINT "keywords_account_id_normalized_phrase_key" UNIQUE ("account_id", "normalized_phrase");



ALTER TABLE ONLY "public"."keywords"
    ADD CONSTRAINT "keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kickstarters"
    ADD CONSTRAINT "kickstarters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_visibility_checks"
    ADD CONSTRAINT "llm_visibility_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_visibility_schedules"
    ADD CONSTRAINT "llm_visibility_schedules_account_id_keyword_id_key" UNIQUE ("account_id", "keyword_id");



ALTER TABLE ONLY "public"."llm_visibility_schedules"
    ADD CONSTRAINT "llm_visibility_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_visibility_summary"
    ADD CONSTRAINT "llm_visibility_summary_account_id_keyword_id_key" UNIQUE ("account_id", "keyword_id");



ALTER TABLE ONLY "public"."llm_visibility_summary"
    ADD CONSTRAINT "llm_visibility_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metadata_templates"
    ADD CONSTRAINT "metadata_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation"
    ADD CONSTRAINT "navigation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_account_id_task_id_key" UNIQUE ("account_id", "task_id");



ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."optimizer_email_sends"
    ADD CONSTRAINT "optimizer_email_sends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."optimizer_leads"
    ADD CONSTRAINT "optimizer_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."optimizer_sessions"
    ADD CONSTRAINT "optimizer_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."optimizer_sessions"
    ADD CONSTRAINT "optimizer_sessions_session_token_hash_key" UNIQUE ("session_token_hash");



ALTER TABLE ONLY "public"."platform_metrics"
    ADD CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("metric_name");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("post_id", "user_id", "reaction");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_actions"
    ADD CONSTRAINT "prompt_page_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_checks"
    ADD CONSTRAINT "rank_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_discovery_usage"
    ADD CONSTRAINT "rank_discovery_usage_account_id_usage_date_key" UNIQUE ("account_id", "usage_date");



ALTER TABLE ONLY "public"."rank_discovery_usage"
    ADD CONSTRAINT "rank_discovery_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_group_keywords"
    ADD CONSTRAINT "rank_group_keywords_group_id_keyword_id_key" UNIQUE ("group_id", "keyword_id");



ALTER TABLE ONLY "public"."rank_group_keywords"
    ADD CONSTRAINT "rank_group_keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_keyword_groups"
    ADD CONSTRAINT "rank_keyword_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_locations"
    ADD CONSTRAINT "rank_locations_location_code_key" UNIQUE ("location_code");



ALTER TABLE ONLY "public"."rank_locations"
    ADD CONSTRAINT "rank_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_counters"
    ADD CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."review_drafts"
    ADD CONSTRAINT "review_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_reminder_logs"
    ADD CONSTRAINT "review_reminder_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_reminder_settings"
    ADD CONSTRAINT "review_reminder_settings_account_unique" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."review_reminder_settings"
    ADD CONSTRAINT "review_reminder_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_share_events"
    ADD CONSTRAINT "review_share_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_share_images"
    ADD CONSTRAINT "review_share_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rss_feed_items"
    ADD CONSTRAINT "rss_feed_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rss_feed_sources"
    ADD CONSTRAINT "rss_feed_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."selected_gbp_locations"
    ADD CONSTRAINT "selected_gbp_locations_account_id_location_id_key" UNIQUE ("account_id", "location_id");



ALTER TABLE ONLY "public"."selected_gbp_locations"
    ADD CONSTRAINT "selected_gbp_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sentiment_analysis_runs"
    ADD CONSTRAINT "sentiment_analysis_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sidebar_favorites"
    ADD CONSTRAINT "sidebar_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trial_reminder_logs"
    ADD CONSTRAINT "trial_reminder_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sidebar_favorites"
    ADD CONSTRAINT "unique_account_favorite" UNIQUE ("account_id", "nav_item_path");



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "unique_account_platform" UNIQUE ("account_id", "platform");



ALTER TABLE ONLY "public"."article_contexts"
    ADD CONSTRAINT "unique_article_route" UNIQUE ("article_id", "route_pattern");



ALTER TABLE ONLY "public"."competitor_features"
    ADD CONSTRAINT "unique_competitor_feature" UNIQUE ("competitor_id", "feature_id");



ALTER TABLE ONLY "public"."faq_contexts"
    ADD CONSTRAINT "unique_faq_route" UNIQUE ("faq_id", "route_pattern");



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "unique_keyword_google_review" UNIQUE ("keyword_id", "google_review_id");



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "unique_keyword_review_submission" UNIQUE ("keyword_id", "review_submission_id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "unique_user_account" UNIQUE ("user_id", "account_id");



ALTER TABLE ONLY "public"."widget_reviews"
    ADD CONSTRAINT "widget_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widgets"
    ADD CONSTRAINT "widgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wm_boards"
    ADD CONSTRAINT "wm_boards_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."wm_boards"
    ADD CONSTRAINT "wm_boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wm_task_actions"
    ADD CONSTRAINT "wm_task_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wm_tasks"
    ADD CONSTRAINT "wm_tasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "contacts_account_id_idx" ON "public"."contacts" USING "btree" ("account_id");



CREATE INDEX "contacts_email_idx" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "contacts_phone_idx" ON "public"."contacts" USING "btree" ("phone");



CREATE INDEX "idx_account_events_account" ON "public"."account_events" USING "btree" ("account_id");



CREATE INDEX "idx_account_events_created" ON "public"."account_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_account_events_type" ON "public"."account_events" USING "btree" ("event_type");



CREATE INDEX "idx_account_invitations_account_id" ON "public"."account_invitations" USING "btree" ("account_id");



CREATE INDEX "idx_account_invitations_cleanup" ON "public"."account_invitations" USING "btree" ("expires_at", "accepted_at") WHERE ("accepted_at" IS NULL);



COMMENT ON INDEX "public"."idx_account_invitations_cleanup" IS 'Optimizes expired invitation cleanup queries';



CREATE INDEX "idx_account_invitations_email" ON "public"."account_invitations" USING "btree" ("email");



CREATE INDEX "idx_account_invitations_email_account_expires" ON "public"."account_invitations" USING "btree" ("email", "account_id", "expires_at") WHERE ("accepted_at" IS NULL);



CREATE INDEX "idx_account_invitations_expires_at" ON "public"."account_invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_account_invitations_pending" ON "public"."account_invitations" USING "btree" ("account_id", "accepted_at", "expires_at") WHERE ("accepted_at" IS NULL);



COMMENT ON INDEX "public"."idx_account_invitations_pending" IS 'Optimizes pending invitation queries for management UI';



CREATE INDEX "idx_account_invitations_token" ON "public"."account_invitations" USING "btree" ("token");



CREATE INDEX "idx_account_users_account_id" ON "public"."account_users" USING "btree" ("account_id");



CREATE INDEX "idx_account_users_business_name" ON "public"."account_users" USING "btree" ("business_name");



CREATE INDEX "idx_account_users_role" ON "public"."account_users" USING "btree" ("role");



CREATE INDEX "idx_account_users_user_account" ON "public"."account_users" USING "btree" ("user_id", "account_id");



CREATE INDEX "idx_account_users_user_email" ON "public"."account_users" USING "btree" ("user_email");



CREATE INDEX "idx_account_users_user_id" ON "public"."account_users" USING "btree" ("user_id");



CREATE INDEX "idx_accounts_billing_period" ON "public"."accounts" USING "btree" ("billing_period");



CREATE INDEX "idx_accounts_client_account" ON "public"."accounts" USING "btree" ("is_client_account") WHERE (("is_client_account" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_accounts_created_at" ON "public"."accounts" USING "btree" ("created_at");



CREATE INDEX "idx_accounts_created_by" ON "public"."accounts" USING "btree" ("created_by");



CREATE INDEX "idx_accounts_deleted_at" ON "public"."accounts" USING "btree" ("deleted_at");



CREATE INDEX "idx_accounts_deleted_cleanup" ON "public"."accounts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_accounts_id" ON "public"."accounts" USING "btree" ("id");



CREATE INDEX "idx_accounts_is_admin" ON "public"."accounts" USING "btree" ("is_admin") WHERE ("is_admin" = true);



CREATE INDEX "idx_accounts_onboarding_step" ON "public"."accounts" USING "btree" ("onboarding_step");



CREATE INDEX "idx_accounts_plan" ON "public"."accounts" USING "btree" ("plan");



CREATE INDEX "idx_accounts_plan_trial_end" ON "public"."accounts" USING "btree" ("plan", "trial_end");



CREATE INDEX "idx_accounts_promotion_code" ON "public"."accounts" USING "btree" ("promotion_code") WHERE ("promotion_code" IS NOT NULL);



CREATE INDEX "idx_accounts_trial_end" ON "public"."accounts" USING "btree" ("trial_end");



CREATE INDEX "idx_ai_enrichment_usage_account_date" ON "public"."ai_enrichment_usage" USING "btree" ("account_id", "created_at");



CREATE INDEX "idx_ai_enrichment_usage_user_date" ON "public"."ai_enrichment_usage" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_ai_keyword_generation_usage_account_date" ON "public"."ai_keyword_generation_usage" USING "btree" ("account_id", "created_at");



CREATE INDEX "idx_ai_keyword_generation_usage_user_date" ON "public"."ai_keyword_generation_usage" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_ai_usage_account_feature" ON "public"."ai_usage" USING "btree" ("account_id", "feature_type", "created_at");



CREATE INDEX "idx_ai_usage_account_id" ON "public"."ai_usage" USING "btree" ("account_id");



CREATE INDEX "idx_ai_usage_created_at" ON "public"."ai_usage" USING "btree" ("created_at");



CREATE INDEX "idx_ai_usage_feature_type" ON "public"."ai_usage" USING "btree" ("feature_type");



CREATE INDEX "idx_ai_usage_user_feature_created" ON "public"."ai_usage" USING "btree" ("user_id", "feature_type", "created_at" DESC);



CREATE INDEX "idx_ai_usage_user_id" ON "public"."ai_usage" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_metadata" ON "public"."analytics_events" USING "gin" ("metadata");



CREATE INDEX "idx_analytics_events_platform" ON "public"."analytics_events" USING "btree" ("platform");



CREATE INDEX "idx_analytics_events_prompt_page_id" ON "public"."analytics_events" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_announcements_active" ON "public"."announcements" USING "btree" ("is_active");



CREATE INDEX "idx_article_contexts_article_id" ON "public"."article_contexts" USING "btree" ("article_id");



CREATE INDEX "idx_article_contexts_keywords" ON "public"."article_contexts" USING "gin" ("keywords");



CREATE INDEX "idx_article_contexts_priority" ON "public"."article_contexts" USING "btree" ("priority" DESC);



CREATE INDEX "idx_article_contexts_route" ON "public"."article_contexts" USING "btree" ("route_pattern");



CREATE INDEX "idx_article_revisions_article_id" ON "public"."article_revisions" USING "btree" ("article_id");



CREATE INDEX "idx_article_revisions_created_at" ON "public"."article_revisions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_article_revisions_editor_id" ON "public"."article_revisions" USING "btree" ("editor_id");



CREATE INDEX "idx_articles_created_at" ON "public"."articles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_articles_metadata_category" ON "public"."articles" USING "btree" ((("metadata" ->> 'category'::"text")));



CREATE INDEX "idx_articles_metadata_tags" ON "public"."articles" USING "gin" ((("metadata" -> 'tags'::"text")));



CREATE INDEX "idx_articles_published_at" ON "public"."articles" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_articles_search" ON "public"."articles" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "content")));



CREATE INDEX "idx_articles_slug" ON "public"."articles" USING "btree" ("slug");



CREATE INDEX "idx_articles_status" ON "public"."articles" USING "btree" ("status");



CREATE INDEX "idx_articles_updated_at" ON "public"."articles" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_audit_logs_account_id" ON "public"."audit_logs" USING "btree" ("account_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_event_category" ON "public"."audit_logs" USING "btree" ("event_category");



CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING "btree" ("event_type");



CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_billing_audit_account_id" ON "public"."billing_audit_log" USING "btree" ("account_id");



CREATE INDEX "idx_billing_audit_created_at" ON "public"."billing_audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_billing_audit_event_type" ON "public"."billing_audit_log" USING "btree" ("event_type");



CREATE INDEX "idx_billing_audit_stripe_customer" ON "public"."billing_audit_log" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_billing_audit_stripe_subscription" ON "public"."billing_audit_log" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_business_locations_account" ON "public"."business_locations" USING "btree" ("account_id", "id");



CREATE INDEX "idx_business_locations_account_id" ON "public"."business_locations" USING "btree" ("account_id");



CREATE INDEX "idx_business_locations_active" ON "public"."business_locations" USING "btree" ("account_id", "is_active");



CREATE INDEX "idx_businesses_account_id" ON "public"."businesses" USING "btree" ("account_id");



COMMENT ON INDEX "public"."idx_businesses_account_id" IS 'Performance optimization for prompt page API endpoint - business joins';



CREATE INDEX "idx_businesses_account_name" ON "public"."businesses" USING "btree" ("account_id", "name");



CREATE INDEX "idx_businesses_created_at" ON "public"."businesses" USING "btree" ("created_at");



CREATE INDEX "idx_businesses_default_keyword_inspiration_enabled" ON "public"."businesses" USING "btree" ("default_keyword_inspiration_enabled") WHERE ("default_keyword_inspiration_enabled" = true);



CREATE INDEX "idx_businesses_name_trgm" ON "public"."businesses" USING "gin" ("name" "public"."gin_trgm_ops");



COMMENT ON INDEX "public"."idx_businesses_name_trgm" IS 'Performance optimization for business name search';



CREATE INDEX "idx_businesses_profile" ON "public"."businesses" USING "btree" ("account_id", "name", "logo_url", "business_website");



CREATE INDEX "idx_campaign_actions_account_id" ON "public"."campaign_actions" USING "btree" ("account_id");



CREATE INDEX "idx_campaign_actions_activity_type" ON "public"."campaign_actions" USING "btree" ("activity_type");



CREATE INDEX "idx_campaign_actions_created_at" ON "public"."campaign_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_campaign_actions_prompt_page_id" ON "public"."campaign_actions" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_channels_active_sort" ON "public"."channels" USING "btree" ("is_active", "sort_order") WHERE ("is_active" = true);



CREATE INDEX "idx_channels_slug" ON "public"."channels" USING "btree" ("slug");



CREATE INDEX "idx_comeback_email_logs_account_id" ON "public"."comeback_email_logs" USING "btree" ("account_id");



CREATE INDEX "idx_comeback_email_logs_email_type" ON "public"."comeback_email_logs" USING "btree" ("email_type");



CREATE INDEX "idx_comeback_email_logs_sent_at" ON "public"."comeback_email_logs" USING "btree" ("sent_at" DESC);



CREATE UNIQUE INDEX "idx_comeback_email_logs_unique_send" ON "public"."comeback_email_logs" USING "btree" ("account_id", "email_type");



CREATE INDEX "idx_comment_reactions_comment" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reactions_comment_id" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reactions_user" ON "public"."comment_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_comment_reactions_user_id" ON "public"."comment_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_comments_account_id" ON "public"."comments" USING "btree" ("account_id");



CREATE INDEX "idx_comments_author_id" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_communication_records_account_id" ON "public"."communication_records" USING "btree" ("account_id");



CREATE INDEX "idx_communication_records_contact_id" ON "public"."communication_records" USING "btree" ("contact_id");



CREATE INDEX "idx_communication_records_prompt_page_id" ON "public"."communication_records" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_communication_records_sent_at" ON "public"."communication_records" USING "btree" ("sent_at");



CREATE INDEX "idx_communication_records_status" ON "public"."communication_records" USING "btree" ("status");



CREATE INDEX "idx_communication_templates_account_id" ON "public"."communication_templates" USING "btree" ("account_id");



CREATE INDEX "idx_communication_templates_type" ON "public"."communication_templates" USING "btree" ("communication_type", "template_type");



CREATE INDEX "idx_community_profiles_opted_in" ON "public"."community_profiles" USING "btree" ("opted_in_at") WHERE ("opted_in_at" IS NOT NULL);



CREATE INDEX "idx_community_profiles_username" ON "public"."community_profiles" USING "btree" ("username");



CREATE INDEX "idx_comparison_categories_order" ON "public"."comparison_categories" USING "btree" ("display_order");



CREATE INDEX "idx_comparison_categories_slug" ON "public"."comparison_categories" USING "btree" ("slug");



CREATE INDEX "idx_comparison_features_category_id" ON "public"."comparison_features" USING "btree" ("category_id");



CREATE INDEX "idx_comparison_features_order" ON "public"."comparison_features" USING "btree" ("category_id", "display_order");



CREATE INDEX "idx_comparison_features_slug" ON "public"."comparison_features" USING "btree" ("slug");



CREATE INDEX "idx_comparison_tables_published_at" ON "public"."comparison_tables" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_comparison_tables_slug" ON "public"."comparison_tables" USING "btree" ("slug");



CREATE INDEX "idx_comparison_tables_status" ON "public"."comparison_tables" USING "btree" ("status");



CREATE INDEX "idx_comparison_tables_type" ON "public"."comparison_tables" USING "btree" ("table_type");



CREATE INDEX "idx_competitor_features_competitor_id" ON "public"."competitor_features" USING "btree" ("competitor_id");



CREATE INDEX "idx_competitor_features_feature_id" ON "public"."competitor_features" USING "btree" ("feature_id");



CREATE INDEX "idx_competitors_order" ON "public"."competitors" USING "btree" ("display_order");



CREATE INDEX "idx_competitors_slug" ON "public"."competitors" USING "btree" ("slug");



CREATE INDEX "idx_competitors_status" ON "public"."competitors" USING "btree" ("status");



CREATE INDEX "idx_concept_schedules_account" ON "public"."concept_schedules" USING "btree" ("account_id");



CREATE INDEX "idx_concept_schedules_keyword" ON "public"."concept_schedules" USING "btree" ("keyword_id");



CREATE INDEX "idx_concept_schedules_next_scheduled" ON "public"."concept_schedules" USING "btree" ("next_scheduled_at") WHERE (("is_enabled" = true) AND ("schedule_frequency" IS NOT NULL));



CREATE INDEX "idx_contacts_account_created" ON "public"."contacts" USING "btree" ("account_id", "created_at" DESC);



CREATE INDEX "idx_contacts_account_id" ON "public"."contacts" USING "btree" ("account_id");



CREATE INDEX "idx_contacts_account_id_rls" ON "public"."contacts" USING "btree" ("account_id");



CREATE INDEX "idx_contacts_business_name" ON "public"."contacts" USING "btree" ("business_name");



CREATE INDEX "idx_contacts_category" ON "public"."contacts" USING "btree" ("category");



CREATE INDEX "idx_contacts_city" ON "public"."contacts" USING "btree" ("city");



CREATE INDEX "idx_contacts_country" ON "public"."contacts" USING "btree" ("country");



CREATE INDEX "idx_contacts_created_at" ON "public"."contacts" USING "btree" ("created_at");



CREATE INDEX "idx_contacts_email" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "idx_contacts_imported_from_google" ON "public"."contacts" USING "btree" ("imported_from_google");



CREATE INDEX "idx_contacts_location" ON "public"."contacts" USING "btree" ("city", "state", "country");



CREATE INDEX "idx_contacts_phone" ON "public"."contacts" USING "btree" ("phone");



CREATE INDEX "idx_contacts_postal_code" ON "public"."contacts" USING "btree" ("postal_code");



CREATE INDEX "idx_contacts_state" ON "public"."contacts" USING "btree" ("state");



CREATE INDEX "idx_credit_balances_account_id" ON "public"."credit_balances" USING "btree" ("account_id");



CREATE INDEX "idx_credit_balances_expire_at" ON "public"."credit_balances" USING "btree" ("included_credits_expire_at");



CREATE INDEX "idx_credit_ledger_account_id" ON "public"."credit_ledger" USING "btree" ("account_id");



CREATE INDEX "idx_credit_ledger_created_at" ON "public"."credit_ledger" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_ledger_feature_type" ON "public"."credit_ledger" USING "btree" ("feature_type");



CREATE UNIQUE INDEX "idx_credit_ledger_idempotency" ON "public"."credit_ledger" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_credit_ledger_stripe_invoice" ON "public"."credit_ledger" USING "btree" ("stripe_invoice_id") WHERE ("stripe_invoice_id" IS NOT NULL);



CREATE INDEX "idx_credit_ledger_stripe_session" ON "public"."credit_ledger" USING "btree" ("stripe_session_id") WHERE ("stripe_session_id" IS NOT NULL);



CREATE INDEX "idx_credit_ledger_transaction_type" ON "public"."credit_ledger" USING "btree" ("transaction_type");



CREATE INDEX "idx_credit_pricing_rules_active" ON "public"."credit_pricing_rules" USING "btree" ("feature_type", "is_active", "active_from" DESC);



CREATE INDEX "idx_critical_errors_function_time" ON "public"."critical_function_errors" USING "btree" ("function_name", "timestamp" DESC);



CREATE INDEX "idx_critical_errors_prompt_page" ON "public"."critical_function_errors" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_critical_errors_user" ON "public"."critical_function_errors" USING "btree" ("user_id");



CREATE INDEX "idx_critical_successes_function_time" ON "public"."critical_function_successes" USING "btree" ("function_name", "timestamp" DESC);



CREATE INDEX "idx_critical_successes_prompt_page" ON "public"."critical_function_successes" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_critical_successes_user" ON "public"."critical_function_successes" USING "btree" ("user_id");



CREATE INDEX "idx_daily_stats_date" ON "public"."daily_stats" USING "btree" ("date" DESC);



CREATE INDEX "idx_email_domain_policies_account_id" ON "public"."email_domain_policies" USING "btree" ("account_id");



CREATE INDEX "idx_email_domain_policies_domain" ON "public"."email_domain_policies" USING "btree" ("domain");



CREATE INDEX "idx_faq_contexts_faq_id" ON "public"."faq_contexts" USING "btree" ("faq_id");



CREATE INDEX "idx_faq_contexts_keywords" ON "public"."faq_contexts" USING "gin" ("keywords");



CREATE INDEX "idx_faq_contexts_priority" ON "public"."faq_contexts" USING "btree" ("priority" DESC);



CREATE INDEX "idx_faq_contexts_route" ON "public"."faq_contexts" USING "btree" ("route_pattern");



CREATE INDEX "idx_faqs_article_id" ON "public"."faqs" USING "btree" ("article_id");



CREATE INDEX "idx_faqs_category" ON "public"."faqs" USING "btree" ("category");



CREATE INDEX "idx_faqs_order" ON "public"."faqs" USING "btree" ("category", "order_index");



CREATE INDEX "idx_faqs_plans" ON "public"."faqs" USING "gin" ("plans");



CREATE INDEX "idx_faqs_search" ON "public"."faqs" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("question" || ' '::"text") || "answer")));



CREATE INDEX "idx_feedback_category" ON "public"."feedback" USING "btree" ("category");



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("created_at");



CREATE INDEX "idx_feedback_is_read" ON "public"."feedback" USING "btree" ("is_read");



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_follow_up_reminders_account_id" ON "public"."follow_up_reminders" USING "btree" ("account_id");



CREATE INDEX "idx_follow_up_reminders_contact_id" ON "public"."follow_up_reminders" USING "btree" ("contact_id");



CREATE INDEX "idx_follow_up_reminders_reminder_date" ON "public"."follow_up_reminders" USING "btree" ("reminder_date");



CREATE INDEX "idx_follow_up_reminders_status" ON "public"."follow_up_reminders" USING "btree" ("status");



CREATE INDEX "idx_game_leaderboard_created_at" ON "public"."game_leaderboard" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_game_leaderboard_score" ON "public"."game_leaderboard" USING "btree" ("score" DESC);



CREATE INDEX "idx_game_scores_business_name" ON "public"."game_scores" USING "btree" ("business_name") WHERE ("business_name" IS NOT NULL);



CREATE INDEX "idx_game_scores_email" ON "public"."game_scores" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_game_scores_handle" ON "public"."game_scores" USING "btree" ("lower"("player_handle"));



CREATE INDEX "idx_game_scores_leaderboard" ON "public"."game_scores" USING "btree" ("score" DESC, "created_at");



CREATE INDEX "idx_game_scores_website" ON "public"."game_scores" USING "btree" ("website") WHERE ("website" IS NOT NULL);



CREATE INDEX "idx_gbp_alerts_account" ON "public"."gbp_change_alerts" USING "btree" ("account_id");



CREATE INDEX "idx_gbp_alerts_location" ON "public"."gbp_change_alerts" USING "btree" ("location_id");



CREATE INDEX "idx_gbp_alerts_pending" ON "public"."gbp_change_alerts" USING "btree" ("account_id", "status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_gbp_alerts_status" ON "public"."gbp_change_alerts" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_gbp_change_alerts_unique_pending" ON "public"."gbp_change_alerts" USING "btree" ("account_id", "location_id", "field_changed") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_gbp_protection_settings_account" ON "public"."gbp_protection_settings" USING "btree" ("account_id");



CREATE INDEX "idx_gbp_snapshots_account" ON "public"."gbp_location_snapshots" USING "btree" ("account_id");



CREATE INDEX "idx_gbp_snapshots_location" ON "public"."gbp_location_snapshots" USING "btree" ("location_id");



CREATE INDEX "idx_gg_checks_account_date" ON "public"."gg_checks" USING "btree" ("account_id", "checked_at" DESC);



CREATE INDEX "idx_gg_checks_config_date" ON "public"."gg_checks" USING "btree" ("config_id", "checked_at" DESC);



CREATE INDEX "idx_gg_checks_keyword" ON "public"."gg_checks" USING "btree" ("keyword_id", "checked_at" DESC);



CREATE INDEX "idx_gg_checks_keyword_search_query" ON "public"."gg_checks" USING "btree" ("keyword_id", "search_query", "checked_at" DESC);



CREATE INDEX "idx_gg_checks_point" ON "public"."gg_checks" USING "btree" ("config_id", "check_point", "checked_at" DESC);



CREATE INDEX "idx_gg_configs_account" ON "public"."gg_configs" USING "btree" ("account_id");



CREATE INDEX "idx_gg_configs_account_location" ON "public"."gg_configs" USING "btree" ("account_id", "google_business_location_id");



CREATE INDEX "idx_gg_configs_next_scheduled" ON "public"."gg_configs" USING "btree" ("next_scheduled_at") WHERE (("schedule_frequency" IS NOT NULL) AND ("is_enabled" = true));



CREATE INDEX "idx_gg_daily_summary_account" ON "public"."gg_daily_summary" USING "btree" ("account_id", "check_date" DESC);



CREATE INDEX "idx_gg_daily_summary_config" ON "public"."gg_daily_summary" USING "btree" ("config_id", "check_date" DESC);



CREATE INDEX "idx_gg_tracked_keywords_account" ON "public"."gg_tracked_keywords" USING "btree" ("account_id");



CREATE INDEX "idx_gg_tracked_keywords_config" ON "public"."gg_tracked_keywords" USING "btree" ("config_id");



CREATE INDEX "idx_gg_tracked_keywords_keyword" ON "public"."gg_tracked_keywords" USING "btree" ("keyword_id");



CREATE INDEX "idx_google_api_rate_limits_account_project" ON "public"."google_api_rate_limits" USING "btree" ("account_id", "project_id");



CREATE INDEX "idx_google_api_rate_limits_project_id" ON "public"."google_api_rate_limits" USING "btree" ("project_id");



CREATE INDEX "idx_google_business_locations_account_id" ON "public"."google_business_locations" USING "btree" ("account_id");



CREATE INDEX "idx_google_business_locations_account_name" ON "public"."google_business_locations" USING "btree" ("account_name");



CREATE INDEX "idx_google_business_locations_location_id" ON "public"."google_business_locations" USING "btree" ("location_id");



CREATE INDEX "idx_google_business_locations_place_id" ON "public"."google_business_locations" USING "btree" ("google_place_id") WHERE ("google_place_id" IS NOT NULL);



CREATE INDEX "idx_google_business_locations_user_id" ON "public"."google_business_locations" USING "btree" ("user_id");



CREATE INDEX "idx_google_business_media_uploads_created_at" ON "public"."google_business_media_uploads" USING "btree" ("created_at");



CREATE INDEX "idx_google_business_media_uploads_location_id" ON "public"."google_business_media_uploads" USING "btree" ("location_id");



CREATE INDEX "idx_google_business_media_uploads_user_id" ON "public"."google_business_media_uploads" USING "btree" ("user_id");



CREATE INDEX "idx_google_business_profiles_account_id" ON "public"."google_business_profiles" USING "btree" ("account_id");



CREATE INDEX "idx_google_business_profiles_google_email" ON "public"."google_business_profiles" USING "btree" ("google_email");



CREATE INDEX "idx_google_business_profiles_user_id" ON "public"."google_business_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_google_business_scheduled_post_results_composite" ON "public"."google_business_scheduled_post_results" USING "btree" ("scheduled_post_id", "location_id", "platform");



CREATE INDEX "idx_google_business_scheduled_post_results_location" ON "public"."google_business_scheduled_post_results" USING "btree" ("location_id");



CREATE INDEX "idx_google_business_scheduled_post_results_post" ON "public"."google_business_scheduled_post_results" USING "btree" ("scheduled_post_id");



CREATE INDEX "idx_google_business_scheduled_posts_account" ON "public"."google_business_scheduled_posts" USING "btree" ("account_id");



CREATE INDEX "idx_google_business_scheduled_posts_additional_platforms" ON "public"."google_business_scheduled_posts" USING "gin" ("additional_platforms");



CREATE INDEX "idx_google_business_scheduled_posts_status_date" ON "public"."google_business_scheduled_posts" USING "btree" ("status", "scheduled_date");



CREATE INDEX "idx_google_business_scheduled_posts_user" ON "public"."google_business_scheduled_posts" USING "btree" ("user_id");



CREATE INDEX "idx_invitation_events_created_at" ON "public"."invitation_events" USING "btree" ("created_at");



CREATE INDEX "idx_invitation_events_invitation_id" ON "public"."invitation_events" USING "btree" ("invitation_id");



CREATE INDEX "idx_invitation_events_type_date" ON "public"."invitation_events" USING "btree" ("event_type", "created_at");



CREATE INDEX "idx_keyword_analysis_runs_account_date" ON "public"."keyword_analysis_runs" USING "btree" ("account_id", "run_date" DESC);



CREATE INDEX "idx_keyword_analysis_runs_account_id" ON "public"."keyword_analysis_runs" USING "btree" ("account_id");



CREATE INDEX "idx_keyword_analysis_runs_run_date" ON "public"."keyword_analysis_runs" USING "btree" ("run_date" DESC);



CREATE INDEX "idx_keyword_groups_account" ON "public"."keyword_groups" USING "btree" ("account_id");



CREATE INDEX "idx_keyword_questions_funnel_stage" ON "public"."keyword_questions" USING "btree" ("funnel_stage");



CREATE INDEX "idx_keyword_questions_keyword_id" ON "public"."keyword_questions" USING "btree" ("keyword_id");



CREATE UNIQUE INDEX "idx_keyword_set_locations_unique" ON "public"."keyword_set_locations" USING "btree" ("keyword_set_id", "google_business_location_id");



CREATE UNIQUE INDEX "idx_keyword_set_terms_unique_phrase" ON "public"."keyword_set_terms" USING "btree" ("keyword_set_id", "normalized_phrase");



CREATE INDEX "idx_keyword_sets_account_id" ON "public"."keyword_sets" USING "btree" ("account_id");



CREATE UNIQUE INDEX "idx_keyword_sets_account_name_unique" ON "public"."keyword_sets" USING "btree" ("account_id", "lower"("name"));



CREATE INDEX "idx_keywords_account" ON "public"."keywords" USING "btree" ("account_id");



CREATE INDEX "idx_keywords_aliases" ON "public"."keywords" USING "gin" ("aliases") WHERE ("aliases" <> '{}'::"text"[]);



CREATE INDEX "idx_keywords_difficulty" ON "public"."keywords" USING "btree" ("account_id", "keyword_difficulty") WHERE ("keyword_difficulty" IS NOT NULL);



CREATE INDEX "idx_keywords_group" ON "public"."keywords" USING "btree" ("group_id");



CREATE INDEX "idx_keywords_normalized" ON "public"."keywords" USING "btree" ("account_id", "normalized_phrase");



CREATE INDEX "idx_keywords_related_questions" ON "public"."keywords" USING "gin" ("related_questions" "jsonb_path_ops");



CREATE INDEX "idx_keywords_search_intent" ON "public"."keywords" USING "btree" ("account_id", "search_intent") WHERE ("search_intent" IS NOT NULL);



CREATE INDEX "idx_keywords_search_query" ON "public"."keywords" USING "btree" ("account_id", "search_query") WHERE ("search_query" IS NOT NULL);



CREATE INDEX "idx_keywords_usage" ON "public"."keywords" USING "btree" ("account_id", "review_usage_count" DESC);



CREATE INDEX "idx_kickstarters_category" ON "public"."kickstarters" USING "btree" ("category");



CREATE INDEX "idx_kickstarters_default" ON "public"."kickstarters" USING "btree" ("is_default");



CREATE INDEX "idx_kppu_account" ON "public"."keyword_prompt_page_usage" USING "btree" ("account_id");



CREATE INDEX "idx_kppu_keyword" ON "public"."keyword_prompt_page_usage" USING "btree" ("keyword_id");



CREATE INDEX "idx_kppu_page" ON "public"."keyword_prompt_page_usage" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_krl_account" ON "public"."keyword_rotation_log" USING "btree" ("account_id");



CREATE INDEX "idx_krl_created_at" ON "public"."keyword_rotation_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_krl_prompt_page" ON "public"."keyword_rotation_log" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_krm_v2_account" ON "public"."keyword_review_matches_v2" USING "btree" ("account_id");



CREATE INDEX "idx_krm_v2_google" ON "public"."keyword_review_matches_v2" USING "btree" ("google_review_id") WHERE ("google_review_id" IS NOT NULL);



CREATE INDEX "idx_krm_v2_keyword" ON "public"."keyword_review_matches_v2" USING "btree" ("keyword_id");



CREATE INDEX "idx_krm_v2_match_type" ON "public"."keyword_review_matches_v2" USING "btree" ("keyword_id", "match_type");



CREATE INDEX "idx_krm_v2_review" ON "public"."keyword_review_matches_v2" USING "btree" ("review_submission_id");



CREATE INDEX "idx_llm_checks_account" ON "public"."llm_visibility_checks" USING "btree" ("account_id");



CREATE INDEX "idx_llm_checks_account_cited" ON "public"."llm_visibility_checks" USING "btree" ("account_id", "domain_cited", "checked_at" DESC);



CREATE INDEX "idx_llm_checks_brand_mentioned" ON "public"."llm_visibility_checks" USING "btree" ("account_id", "brand_mentioned", "checked_at" DESC);



CREATE INDEX "idx_llm_checks_checked_at" ON "public"."llm_visibility_checks" USING "btree" ("checked_at" DESC);



CREATE INDEX "idx_llm_checks_keyword" ON "public"."llm_visibility_checks" USING "btree" ("keyword_id", "checked_at" DESC);



CREATE INDEX "idx_llm_checks_keyword_provider" ON "public"."llm_visibility_checks" USING "btree" ("keyword_id", "llm_provider", "checked_at" DESC);



CREATE INDEX "idx_llm_schedules_account" ON "public"."llm_visibility_schedules" USING "btree" ("account_id");



CREATE INDEX "idx_llm_schedules_keyword" ON "public"."llm_visibility_schedules" USING "btree" ("keyword_id");



CREATE INDEX "idx_llm_schedules_next" ON "public"."llm_visibility_schedules" USING "btree" ("next_scheduled_at") WHERE (("is_enabled" = true) AND ("schedule_frequency" IS NOT NULL));



CREATE INDEX "idx_llm_summary_account" ON "public"."llm_visibility_summary" USING "btree" ("account_id");



CREATE INDEX "idx_llm_summary_keyword" ON "public"."llm_visibility_summary" USING "btree" ("keyword_id");



CREATE INDEX "idx_llm_summary_score" ON "public"."llm_visibility_summary" USING "btree" ("account_id", "visibility_score" DESC NULLS LAST);



CREATE INDEX "idx_media_assets_article_id" ON "public"."media_assets" USING "btree" ("article_id");



CREATE INDEX "idx_media_assets_created_at" ON "public"."media_assets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_media_assets_mime_type" ON "public"."media_assets" USING "btree" ("mime_type");



CREATE INDEX "idx_mentions_source" ON "public"."mentions" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_mentions_unread" ON "public"."mentions" USING "btree" ("mentioned_user_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_mentions_user_read" ON "public"."mentions" USING "btree" ("mentioned_user_id", "read_at");



CREATE INDEX "idx_metadata_templates_active" ON "public"."metadata_templates" USING "btree" ("is_active");



CREATE INDEX "idx_metadata_templates_page_type" ON "public"."metadata_templates" USING "btree" ("page_type");



CREATE UNIQUE INDEX "idx_metadata_templates_unique_active_per_type" ON "public"."metadata_templates" USING "btree" ("page_type") WHERE ("is_active" = true);



CREATE INDEX "idx_navigation_is_active" ON "public"."navigation" USING "btree" ("is_active");



CREATE INDEX "idx_navigation_order" ON "public"."navigation" USING "btree" ("parent_id" NULLS FIRST, "order_index");



CREATE INDEX "idx_navigation_parent_id" ON "public"."navigation" USING "btree" ("parent_id");



CREATE INDEX "idx_navigation_visibility" ON "public"."navigation" USING "gin" ("visibility");



CREATE INDEX "idx_notifications_account_id" ON "public"."notifications" USING "btree" ("account_id");



CREATE INDEX "idx_notifications_account_user" ON "public"."notifications" USING "btree" ("account_id", "user_id", "read", "dismissed");



CREATE INDEX "idx_notifications_cleanup" ON "public"."notifications" USING "btree" ("created_at", "read", "dismissed");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("account_id", "read") WHERE (NOT "read");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread_count" ON "public"."notifications" USING "btree" ("account_id", "created_at" DESC) WHERE ((NOT "read") AND (NOT "dismissed"));



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_tasks_account_id" ON "public"."onboarding_tasks" USING "btree" ("account_id");



CREATE INDEX "idx_onboarding_tasks_task_id" ON "public"."onboarding_tasks" USING "btree" ("task_id");



CREATE INDEX "idx_optimizer_email_sends_email_type" ON "public"."optimizer_email_sends" USING "btree" ("email_type");



CREATE INDEX "idx_optimizer_email_sends_lead_id" ON "public"."optimizer_email_sends" USING "btree" ("lead_id");



CREATE INDEX "idx_optimizer_email_sends_sent_at" ON "public"."optimizer_email_sends" USING "btree" ("sent_at" DESC);



CREATE UNIQUE INDEX "idx_optimizer_email_sends_unique" ON "public"."optimizer_email_sends" USING "btree" ("lead_id", "email_type", "success") WHERE ("success" = true);



CREATE INDEX "idx_optimizer_leads_converted" ON "public"."optimizer_leads" USING "btree" ("converted_to_customer");



CREATE INDEX "idx_optimizer_leads_created_at" ON "public"."optimizer_leads" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "idx_optimizer_leads_email_source" ON "public"."optimizer_leads" USING "btree" ("email", "source_business");



CREATE INDEX "idx_optimizer_leads_email_unsubscribed" ON "public"."optimizer_leads" USING "btree" ("email_unsubscribed");



CREATE INDEX "idx_optimizer_leads_lead_segment" ON "public"."optimizer_leads" USING "btree" ("lead_segment");



CREATE INDEX "idx_optimizer_sessions_email" ON "public"."optimizer_sessions" USING "btree" ("email");



CREATE INDEX "idx_optimizer_sessions_expires_at" ON "public"."optimizer_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_platform_metrics_name" ON "public"."platform_metrics" USING "btree" ("metric_name");



CREATE INDEX "idx_post_comments_author" ON "public"."post_comments" USING "btree" ("author_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_post_comments_post_created" ON "public"."post_comments" USING "btree" ("post_id", "created_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_post_reactions_post" ON "public"."post_reactions" USING "btree" ("post_id");



CREATE INDEX "idx_post_reactions_user" ON "public"."post_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_posts_account_id" ON "public"."posts" USING "btree" ("account_id");



CREATE INDEX "idx_posts_author" ON "public"."posts" USING "btree" ("author_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_posts_channel_created" ON "public"."posts" USING "btree" ("channel_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_posts_created" ON "public"."posts" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_prompt_pages_account_id" ON "public"."prompt_pages" USING "btree" ("account_id");



CREATE INDEX "idx_prompt_pages_account_slug" ON "public"."prompt_pages" USING "btree" ("account_id", "slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_prompt_pages_account_status" ON "public"."prompt_pages" USING "btree" ("account_id", "status");



COMMENT ON INDEX "public"."idx_prompt_pages_account_status" IS 'Performance optimization for dashboard prompt page queries';



CREATE INDEX "idx_prompt_pages_account_type" ON "public"."prompt_pages" USING "btree" ("account_id", "type");



CREATE INDEX "idx_prompt_pages_account_universal" ON "public"."prompt_pages" USING "btree" ("account_id", "is_universal");



CREATE INDEX "idx_prompt_pages_active_only" ON "public"."prompt_pages" USING "btree" ("slug", "account_id", "updated_at") WHERE (("status" <> 'draft'::"public"."prompt_page_status") AND ("slug" IS NOT NULL));



COMMENT ON INDEX "public"."idx_prompt_pages_active_only" IS 'Performance optimization for active prompt pages only';



CREATE INDEX "idx_prompt_pages_campaign_type" ON "public"."prompt_pages" USING "btree" ("campaign_type");



CREATE INDEX "idx_prompt_pages_created_at" ON "public"."prompt_pages" USING "btree" ("created_at");



COMMENT ON INDEX "public"."idx_prompt_pages_created_at" IS 'Performance optimization for analytics and sorting';



CREATE INDEX "idx_prompt_pages_dashboard" ON "public"."prompt_pages" USING "btree" ("account_id", "is_universal", "status", "created_at" DESC) INCLUDE ("slug", "type", "review_type", "campaign_type");



CREATE INDEX "idx_prompt_pages_emp_location" ON "public"."prompt_pages" USING "btree" ("emp_location");



CREATE INDEX "idx_prompt_pages_emp_position" ON "public"."prompt_pages" USING "btree" ("emp_position");



CREATE INDEX "idx_prompt_pages_eve_date" ON "public"."prompt_pages" USING "btree" ("eve_date");



CREATE INDEX "idx_prompt_pages_eve_location" ON "public"."prompt_pages" USING "btree" ("eve_location");



CREATE INDEX "idx_prompt_pages_eve_type" ON "public"."prompt_pages" USING "btree" ("eve_type");



CREATE INDEX "idx_prompt_pages_keyword_inspiration_enabled" ON "public"."prompt_pages" USING "btree" ("keyword_inspiration_enabled") WHERE ("keyword_inspiration_enabled" = true);



CREATE INDEX "idx_prompt_pages_keywords" ON "public"."prompt_pages" USING "gin" ("keywords");



CREATE INDEX "idx_prompt_pages_location" ON "public"."prompt_pages" USING "btree" ("business_location_id");



CREATE INDEX "idx_prompt_pages_photo_context" ON "public"."prompt_pages" USING "btree" ("photo_context");



CREATE INDEX "idx_prompt_pages_photo_description" ON "public"."prompt_pages" USING "btree" ("photo_description");



CREATE INDEX "idx_prompt_pages_recent_reviews_scope" ON "public"."prompt_pages" USING "btree" ("recent_reviews_scope");



CREATE INDEX "idx_prompt_pages_service_description" ON "public"."prompt_pages" USING "btree" ("service_description");



CREATE INDEX "idx_prompt_pages_service_name" ON "public"."prompt_pages" USING "btree" ("service_name");



CREATE INDEX "idx_prompt_pages_slug" ON "public"."prompt_pages" USING "btree" ("slug");



CREATE INDEX "idx_prompt_pages_slug_active" ON "public"."prompt_pages" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



COMMENT ON INDEX "public"."idx_prompt_pages_slug_active" IS 'Performance optimization for prompt page API endpoint - slug lookups';



CREATE INDEX "idx_prompt_pages_slug_lookup" ON "public"."prompt_pages" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_prompt_pages_sort_order" ON "public"."prompt_pages" USING "btree" ("account_id", "status", "sort_order");



CREATE INDEX "idx_prompt_pages_status" ON "public"."prompt_pages" USING "btree" ("status");



CREATE INDEX "idx_prompt_pages_type" ON "public"."prompt_pages" USING "btree" ("type");



CREATE INDEX "idx_prompt_pages_type_status" ON "public"."prompt_pages" USING "btree" ("type", "status", "created_at" DESC);



CREATE INDEX "idx_prompt_pages_type_visibility" ON "public"."prompt_pages" USING "btree" ("type", "visibility");



CREATE INDEX "idx_prompt_pages_universal" ON "public"."prompt_pages" USING "btree" ("account_id", "is_universal") WHERE ("is_universal" = true);



COMMENT ON INDEX "public"."idx_prompt_pages_universal" IS 'Performance optimization for universal prompt page queries';



CREATE INDEX "idx_prompt_pages_visibility" ON "public"."prompt_pages" USING "btree" ("visibility");



CREATE INDEX "idx_quotes_active" ON "public"."quotes" USING "btree" ("is_active");



CREATE INDEX "idx_rank_checks_account" ON "public"."rank_checks" USING "btree" ("account_id");



CREATE INDEX "idx_rank_checks_account_keyword" ON "public"."rank_checks" USING "btree" ("account_id", "keyword_id", "checked_at" DESC);



CREATE INDEX "idx_rank_checks_ai_cited" ON "public"."rank_checks" USING "btree" ("account_id", "ai_overview_ours_cited") WHERE ("ai_overview_ours_cited" = true);



CREATE INDEX "idx_rank_checks_checked_at" ON "public"."rank_checks" USING "btree" ("checked_at" DESC);



CREATE INDEX "idx_rank_checks_featured_snippet" ON "public"."rank_checks" USING "btree" ("account_id", "featured_snippet_ours") WHERE ("featured_snippet_ours" = true);



CREATE INDEX "idx_rank_checks_group_date" ON "public"."rank_checks" USING "btree" ("group_id", "checked_at" DESC);



CREATE INDEX "idx_rank_checks_keyword_date" ON "public"."rank_checks" USING "btree" ("keyword_id", "checked_at" DESC);



CREATE INDEX "idx_rank_checks_paa_ours" ON "public"."rank_checks" USING "btree" ("account_id", "paa_ours_count") WHERE ("paa_ours_count" > 0);



CREATE INDEX "idx_rank_discovery_usage_account" ON "public"."rank_discovery_usage" USING "btree" ("account_id");



CREATE INDEX "idx_rank_discovery_usage_date" ON "public"."rank_discovery_usage" USING "btree" ("account_id", "usage_date" DESC);



CREATE INDEX "idx_rank_group_keywords_account" ON "public"."rank_group_keywords" USING "btree" ("account_id");



CREATE INDEX "idx_rank_group_keywords_group" ON "public"."rank_group_keywords" USING "btree" ("group_id");



CREATE INDEX "idx_rank_group_keywords_keyword" ON "public"."rank_group_keywords" USING "btree" ("keyword_id");



CREATE INDEX "idx_rank_keyword_groups_account" ON "public"."rank_keyword_groups" USING "btree" ("account_id");



CREATE INDEX "idx_rank_keyword_groups_account_enabled" ON "public"."rank_keyword_groups" USING "btree" ("account_id", "is_enabled");



CREATE INDEX "idx_rank_keyword_groups_schedule" ON "public"."rank_keyword_groups" USING "btree" ("next_scheduled_at") WHERE (("is_enabled" = true) AND ("schedule_frequency" IS NOT NULL));



CREATE INDEX "idx_rank_locations_canonical_trgm" ON "public"."rank_locations" USING "gin" ("canonical_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_rank_locations_code" ON "public"."rank_locations" USING "btree" ("location_code");



CREATE INDEX "idx_rank_locations_country" ON "public"."rank_locations" USING "btree" ("country_iso_code");



CREATE INDEX "idx_rank_locations_name_trgm" ON "public"."rank_locations" USING "gin" ("location_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_rank_locations_type" ON "public"."rank_locations" USING "btree" ("location_type");



CREATE INDEX "idx_review_drafts_created_at" ON "public"."review_drafts" USING "btree" ("created_at");



CREATE INDEX "idx_review_drafts_platform" ON "public"."review_drafts" USING "btree" ("platform");



CREATE INDEX "idx_review_drafts_prompt_page_id" ON "public"."review_drafts" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_review_keyword_matches_account" ON "public"."review_keyword_matches" USING "btree" ("account_id", "matched_at" DESC);



CREATE INDEX "idx_review_keyword_matches_location" ON "public"."review_keyword_matches" USING "btree" ("google_business_location_id");



CREATE UNIQUE INDEX "idx_review_keyword_matches_unique" ON "public"."review_keyword_matches" USING "btree" ("review_id", "keyword_term_id");



CREATE INDEX "idx_review_reminder_logs_account_id" ON "public"."review_reminder_logs" USING "btree" ("account_id");



CREATE INDEX "idx_review_reminder_logs_sent_at" ON "public"."review_reminder_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_review_reminder_logs_user_id" ON "public"."review_reminder_logs" USING "btree" ("user_id");



CREATE INDEX "idx_review_reminder_settings_user_id" ON "public"."review_reminder_settings" USING "btree" ("user_id");



CREATE INDEX "idx_review_share_events_account_id" ON "public"."review_share_events" USING "btree" ("account_id");



CREATE INDEX "idx_review_share_events_account_platform" ON "public"."review_share_events" USING "btree" ("account_id", "platform");



CREATE INDEX "idx_review_share_events_platform" ON "public"."review_share_events" USING "btree" ("platform");



CREATE INDEX "idx_review_share_events_review_id" ON "public"."review_share_events" USING "btree" ("review_id");



CREATE INDEX "idx_review_share_events_review_platform" ON "public"."review_share_events" USING "btree" ("review_id", "platform");



CREATE INDEX "idx_review_share_events_timestamp" ON "public"."review_share_events" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_review_share_events_user_id" ON "public"."review_share_events" USING "btree" ("user_id");



CREATE INDEX "idx_review_share_images_account_id" ON "public"."review_share_images" USING "btree" ("account_id");



CREATE INDEX "idx_review_share_images_generated_at" ON "public"."review_share_images" USING "btree" ("generated_at");



CREATE INDEX "idx_review_share_images_review_id" ON "public"."review_share_images" USING "btree" ("review_id");



CREATE INDEX "idx_review_submissions_account_filtering" ON "public"."review_submissions" USING "btree" ("prompt_page_id", "status", "review_type", "created_at" DESC) WHERE (("status" = 'submitted'::"text") AND ("review_type" <> 'feedback'::"text"));



CREATE INDEX "idx_review_submissions_account_id" ON "public"."review_submissions" USING "btree" ("account_id");



CREATE INDEX "idx_review_submissions_account_source_created" ON "public"."review_submissions" USING "btree" ("account_id", "source_channel", "created_at" DESC);



CREATE INDEX "idx_review_submissions_account_status" ON "public"."review_submissions" USING "btree" ("account_id", "status", "created_at" DESC);



CREATE INDEX "idx_review_submissions_auto_verification_status" ON "public"."review_submissions" USING "btree" ("auto_verification_status");



CREATE INDEX "idx_review_submissions_business_id" ON "public"."review_submissions" USING "btree" ("business_id");



CREATE INDEX "idx_review_submissions_business_location" ON "public"."review_submissions" USING "btree" ("business_location_id");



CREATE INDEX "idx_review_submissions_business_location_id" ON "public"."review_submissions" USING "btree" ("business_location_id");



CREATE INDEX "idx_review_submissions_communication_record_id" ON "public"."review_submissions" USING "btree" ("communication_record_id");



CREATE INDEX "idx_review_submissions_contact_id" ON "public"."review_submissions" USING "btree" ("contact_id");



CREATE INDEX "idx_review_submissions_created_at" ON "public"."review_submissions" USING "btree" ("created_at");



CREATE INDEX "idx_review_submissions_customer_confirmed" ON "public"."review_submissions" USING "btree" ("customer_confirmed") WHERE ("customer_confirmed" IS NOT NULL);



CREATE INDEX "idx_review_submissions_email" ON "public"."review_submissions" USING "btree" ("email");



CREATE INDEX "idx_review_submissions_gbp_location" ON "public"."review_submissions" USING "btree" ("google_business_location_id");



CREATE INDEX "idx_review_submissions_google_location_id" ON "public"."review_submissions" USING "btree" ("google_location_id");



CREATE INDEX "idx_review_submissions_google_review_id" ON "public"."review_submissions" USING "btree" ("google_review_id");



CREATE UNIQUE INDEX "idx_review_submissions_google_review_id_account_unique" ON "public"."review_submissions" USING "btree" ("google_review_id", "account_id") WHERE ("google_review_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_review_submissions_google_review_id_account_unique" IS 'Ensures each Google review is unique per account, allowing the same review to exist in multiple accounts if they share a GBP location';



CREATE INDEX "idx_review_submissions_group_id" ON "public"."review_submissions" USING "btree" ("review_group_id");



CREATE INDEX "idx_review_submissions_imported_from_google" ON "public"."review_submissions" USING "btree" ("imported_from_google");



CREATE INDEX "idx_review_submissions_last_verification_attempt" ON "public"."review_submissions" USING "btree" ("last_verification_attempt_at");



CREATE INDEX "idx_review_submissions_location_name" ON "public"."review_submissions" USING "btree" ("location_name");



CREATE INDEX "idx_review_submissions_page_platform" ON "public"."review_submissions" USING "btree" ("prompt_page_id", "platform");



CREATE INDEX "idx_review_submissions_platform" ON "public"."review_submissions" USING "btree" ("platform");



CREATE INDEX "idx_review_submissions_prompt_page_id" ON "public"."review_submissions" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_review_submissions_review_type" ON "public"."review_submissions" USING "btree" ("review_type");



CREATE INDEX "idx_review_submissions_source_channel" ON "public"."review_submissions" USING "btree" ("source_channel");



CREATE INDEX "idx_review_submissions_star_rating" ON "public"."review_submissions" USING "btree" ("star_rating");



CREATE INDEX "idx_review_submissions_submitted_at" ON "public"."review_submissions" USING "btree" ("submitted_at");



CREATE INDEX "idx_review_submissions_utm_params" ON "public"."review_submissions" USING "gin" ("utm_params");



CREATE INDEX "idx_review_submissions_verified" ON "public"."review_submissions" USING "btree" ("verified");



CREATE INDEX "idx_review_submissions_widget_id" ON "public"."review_submissions" USING "btree" ("widget_id");



CREATE INDEX "idx_rss_feed_items_discovered" ON "public"."rss_feed_items" USING "btree" ("feed_source_id", "discovered_at" DESC);



CREATE INDEX "idx_rss_feed_items_pending" ON "public"."rss_feed_items" USING "btree" ("feed_source_id", "status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_rss_feed_items_scheduled_post" ON "public"."rss_feed_items" USING "btree" ("scheduled_post_id") WHERE ("scheduled_post_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_rss_feed_items_unique" ON "public"."rss_feed_items" USING "btree" ("feed_source_id", "item_guid");



CREATE INDEX "idx_rss_feed_sources_account" ON "public"."rss_feed_sources" USING "btree" ("account_id");



CREATE INDEX "idx_rss_feed_sources_active_polling" ON "public"."rss_feed_sources" USING "btree" ("is_active", "last_polled_at") WHERE ("is_active" = true);



CREATE INDEX "idx_scheduled_posts_drafts" ON "public"."google_business_scheduled_posts" USING "btree" ("account_id", "status", "queue_order") WHERE ("status" = 'draft'::"public"."google_business_scheduled_post_status");



CREATE INDEX "idx_scheduled_posts_source" ON "public"."google_business_scheduled_posts" USING "btree" ("source_type") WHERE ("source_type" IS NOT NULL);



CREATE INDEX "idx_selected_gbp_locations_account_id" ON "public"."selected_gbp_locations" USING "btree" ("account_id");



CREATE INDEX "idx_selected_gbp_locations_user_id" ON "public"."selected_gbp_locations" USING "btree" ("user_id");



CREATE INDEX "idx_sentiment_runs_account_date" ON "public"."sentiment_analysis_runs" USING "btree" ("account_id", "run_date" DESC);



CREATE INDEX "idx_sentiment_runs_run_date" ON "public"."sentiment_analysis_runs" USING "btree" ("run_date");



CREATE INDEX "idx_sidebar_favorites_account" ON "public"."sidebar_favorites" USING "btree" ("account_id");



CREATE INDEX "idx_sidebar_favorites_order" ON "public"."sidebar_favorites" USING "btree" ("account_id", "display_order");



CREATE INDEX "idx_social_platform_connections_account" ON "public"."social_platform_connections" USING "btree" ("account_id");



CREATE INDEX "idx_social_platform_connections_platform" ON "public"."social_platform_connections" USING "btree" ("platform");



CREATE INDEX "idx_social_platform_connections_status" ON "public"."social_platform_connections" USING "btree" ("status");



CREATE INDEX "idx_social_platform_connections_user" ON "public"."social_platform_connections" USING "btree" ("user_id");



CREATE INDEX "idx_trial_reminder_logs_account_id" ON "public"."trial_reminder_logs" USING "btree" ("account_id");



CREATE INDEX "idx_trial_reminder_logs_reminder_type" ON "public"."trial_reminder_logs" USING "btree" ("reminder_type");



CREATE INDEX "idx_trial_reminder_logs_sent_at" ON "public"."trial_reminder_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_widget_reviews_business_id" ON "public"."widget_reviews" USING "btree" ("business_id");



CREATE INDEX "idx_widget_reviews_created_at" ON "public"."widget_reviews" USING "btree" ("created_at");



CREATE INDEX "idx_widget_reviews_order_index" ON "public"."widget_reviews" USING "btree" ("order_index");



CREATE INDEX "idx_widget_reviews_photo_url" ON "public"."widget_reviews" USING "btree" ("photo_url");



CREATE INDEX "idx_widget_reviews_review_group_id" ON "public"."widget_reviews" USING "btree" ("review_group_id");



CREATE INDEX "idx_widget_reviews_review_id" ON "public"."widget_reviews" USING "btree" ("review_id");



CREATE INDEX "idx_widget_reviews_review_type" ON "public"."widget_reviews" USING "btree" ("review_type");



CREATE INDEX "idx_widget_reviews_star_rating" ON "public"."widget_reviews" USING "btree" ("star_rating");



CREATE INDEX "idx_widget_reviews_verified" ON "public"."widget_reviews" USING "btree" ("verified");



CREATE INDEX "idx_widget_reviews_widget_id" ON "public"."widget_reviews" USING "btree" ("widget_id");



CREATE INDEX "idx_widget_reviews_widget_verified" ON "public"."widget_reviews" USING "btree" ("widget_id", "verified");



CREATE INDEX "idx_widgets_account_id" ON "public"."widgets" USING "btree" ("account_id");



CREATE INDEX "idx_widgets_account_type" ON "public"."widgets" USING "btree" ("account_id", "type", "created_at" DESC);



CREATE INDEX "idx_widgets_is_active" ON "public"."widgets" USING "btree" ("is_active");



CREATE INDEX "idx_widgets_review_count" ON "public"."widgets" USING "btree" ("review_count");



CREATE INDEX "idx_widgets_submit_reviews_enabled" ON "public"."widgets" USING "btree" ("submit_reviews_enabled");



CREATE INDEX "idx_widgets_theme" ON "public"."widgets" USING "gin" ("theme");



CREATE INDEX "idx_widgets_type" ON "public"."widgets" USING "btree" ("type");



CREATE INDEX "idx_widgets_widget_type" ON "public"."widgets" USING "btree" ("widget_type");



CREATE INDEX "idx_wm_task_actions_account_id" ON "public"."wm_task_actions" USING "btree" ("account_id");



CREATE INDEX "idx_wm_task_actions_created_at" ON "public"."wm_task_actions" USING "btree" ("created_at");



CREATE INDEX "idx_wm_task_actions_task_id" ON "public"."wm_task_actions" USING "btree" ("task_id");



CREATE INDEX "idx_wm_tasks_account_id" ON "public"."wm_tasks" USING "btree" ("account_id");



CREATE INDEX "idx_wm_tasks_assigned_to" ON "public"."wm_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_wm_tasks_board_id" ON "public"."wm_tasks" USING "btree" ("board_id");



CREATE INDEX "idx_wm_tasks_due_date" ON "public"."wm_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_wm_tasks_sort_order" ON "public"."wm_tasks" USING "btree" ("sort_order");



CREATE INDEX "idx_wm_tasks_status" ON "public"."wm_tasks" USING "btree" ("status");



CREATE INDEX "prompt_pages_account_id_idx" ON "public"."prompt_pages" USING "btree" ("account_id");



CREATE INDEX "prompt_pages_contact_id_idx" ON "public"."prompt_pages" USING "btree" ("contact_id");



CREATE INDEX "prompt_pages_email_idx" ON "public"."prompt_pages" USING "btree" ("email");



CREATE INDEX "prompt_pages_phone_idx" ON "public"."prompt_pages" USING "btree" ("phone");



CREATE UNIQUE INDEX "unique_universal_per_account" ON "public"."prompt_pages" USING "btree" ("account_id") WHERE ("is_universal" = true);



COMMENT ON INDEX "public"."unique_universal_per_account" IS 'Ensures only one universal prompt page per account';



CREATE OR REPLACE TRIGGER "check_account_reactivation_trigger" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW WHEN (("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at")) EXECUTE FUNCTION "public"."check_account_reactivation"();



CREATE OR REPLACE TRIGGER "create_article_revision_trigger" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."create_article_revision"();



CREATE OR REPLACE TRIGGER "create_notification_preferences_trigger" AFTER INSERT ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_notification_preferences"();



CREATE OR REPLACE TRIGGER "credit_balances_updated_at" BEFORE UPDATE ON "public"."credit_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_updated_at"();



CREATE OR REPLACE TRIGGER "credit_included_by_tier_updated_at" BEFORE UPDATE ON "public"."credit_included_by_tier" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_updated_at"();



CREATE OR REPLACE TRIGGER "credit_packs_updated_at" BEFORE UPDATE ON "public"."credit_packs" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_updated_at"();



CREATE OR REPLACE TRIGGER "credit_pricing_rules_updated_at" BEFORE UPDATE ON "public"."credit_pricing_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_updated_at"();



CREATE OR REPLACE TRIGGER "enforce_gbp_location_limit" BEFORE INSERT ON "public"."selected_gbp_locations" FOR EACH ROW EXECUTE FUNCTION "public"."check_gbp_location_limit"();



CREATE OR REPLACE TRIGGER "enforce_location_limit" BEFORE INSERT ON "public"."business_locations" FOR EACH ROW EXECUTE FUNCTION "public"."check_location_limit"();



CREATE OR REPLACE TRIGGER "ensure_account_user_trigger" AFTER INSERT ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_account_user"();



CREATE OR REPLACE TRIGGER "group_reviews_trigger" BEFORE INSERT ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."group_reviews"();



CREATE OR REPLACE TRIGGER "handle_updated_at_accounts" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_businesses" BEFORE UPDATE ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_prompt_pages" BEFORE UPDATE ON "public"."prompt_pages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "keyword_questions_updated_at" BEFORE UPDATE ON "public"."keyword_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_keyword_questions_updated_at"();



CREATE OR REPLACE TRIGGER "maintain_location_count" AFTER INSERT OR DELETE ON "public"."business_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_location_count"();



CREATE OR REPLACE TRIGGER "notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "on_account_created" AFTER INSERT ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_account_created"();



CREATE OR REPLACE TRIGGER "on_account_deleted" AFTER DELETE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_account_deleted"();



CREATE OR REPLACE TRIGGER "on_gbp_post_published" AFTER INSERT OR UPDATE ON "public"."google_business_scheduled_posts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_gbp_post_published"();



CREATE OR REPLACE TRIGGER "on_prompt_page_created" AFTER INSERT ON "public"."prompt_pages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_prompt_page_created"();



CREATE OR REPLACE TRIGGER "on_review_captured" AFTER INSERT ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_review_captured"();



CREATE OR REPLACE TRIGGER "on_review_deleted" AFTER DELETE ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_review_deleted"();



CREATE OR REPLACE TRIGGER "on_widget_created" AFTER INSERT ON "public"."widgets" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_widget_created"();



CREATE OR REPLACE TRIGGER "populate_account_user_fields_trigger" BEFORE INSERT OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_populate_account_user_fields"();



CREATE OR REPLACE TRIGGER "track_feature_usage_trigger" AFTER INSERT ON "public"."analytics_events" FOR EACH ROW WHEN (("new"."event_type" = ANY (ARRAY['ai_generate'::"text", 'contacts_uploaded'::"text", 'save_for_later'::"text", 'unsave_for_later'::"text"]))) EXECUTE FUNCTION "public"."track_feature_usage"();



CREATE OR REPLACE TRIGGER "track_time_spent_trigger" AFTER INSERT ON "public"."analytics_events" FOR EACH ROW WHEN (("new"."event_type" = 'view'::"text")) EXECUTE FUNCTION "public"."track_time_spent"();



CREATE OR REPLACE TRIGGER "trg_optimizer_leads_updated_at" BEFORE UPDATE ON "public"."optimizer_leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_optimizer_leads_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_concept_schedule_next_scheduled_at" BEFORE INSERT OR UPDATE OF "schedule_frequency", "schedule_day_of_week", "schedule_day_of_month", "schedule_hour", "is_enabled", "last_scheduled_run_at" ON "public"."concept_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_concept_schedule_next_scheduled_at"();



CREATE OR REPLACE TRIGGER "trg_update_llm_next_scheduled_at" BEFORE INSERT OR UPDATE OF "schedule_frequency", "schedule_day_of_week", "schedule_day_of_month", "schedule_hour", "is_enabled", "last_scheduled_run_at" ON "public"."llm_visibility_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_llm_next_scheduled_at"();



CREATE OR REPLACE TRIGGER "trg_update_llm_summary_updated_at" BEFORE UPDATE ON "public"."llm_visibility_summary" FOR EACH ROW EXECUTE FUNCTION "public"."update_llm_summary_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_next_scheduled_at" BEFORE INSERT OR UPDATE OF "schedule_frequency", "schedule_day_of_week", "schedule_day_of_month", "schedule_hour", "is_enabled", "last_scheduled_run_at" ON "public"."gg_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_next_scheduled_at"();



CREATE OR REPLACE TRIGGER "trg_update_rank_next_scheduled_at" BEFORE INSERT OR UPDATE OF "schedule_frequency", "schedule_day_of_week", "schedule_day_of_month", "schedule_hour", "is_enabled", "last_scheduled_run_at" ON "public"."rank_keyword_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_rank_next_scheduled_at"();



CREATE OR REPLACE TRIGGER "trigger_account_invitations_updated_at" BEFORE UPDATE ON "public"."account_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_account_invitations_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_auto_populate_review_submission_account_id" BEFORE INSERT OR UPDATE ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_review_submission_account_id"();



CREATE OR REPLACE TRIGGER "trigger_auto_populate_review_submission_business_id" BEFORE INSERT OR UPDATE ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_review_submission_business_id"();



CREATE OR REPLACE TRIGGER "trigger_check_daily_submission_limit" BEFORE INSERT ON "public"."game_scores" FOR EACH ROW EXECUTE FUNCTION "public"."check_daily_submission_limit"();



CREATE OR REPLACE TRIGGER "trigger_check_game_score_rate_limit" BEFORE INSERT ON "public"."game_scores" FOR EACH ROW EXECUTE FUNCTION "public"."check_game_score_rate_limit"();



CREATE OR REPLACE TRIGGER "trigger_email_domain_policies_updated_at" BEFORE UPDATE ON "public"."email_domain_policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_domain_policies_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_keyword_groups_updated_at" BEFORE UPDATE ON "public"."keyword_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_keyword_groups_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_keywords_updated_at" BEFORE UPDATE ON "public"."keywords" FOR EACH ROW EXECUTE FUNCTION "public"."update_keywords_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_game_scores_updated_at" BEFORE UPDATE ON "public"."game_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_game_scores_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_google_business_media_uploads_updated_at" BEFORE UPDATE ON "public"."google_business_media_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."update_google_business_media_uploads_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_onboarding_tasks_updated_at" BEFORE UPDATE ON "public"."onboarding_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_tasks_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_validate_game_score" BEFORE INSERT ON "public"."game_scores" FOR EACH ROW EXECUTE FUNCTION "public"."validate_game_score"();



CREATE OR REPLACE TRIGGER "trigger_wm_boards_updated_at" BEFORE UPDATE ON "public"."wm_boards" FOR EACH ROW EXECUTE FUNCTION "public"."update_wm_boards_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_wm_tasks_updated_at" BEFORE UPDATE ON "public"."wm_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_wm_tasks_updated_at"();



CREATE OR REPLACE TRIGGER "update_account_users_business_name_trigger" AFTER UPDATE OF "name" ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_account_users_business_name"();



CREATE OR REPLACE TRIGGER "update_articles_updated_at" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_business_locations_updated_at" BEFORE UPDATE ON "public"."business_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_actions_updated_at" BEFORE UPDATE ON "public"."campaign_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_campaign_actions_updated_at"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_communication_records_updated_at" BEFORE UPDATE ON "public"."communication_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_communication_templates_updated_at" BEFORE UPDATE ON "public"."communication_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparison_categories_updated_at" BEFORE UPDATE ON "public"."comparison_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparison_features_updated_at" BEFORE UPDATE ON "public"."comparison_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparison_tables_updated_at" BEFORE UPDATE ON "public"."comparison_tables" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_competitor_features_updated_at" BEFORE UPDATE ON "public"."competitor_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_competitors_updated_at" BEFORE UPDATE ON "public"."competitors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_faqs_updated_at" BEFORE UPDATE ON "public"."faqs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_follow_up_reminders_updated_at" BEFORE UPDATE ON "public"."follow_up_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_google_api_rate_limits_updated_at" BEFORE UPDATE ON "public"."google_api_rate_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_google_business_scheduled_post_results_updated_at" BEFORE UPDATE ON "public"."google_business_scheduled_post_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_google_business_scheduled_posts_updated_at" BEFORE UPDATE ON "public"."google_business_scheduled_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_metadata_templates_updated_at" BEFORE UPDATE ON "public"."metadata_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_metadata_templates_updated_at"();



CREATE OR REPLACE TRIGGER "update_navigation_updated_at" BEFORE UPDATE ON "public"."navigation" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_review_reminder_settings_updated_at" BEFORE UPDATE ON "public"."review_reminder_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rss_feed_sources_updated_at" BEFORE UPDATE ON "public"."rss_feed_sources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_social_platform_connections_updated_at" BEFORE UPDATE ON "public"."social_platform_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_widget_reviews_updated_at" BEFORE UPDATE ON "public"."widget_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_widgets_updated_at" BEFORE UPDATE ON "public"."widgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."account_events"
    ADD CONSTRAINT "account_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_invitations"
    ADD CONSTRAINT "account_invitations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_invitations"
    ADD CONSTRAINT "account_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_enrichment_usage"
    ADD CONSTRAINT "ai_enrichment_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_enrichment_usage"
    ADD CONSTRAINT "ai_enrichment_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_keyword_generation_usage"
    ADD CONSTRAINT "ai_keyword_generation_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_keyword_generation_usage"
    ADD CONSTRAINT "ai_keyword_generation_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."article_contexts"
    ADD CONSTRAINT "article_contexts_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_revisions"
    ADD CONSTRAINT "article_revisions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_revisions"
    ADD CONSTRAINT "article_revisions_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_audit_log"
    ADD CONSTRAINT "billing_audit_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_audit_log"
    ADD CONSTRAINT "billing_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_locations"
    ADD CONSTRAINT "business_locations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_locations"
    ADD CONSTRAINT "business_locations_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comeback_email_logs"
    ADD CONSTRAINT "comeback_email_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."communication_templates"
    ADD CONSTRAINT "communication_templates_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_profiles"
    ADD CONSTRAINT "community_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comparison_features"
    ADD CONSTRAINT "comparison_features_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."comparison_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comparison_tables"
    ADD CONSTRAINT "comparison_tables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comparison_tables"
    ADD CONSTRAINT "comparison_tables_single_competitor_id_fkey" FOREIGN KEY ("single_competitor_id") REFERENCES "public"."competitors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."competitor_features"
    ADD CONSTRAINT "competitor_features_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competitor_features"
    ADD CONSTRAINT "competitor_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."comparison_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competitors"
    ADD CONSTRAINT "competitors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."competitors"
    ADD CONSTRAINT "competitors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."concept_schedules"
    ADD CONSTRAINT "concept_schedules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."concept_schedules"
    ADD CONSTRAINT "concept_schedules_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."critical_function_errors"
    ADD CONSTRAINT "critical_function_errors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."critical_function_successes"
    ADD CONSTRAINT "critical_function_successes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."email_domain_policies"
    ADD CONSTRAINT "email_domain_policies_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_domain_policies"
    ADD CONSTRAINT "email_domain_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."faq_contexts"
    ADD CONSTRAINT "faq_contexts_faq_id_fkey" FOREIGN KEY ("faq_id") REFERENCES "public"."faqs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "fk_ai_usage_account_id" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "fk_ai_usage_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "fk_businesses_account_id" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "fk_review_submissions_business_id" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "fk_review_submissions_communication_record" FOREIGN KEY ("communication_record_id") REFERENCES "public"."communication_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "fk_review_submissions_contact_id" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "fk_review_submissions_widget" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."follow_up_reminders"
    ADD CONSTRAINT "follow_up_reminders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follow_up_reminders"
    ADD CONSTRAINT "follow_up_reminders_communication_record_id_fkey" FOREIGN KEY ("communication_record_id") REFERENCES "public"."communication_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follow_up_reminders"
    ADD CONSTRAINT "follow_up_reminders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gbp_change_alerts"
    ADD CONSTRAINT "gbp_change_alerts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gbp_change_alerts"
    ADD CONSTRAINT "gbp_change_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gbp_location_snapshots"
    ADD CONSTRAINT "gbp_location_snapshots_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gbp_protection_settings"
    ADD CONSTRAINT "gbp_protection_settings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_checks"
    ADD CONSTRAINT "gg_checks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_checks"
    ADD CONSTRAINT "gg_checks_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."gg_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_checks"
    ADD CONSTRAINT "gg_checks_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_configs"
    ADD CONSTRAINT "gg_configs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_configs"
    ADD CONSTRAINT "gg_configs_google_business_location_id_fkey" FOREIGN KEY ("google_business_location_id") REFERENCES "public"."google_business_locations"("id");



ALTER TABLE ONLY "public"."gg_daily_summary"
    ADD CONSTRAINT "gg_daily_summary_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_daily_summary"
    ADD CONSTRAINT "gg_daily_summary_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."gg_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_tracked_keywords"
    ADD CONSTRAINT "gg_tracked_keywords_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_tracked_keywords"
    ADD CONSTRAINT "gg_tracked_keywords_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."gg_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gg_tracked_keywords"
    ADD CONSTRAINT "gg_tracked_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_api_rate_limits"
    ADD CONSTRAINT "google_api_rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."google_business_locations"
    ADD CONSTRAINT "google_business_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_media_uploads"
    ADD CONSTRAINT "google_business_media_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_profiles"
    ADD CONSTRAINT "google_business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_scheduled_post_results"
    ADD CONSTRAINT "google_business_scheduled_post_results_scheduled_post_id_fkey" FOREIGN KEY ("scheduled_post_id") REFERENCES "public"."google_business_scheduled_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_scheduled_posts"
    ADD CONSTRAINT "google_business_scheduled_posts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_scheduled_posts"
    ADD CONSTRAINT "google_business_scheduled_posts_rss_feed_item_id_fkey" FOREIGN KEY ("rss_feed_item_id") REFERENCES "public"."rss_feed_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."google_business_scheduled_posts"
    ADD CONSTRAINT "google_business_scheduled_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_events"
    ADD CONSTRAINT "invitation_events_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "public"."account_invitations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_analysis_runs"
    ADD CONSTRAINT "keyword_analysis_runs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_groups"
    ADD CONSTRAINT "keyword_groups_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_prompt_page_usage"
    ADD CONSTRAINT "keyword_prompt_page_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_prompt_page_usage"
    ADD CONSTRAINT "keyword_prompt_page_usage_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_prompt_page_usage"
    ADD CONSTRAINT "keyword_prompt_page_usage_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_questions"
    ADD CONSTRAINT "keyword_questions_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "keyword_review_matches_v2_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "keyword_review_matches_v2_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_review_matches_v2"
    ADD CONSTRAINT "keyword_review_matches_v2_review_submission_id_fkey" FOREIGN KEY ("review_submission_id") REFERENCES "public"."review_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_rotated_in_keyword_id_fkey" FOREIGN KEY ("rotated_in_keyword_id") REFERENCES "public"."keywords"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."keyword_rotation_log"
    ADD CONSTRAINT "keyword_rotation_log_rotated_out_keyword_id_fkey" FOREIGN KEY ("rotated_out_keyword_id") REFERENCES "public"."keywords"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."keyword_set_locations"
    ADD CONSTRAINT "keyword_set_locations_google_business_location_id_fkey" FOREIGN KEY ("google_business_location_id") REFERENCES "public"."google_business_locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_set_locations"
    ADD CONSTRAINT "keyword_set_locations_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "public"."keyword_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_set_terms"
    ADD CONSTRAINT "keyword_set_terms_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "public"."keyword_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_sets"
    ADD CONSTRAINT "keyword_sets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keyword_sets"
    ADD CONSTRAINT "keyword_sets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."keywords"
    ADD CONSTRAINT "keywords_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."keywords"
    ADD CONSTRAINT "keywords_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."keyword_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."llm_visibility_checks"
    ADD CONSTRAINT "llm_visibility_checks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_visibility_checks"
    ADD CONSTRAINT "llm_visibility_checks_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_visibility_schedules"
    ADD CONSTRAINT "llm_visibility_schedules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_visibility_schedules"
    ADD CONSTRAINT "llm_visibility_schedules_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_visibility_summary"
    ADD CONSTRAINT "llm_visibility_summary_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_visibility_summary"
    ADD CONSTRAINT "llm_visibility_summary_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mentions"
    ADD CONSTRAINT "mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."navigation"
    ADD CONSTRAINT "navigation_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."optimizer_email_sends"
    ADD CONSTRAINT "optimizer_email_sends_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."optimizer_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."optimizer_sessions"
    ADD CONSTRAINT "optimizer_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."optimizer_leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_actions"
    ADD CONSTRAINT "prompt_page_activities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_actions"
    ADD CONSTRAINT "prompt_page_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_actions"
    ADD CONSTRAINT "prompt_page_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_actions"
    ADD CONSTRAINT "prompt_page_activities_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_business_location_id_fkey" FOREIGN KEY ("business_location_id") REFERENCES "public"."business_locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rank_checks"
    ADD CONSTRAINT "rank_checks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_checks"
    ADD CONSTRAINT "rank_checks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."rank_keyword_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_checks"
    ADD CONSTRAINT "rank_checks_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_discovery_usage"
    ADD CONSTRAINT "rank_discovery_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_group_keywords"
    ADD CONSTRAINT "rank_group_keywords_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_group_keywords"
    ADD CONSTRAINT "rank_group_keywords_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."rank_keyword_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_group_keywords"
    ADD CONSTRAINT "rank_group_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_keyword_groups"
    ADD CONSTRAINT "rank_keyword_groups_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rank_keyword_groups"
    ADD CONSTRAINT "rank_keyword_groups_location_code_fkey" FOREIGN KEY ("location_code") REFERENCES "public"."rank_locations"("location_code");



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_google_business_location_id_fkey" FOREIGN KEY ("google_business_location_id") REFERENCES "public"."google_business_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "public"."keyword_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_keyword_term_id_fkey" FOREIGN KEY ("keyword_term_id") REFERENCES "public"."keyword_set_terms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_keyword_matches"
    ADD CONSTRAINT "review_keyword_matches_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."review_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reminder_logs"
    ADD CONSTRAINT "review_reminder_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reminder_logs"
    ADD CONSTRAINT "review_reminder_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reminder_settings"
    ADD CONSTRAINT "review_reminder_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_share_events"
    ADD CONSTRAINT "review_share_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_share_images"
    ADD CONSTRAINT "review_share_images_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_business_location_id_fkey" FOREIGN KEY ("business_location_id") REFERENCES "public"."business_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_google_business_location_id_fkey" FOREIGN KEY ("google_business_location_id") REFERENCES "public"."google_business_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rss_feed_items"
    ADD CONSTRAINT "rss_feed_items_feed_source_id_fkey" FOREIGN KEY ("feed_source_id") REFERENCES "public"."rss_feed_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rss_feed_items"
    ADD CONSTRAINT "rss_feed_items_scheduled_post_id_fkey" FOREIGN KEY ("scheduled_post_id") REFERENCES "public"."google_business_scheduled_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rss_feed_sources"
    ADD CONSTRAINT "rss_feed_sources_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."selected_gbp_locations"
    ADD CONSTRAINT "selected_gbp_locations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."selected_gbp_locations"
    ADD CONSTRAINT "selected_gbp_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sentiment_analysis_runs"
    ADD CONSTRAINT "sentiment_analysis_runs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sidebar_favorites"
    ADD CONSTRAINT "sidebar_favorites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trial_reminder_logs"
    ADD CONSTRAINT "trial_reminder_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_reviews"
    ADD CONSTRAINT "widget_reviews_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widgets"
    ADD CONSTRAINT "widgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_boards"
    ADD CONSTRAINT "wm_boards_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_boards"
    ADD CONSTRAINT "wm_boards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wm_task_actions"
    ADD CONSTRAINT "wm_task_actions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_task_actions"
    ADD CONSTRAINT "wm_task_actions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wm_task_actions"
    ADD CONSTRAINT "wm_task_actions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."wm_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_tasks"
    ADD CONSTRAINT "wm_tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_tasks"
    ADD CONSTRAINT "wm_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wm_tasks"
    ADD CONSTRAINT "wm_tasks_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."wm_boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wm_tasks"
    ADD CONSTRAINT "wm_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Account members can delete prompt pages" ON "public"."prompt_pages" FOR DELETE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Account members can insert prompt pages" ON "public"."prompt_pages" FOR INSERT TO "authenticated" WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Account members can update prompt pages" ON "public"."prompt_pages" FOR UPDATE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Account members can view prompt pages" ON "public"."prompt_pages" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Account owners can create invitations" ON "public"."account_invitations" FOR INSERT TO "authenticated" WITH CHECK (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can delete invitations" ON "public"."account_invitations" FOR DELETE TO "authenticated" USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can manage email domain policies" ON "public"."email_domain_policies" USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can update invitations" ON "public"."account_invitations" FOR UPDATE TO "authenticated" USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text"))))) WITH CHECK (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can view invitation events" ON "public"."invitation_events" FOR SELECT USING (("invitation_id" IN ( SELECT "ai"."id"
   FROM ("public"."account_invitations" "ai"
     JOIN "public"."account_users" "au" ON (("ai"."account_id" = "au"."account_id")))
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can view invitations" ON "public"."account_invitations" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Account owners can view their audit logs" ON "public"."audit_logs" FOR SELECT USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text")))));



CREATE POLICY "Admins can delete email templates" ON "public"."email_templates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can delete feedback" ON "public"."feedback" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can delete metadata templates" ON "public"."metadata_templates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can insert email templates" ON "public"."email_templates" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can insert metadata templates" ON "public"."metadata_templates" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can read all article revisions" ON "public"."article_revisions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update email templates" ON "public"."email_templates" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can update feedback" ON "public"."feedback" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can update metadata templates" ON "public"."metadata_templates" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can view all feedback" ON "public"."feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can view daily stats" ON "public"."daily_stats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can view email templates" ON "public"."email_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can view metadata templates" ON "public"."metadata_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins can view platform metrics" ON "public"."platform_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Admins have full access to FAQ contexts" ON "public"."faq_contexts" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to FAQs" ON "public"."faqs" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to article contexts" ON "public"."article_contexts" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to articles" ON "public"."articles" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to comparison categories" ON "public"."comparison_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to comparison features" ON "public"."comparison_features" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to comparison tables" ON "public"."comparison_tables" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to competitor features" ON "public"."competitor_features" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to competitors" ON "public"."competitors" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to media assets" ON "public"."media_assets" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to navigation" ON "public"."navigation" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admins to manage quotes" ON "public"."quotes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "Allow anonymous users to insert reviews" ON "public"."review_submissions" FOR INSERT TO "anon" WITH CHECK (true);



COMMENT ON POLICY "Allow anonymous users to insert reviews" ON "public"."review_submissions" IS 'Allows anonymous users to submit feedback and reviews through prompt pages';



CREATE POLICY "Allow delete for authenticated users" ON "public"."review_drafts" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow feedback submissions" ON "public"."feedback" FOR INSERT WITH CHECK (((("auth"."uid"() IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("auth"."uid"() IS NULL) AND ("user_id" IS NULL)) OR (("auth"."uid"() IS NOT NULL) AND ("user_id" IS NULL))));



CREATE POLICY "Allow insert for authenticated users" ON "public"."review_drafts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow public insert of game scores" ON "public"."game_scores" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert to leaderboard" ON "public"."game_leaderboard" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."widget_reviews" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access to active quotes" ON "public"."quotes" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to game scores" ON "public"."game_scores" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to leaderboard" ON "public"."game_leaderboard" FOR SELECT USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."review_drafts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for authenticated users" ON "public"."review_drafts" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Anonymous users can insert analytics events" ON "public"."analytics_events" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anonymous users can view active widgets" ON "public"."widgets" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Anonymous users can view recent reviews" ON "public"."review_submissions" FOR SELECT TO "anon" USING ((("status" = 'submitted'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."prompt_pages" "pp"
  WHERE (("pp"."id" = "review_submissions"."prompt_page_id") AND ("pp"."is_universal" = true) AND ("pp"."recent_reviews_enabled" = true))))));



COMMENT ON POLICY "Anonymous users can view recent reviews" ON "public"."review_submissions" IS 'Allows anonymous users to view submitted reviews only from universal prompt pages with recent_reviews_enabled=true';



CREATE POLICY "Anonymous users can view reviews for active widgets" ON "public"."widget_reviews" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."is_active" = true)))));



CREATE POLICY "Anyone can view active credit packs" ON "public"."credit_packs" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active pricing rules" ON "public"."credit_pricing_rules" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view comment reactions" ON "public"."comment_reactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view non-deleted comments" ON "public"."comments" FOR SELECT USING (("deleted_at" IS NULL));



CREATE POLICY "Anyone can view tier credits" ON "public"."credit_included_by_tier" FOR SELECT USING (true);



CREATE POLICY "Authenticated can view business locations with universal prompt" ON "public"."business_locations" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT DISTINCT "prompt_pages"."account_id"
   FROM "public"."prompt_pages"
  WHERE ("prompt_pages"."is_universal" = true))));



CREATE POLICY "Authenticated can view businesses with universal prompt pages" ON "public"."businesses" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT DISTINCT "prompt_pages"."account_id"
   FROM "public"."prompt_pages"
  WHERE ("prompt_pages"."is_universal" = true))));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can create custom kickstarters" ON "public"."kickstarters" FOR INSERT TO "authenticated" WITH CHECK (("is_default" = false));



CREATE POLICY "Authenticated users can delete their account widget reviews" ON "public"."widget_reviews" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Authenticated users can delete their account widgets" ON "public"."widgets" FOR DELETE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authenticated users can insert analytics events" ON "public"."analytics_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert widget reviews for their account" ON "public"."widget_reviews" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Authenticated users can insert widgets for their accounts" ON "public"."widgets" FOR INSERT TO "authenticated" WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authenticated users can manage their account reviews" ON "public"."review_submissions" TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "Authenticated users can manage their account reviews" ON "public"."review_submissions" IS 'Allows authenticated users to view/edit/delete reviews only for accounts they belong to (via account_users table)';



CREATE POLICY "Authenticated users can update their account widget reviews" ON "public"."widget_reviews" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"()))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Authenticated users can update their account widgets" ON "public"."widgets" FOR UPDATE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authenticated users can view their account analytics" ON "public"."analytics_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."prompt_pages" "pp"
  WHERE (("pp"."id" = "analytics_events"."prompt_page_id") AND ("pp"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Authenticated users can view their account widget reviews" ON "public"."widget_reviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Authenticated users can view their account widgets" ON "public"."widgets" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authors can soft delete their own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") AND ("deleted_at" IS NULL))) WITH CHECK ((("auth"."uid"() = "author_id") AND ("deleted_at" IS NOT NULL)));



CREATE POLICY "Authors can update their own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Everyone can view default kickstarters" ON "public"."kickstarters" FOR SELECT USING (("is_default" = true));



CREATE POLICY "Members can update account" ON "public"."accounts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can view account" ON "public"."accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only system can update daily stats" ON "public"."daily_stats" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Only system can update platform metrics" ON "public"."platform_metrics" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Prevent public deletes" ON "public"."game_scores" FOR DELETE USING (false);



CREATE POLICY "Prevent public deletes on game_leaderboard" ON "public"."game_leaderboard" FOR DELETE USING (false);



CREATE POLICY "Prevent public updates" ON "public"."game_scores" FOR UPDATE USING (false);



CREATE POLICY "Prevent public updates on game_leaderboard" ON "public"."game_leaderboard" FOR UPDATE USING (false);



CREATE POLICY "Public can read FAQ contexts" ON "public"."faq_contexts" FOR SELECT USING (true);



CREATE POLICY "Public can read FAQs" ON "public"."faqs" FOR SELECT USING (true);



CREATE POLICY "Public can read active competitors" ON "public"."competitors" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Public can read active navigation" ON "public"."navigation" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read article contexts" ON "public"."article_contexts" FOR SELECT USING (true);



CREATE POLICY "Public can read comparison categories" ON "public"."comparison_categories" FOR SELECT USING (true);



CREATE POLICY "Public can read comparison features" ON "public"."comparison_features" FOR SELECT USING (true);



CREATE POLICY "Public can read competitor features" ON "public"."competitor_features" FOR SELECT USING (true);



CREATE POLICY "Public can read media assets" ON "public"."media_assets" FOR SELECT USING (true);



CREATE POLICY "Public can read published articles" ON "public"."articles" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public can read published comparison tables" ON "public"."comparison_tables" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public can view business locations with universal prompt pages" ON "public"."business_locations" FOR SELECT TO "anon" USING (("account_id" IN ( SELECT DISTINCT "prompt_pages"."account_id"
   FROM "public"."prompt_pages"
  WHERE ("prompt_pages"."is_universal" = true))));



CREATE POLICY "Public can view businesses with universal prompt pages" ON "public"."businesses" FOR SELECT TO "anon" USING (("account_id" IN ( SELECT DISTINCT "prompt_pages"."account_id"
   FROM "public"."prompt_pages"
  WHERE ("prompt_pages"."is_universal" = true))));



CREATE POLICY "Public can view public prompt pages" ON "public"."prompt_pages" FOR SELECT TO "anon" USING ((("visibility" = 'public'::"public"."prompt_page_visibility") AND ("status" <> 'draft'::"public"."prompt_page_status")));



CREATE POLICY "Public can view universal prompt pages" ON "public"."prompt_pages" FOR SELECT TO "anon" USING ((("visibility" = 'public'::"public"."prompt_page_visibility") OR ("is_universal" = true)));



CREATE POLICY "Service can insert usage" ON "public"."ai_enrichment_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert usage" ON "public"."ai_keyword_generation_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role bypass for rotation logs" ON "public"."keyword_rotation_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can create accounts" ON "public"."accounts" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert memberships" ON "public"."account_users" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage all keyword groups" ON "public"."keyword_groups" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage all keyword matches v2" ON "public"."keyword_review_matches_v2" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage all keyword usage" ON "public"."keyword_prompt_page_usage" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage all keywords" ON "public"."keywords" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage audit logs" ON "public"."audit_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage billing audit logs" ON "public"."billing_audit_log" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage comeback_email_logs" ON "public"."comeback_email_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage critical errors" ON "public"."critical_function_errors" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage critical successes" ON "public"."critical_function_successes" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage invitation events" ON "public"."invitation_events" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage rate limits" ON "public"."google_api_rate_limits" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage reminder logs" ON "public"."review_reminder_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage trial reminder logs" ON "public"."trial_reminder_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access gg_checks" ON "public"."gg_checks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access gg_configs" ON "public"."gg_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access gg_daily_summary" ON "public"."gg_daily_summary" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access gg_tracked_keywords" ON "public"."gg_tracked_keywords" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access llm_visibility_checks" ON "public"."llm_visibility_checks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access llm_visibility_schedules" ON "public"."llm_visibility_schedules" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access llm_visibility_summary" ON "public"."llm_visibility_summary" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access rank_checks" ON "public"."rank_checks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access rank_discovery_usage" ON "public"."rank_discovery_usage" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access rank_group_keywords" ON "public"."rank_group_keywords" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access rank_keyword_groups" ON "public"."rank_keyword_groups" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can add their own reactions" ON "public"."comment_reactions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create accounts" ON "public"."accounts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create activities for their account" ON "public"."campaign_actions" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create boards for their accounts" ON "public"."wm_boards" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create business locations" ON "public"."business_locations" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create feeds for own accounts" ON "public"."rss_feed_sources" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create rotation logs for their accounts" ON "public"."keyword_rotation_log" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create sentiment runs for their accounts" ON "public"."sentiment_analysis_runs" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create share events for their accounts" ON "public"."review_share_events" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create share images for their account" ON "public"."review_share_images" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create task actions for their accounts" ON "public"."wm_task_actions" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create tasks for their accounts" ON "public"."wm_tasks" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete Google Business Profile data for their account" ON "public"."google_business_profiles" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete Google Business locations for their accounts" ON "public"."google_business_locations" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete Google Business scheduled post results" ON "public"."google_business_scheduled_post_results" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."google_business_scheduled_posts" "sp"
     JOIN "public"."account_users" "au" ON (("au"."account_id" = "sp"."account_id")))
  WHERE (("sp"."id" = "google_business_scheduled_post_results"."scheduled_post_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete alerts for their accounts" ON "public"."gbp_change_alerts" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete boards for their accounts" ON "public"."wm_boards" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete contacts for their accounts" ON "public"."contacts" FOR DELETE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete items from own feeds" ON "public"."rss_feed_items" FOR DELETE USING (("feed_source_id" IN ( SELECT "rss_feed_sources"."id"
   FROM "public"."rss_feed_sources"
  WHERE ("rss_feed_sources"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete keyword questions" ON "public"."keyword_questions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."keywords" "k"
     JOIN "public"."account_users" "au" ON (("k"."account_id" = "au"."account_id")))
  WHERE (("k"."id" = "keyword_questions"."keyword_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own account favorites" ON "public"."sidebar_favorites" FOR DELETE USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own account feeds" ON "public"."rss_feed_sources" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own account gg_configs" ON "public"."gg_configs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_configs"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own account gg_tracked_keywords" ON "public"."gg_tracked_keywords" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_tracked_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own account keyword analysis runs" ON "public"."keyword_analysis_runs" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own account keyword matches" ON "public"."review_keyword_matches" FOR DELETE USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own account llm_visibility_schedules" ON "public"."llm_visibility_schedules" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_schedules"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own account rank_group_keywords" ON "public"."rank_group_keywords" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_group_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own account rank_keyword_groups" ON "public"."rank_keyword_groups" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_keyword_groups"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own business locations" ON "public"."business_locations" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own media uploads" ON "public"."google_business_media_uploads" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete selected locations for their accounts" ON "public"."selected_gbp_locations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "selected_gbp_locations"."account_id") AND ("account_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete sentiment runs for their accounts" ON "public"."sentiment_analysis_runs" FOR DELETE USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."account_id" = "sentiment_analysis_runs"."account_id") AND ("account_users"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can delete settings for their accounts" ON "public"."gbp_protection_settings" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete share events for their accounts" ON "public"."review_share_events" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete snapshots for their accounts" ON "public"."gbp_location_snapshots" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete social platform connections for their accounts" ON "public"."social_platform_connections" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "social_platform_connections"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete tasks for their accounts" ON "public"."wm_tasks" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their Google Business scheduled posts" ON "public"."google_business_scheduled_posts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_scheduled_posts"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their account's contacts" ON "public"."contacts" FOR DELETE USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) OR ("account_id" = "auth"."uid"())));



CREATE POLICY "Users can delete their account's keyword groups" ON "public"."keyword_groups" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their account's keyword usage" ON "public"."keyword_prompt_page_usage" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their account's keywords" ON "public"."keywords" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their account's share images" ON "public"."review_share_images" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own activities" ON "public"."campaign_actions" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own custom kickstarters" ON "public"."kickstarters" FOR DELETE TO "authenticated" USING ((("is_default" = false) AND (EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."account_id" = "auth"."uid"()) AND (("b"."selected_kickstarters" ? ("kickstarters"."id")::"text") OR (EXISTS ( SELECT 1
           FROM "public"."prompt_pages" "pp"
          WHERE (("pp"."account_id" = "b"."account_id") AND ("pp"."selected_kickstarters" ? ("kickstarters"."id")::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."business_locations" "bl"
          WHERE (("bl"."account_id" = "b"."account_id") AND ("bl"."selected_kickstarters" ? ("kickstarters"."id")::"text"))))))))));



CREATE POLICY "Users can delete their own onboarding tasks" ON "public"."onboarding_tasks" FOR DELETE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own widgets" ON "public"."widgets" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert Google Business Profile data for their account" ON "public"."google_business_profiles" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert Google Business locations for their accounts" ON "public"."google_business_locations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert Google Business scheduled post results" ON "public"."google_business_scheduled_post_results" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."google_business_scheduled_posts" "sp"
     JOIN "public"."account_users" "au" ON (("au"."account_id" = "sp"."account_id")))
  WHERE (("sp"."id" = "google_business_scheduled_post_results"."scheduled_post_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert alerts for their accounts" ON "public"."gbp_change_alerts" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert contacts for their account" ON "public"."contacts" FOR INSERT WITH CHECK ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) OR ("account_id" = "auth"."uid"())));



CREATE POLICY "Users can insert contacts for their accounts" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert items for own feeds" ON "public"."rss_feed_items" FOR INSERT WITH CHECK (("feed_source_id" IN ( SELECT "rss_feed_sources"."id"
   FROM "public"."rss_feed_sources"
  WHERE ("rss_feed_sources"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert keyword groups" ON "public"."keyword_groups" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert keyword matches v2" ON "public"."keyword_review_matches_v2" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert keyword questions" ON "public"."keyword_questions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."keywords" "k"
     JOIN "public"."account_users" "au" ON (("k"."account_id" = "au"."account_id")))
  WHERE (("k"."id" = "keyword_questions"."keyword_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert keyword usage" ON "public"."keyword_prompt_page_usage" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert keywords" ON "public"."keywords" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert notification preferences for their accounts" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own account favorites" ON "public"."sidebar_favorites" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own account gg_checks" ON "public"."gg_checks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account gg_configs" ON "public"."gg_configs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_configs"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account gg_daily_summary" ON "public"."gg_daily_summary" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_daily_summary"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account gg_tracked_keywords" ON "public"."gg_tracked_keywords" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_tracked_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account keyword analysis runs" ON "public"."keyword_analysis_runs" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own account keyword matches" ON "public"."review_keyword_matches" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own account llm_visibility_checks" ON "public"."llm_visibility_checks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account llm_visibility_schedules" ON "public"."llm_visibility_schedules" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_schedules"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account llm_visibility_summary" ON "public"."llm_visibility_summary" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_summary"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account rank_checks" ON "public"."rank_checks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account rank_discovery_usage" ON "public"."rank_discovery_usage" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_discovery_usage"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account rank_group_keywords" ON "public"."rank_group_keywords" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_group_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own account rank_keyword_groups" ON "public"."rank_keyword_groups" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_keyword_groups"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own media uploads" ON "public"."google_business_media_uploads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert reminder settings for their accounts" ON "public"."review_reminder_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert selected locations for their accounts" ON "public"."selected_gbp_locations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "selected_gbp_locations"."account_id") AND ("account_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert settings for their accounts" ON "public"."gbp_protection_settings" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert snapshots for their accounts" ON "public"."gbp_location_snapshots" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert social platform connections for their accounts" ON "public"."social_platform_connections" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "social_platform_connections"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their Google Business scheduled posts" ON "public"."google_business_scheduled_posts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_scheduled_posts"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own AI usage" ON "public"."ai_usage" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own communication records" ON "public"."communication_records" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own follow-up reminders" ON "public"."follow_up_reminders" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own onboarding tasks" ON "public"."onboarding_tasks" FOR INSERT WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own widgets" ON "public"."widgets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own communication templates" ON "public"."communication_templates" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can remove their own reactions" ON "public"."comment_reactions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update Google Business Profile data for their account" ON "public"."google_business_profiles" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update Google Business locations for their accounts" ON "public"."google_business_locations" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update alerts for their accounts" ON "public"."gbp_change_alerts" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update boards for their accounts" ON "public"."wm_boards" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update contacts for their accounts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update items from own feeds" ON "public"."rss_feed_items" FOR UPDATE USING (("feed_source_id" IN ( SELECT "rss_feed_sources"."id"
   FROM "public"."rss_feed_sources"
  WHERE ("rss_feed_sources"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update keyword questions" ON "public"."keyword_questions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."keywords" "k"
     JOIN "public"."account_users" "au" ON (("k"."account_id" = "au"."account_id")))
  WHERE (("k"."id" = "keyword_questions"."keyword_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account favorites" ON "public"."sidebar_favorites" FOR UPDATE USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own account feeds" ON "public"."rss_feed_sources" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own account gg_configs" ON "public"."gg_configs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_configs"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account gg_tracked_keywords" ON "public"."gg_tracked_keywords" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_tracked_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account keyword matches" ON "public"."review_keyword_matches" FOR UPDATE USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own account llm_visibility_schedules" ON "public"."llm_visibility_schedules" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_schedules"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account llm_visibility_summary" ON "public"."llm_visibility_summary" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_summary"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account rank_discovery_usage" ON "public"."rank_discovery_usage" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_discovery_usage"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account rank_group_keywords" ON "public"."rank_group_keywords" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_group_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own account rank_keyword_groups" ON "public"."rank_keyword_groups" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_keyword_groups"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own business locations" ON "public"."business_locations" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own media uploads" ON "public"."google_business_media_uploads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update owned accounts" ON "public"."accounts" FOR UPDATE USING (("id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Users can update reminder settings for their accounts" ON "public"."review_reminder_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update selected locations for their accounts" ON "public"."selected_gbp_locations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "selected_gbp_locations"."account_id") AND ("account_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update settings for their accounts" ON "public"."gbp_protection_settings" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update share events for their accounts" ON "public"."review_share_events" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update snapshots for their accounts" ON "public"."gbp_location_snapshots" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update social platform connections for their accounts" ON "public"."social_platform_connections" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "social_platform_connections"."account_id") AND ("au"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "social_platform_connections"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update tasks for their accounts" ON "public"."wm_tasks" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their Google Business scheduled post results" ON "public"."google_business_scheduled_post_results" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."google_business_scheduled_posts" "sp"
     JOIN "public"."account_users" "au" ON (("au"."account_id" = "sp"."account_id")))
  WHERE (("sp"."id" = "google_business_scheduled_post_results"."scheduled_post_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their Google Business scheduled posts" ON "public"."google_business_scheduled_posts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_scheduled_posts"."account_id") AND ("au"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_scheduled_posts"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their account notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their account's contacts" ON "public"."contacts" FOR UPDATE USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) OR ("account_id" = "auth"."uid"())));



CREATE POLICY "Users can update their account's keyword groups" ON "public"."keyword_groups" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their account's keyword usage" ON "public"."keyword_prompt_page_usage" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their account's keywords" ON "public"."keywords" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their notifications" ON "public"."notifications" FOR UPDATE USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) AND (("user_id" IS NULL) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own activities" ON "public"."campaign_actions" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own communication records" ON "public"."communication_records" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own custom kickstarters" ON "public"."kickstarters" FOR UPDATE TO "authenticated" USING ((("is_default" = false) AND (EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."account_id" = "auth"."uid"()) AND (("b"."selected_kickstarters" ? ("kickstarters"."id")::"text") OR (EXISTS ( SELECT 1
           FROM "public"."prompt_pages" "pp"
          WHERE (("pp"."account_id" = "b"."account_id") AND ("pp"."selected_kickstarters" ? ("kickstarters"."id")::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."business_locations" "bl"
          WHERE (("bl"."account_id" = "b"."account_id") AND ("bl"."selected_kickstarters" ? ("kickstarters"."id")::"text"))))))))));



CREATE POLICY "Users can update their own follow-up reminders" ON "public"."follow_up_reminders" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own onboarding tasks" ON "public"."onboarding_tasks" FOR UPDATE USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own widgets" ON "public"."widgets" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view Google Business Profile data for their accounts" ON "public"."google_business_profiles" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view Google Business locations for their accounts" ON "public"."google_business_locations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view activities for their account" ON "public"."campaign_actions" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view alerts for their accounts" ON "public"."gbp_change_alerts" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view boards for their accounts" ON "public"."wm_boards" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view contacts for their accounts" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view items from own feeds" ON "public"."rss_feed_items" FOR SELECT USING (("feed_source_id" IN ( SELECT "rss_feed_sources"."id"
   FROM "public"."rss_feed_sources"
  WHERE ("rss_feed_sources"."account_id" IN ( SELECT "account_users"."account_id"
           FROM "public"."account_users"
          WHERE ("account_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view keyword questions" ON "public"."keyword_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."keywords" "k"
     JOIN "public"."account_users" "au" ON (("k"."account_id" = "au"."account_id")))
  WHERE (("k"."id" = "keyword_questions"."keyword_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account credit balance" ON "public"."credit_balances" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account credit ledger" ON "public"."credit_ledger" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account events" ON "public"."account_events" FOR SELECT TO "authenticated" USING (("account_id" = "auth"."uid"()));



CREATE POLICY "Users can view own account favorites" ON "public"."sidebar_favorites" FOR SELECT USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account feeds" ON "public"."rss_feed_sources" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account gg_checks" ON "public"."gg_checks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account gg_configs" ON "public"."gg_configs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_configs"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account gg_daily_summary" ON "public"."gg_daily_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_daily_summary"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account gg_tracked_keywords" ON "public"."gg_tracked_keywords" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "gg_tracked_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account keyword analysis runs" ON "public"."keyword_analysis_runs" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account keyword matches" ON "public"."review_keyword_matches" FOR SELECT USING (("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account llm_visibility_checks" ON "public"."llm_visibility_checks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account llm_visibility_schedules" ON "public"."llm_visibility_schedules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_schedules"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account llm_visibility_summary" ON "public"."llm_visibility_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "llm_visibility_summary"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account rank_checks" ON "public"."rank_checks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_checks"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account rank_discovery_usage" ON "public"."rank_discovery_usage" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_discovery_usage"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account rank_group_keywords" ON "public"."rank_group_keywords" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_group_keywords"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account rank_keyword_groups" ON "public"."rank_keyword_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "rank_keyword_groups"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own account usage" ON "public"."ai_enrichment_usage" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account usage" ON "public"."ai_keyword_generation_usage" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own business locations" ON "public"."business_locations" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own feedback" ON "public"."feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own media uploads" ON "public"."google_business_media_uploads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view reminder logs for their accounts" ON "public"."review_reminder_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view reminder settings for their accounts" ON "public"."review_reminder_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "au"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view selected locations for their accounts" ON "public"."selected_gbp_locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "selected_gbp_locations"."account_id") AND ("account_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view sentiment runs for their accounts" ON "public"."sentiment_analysis_runs" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view settings for their accounts" ON "public"."gbp_protection_settings" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view share events for their accounts" ON "public"."review_share_events" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view snapshots for their accounts" ON "public"."gbp_location_snapshots" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view social platform connections for their accounts" ON "public"."social_platform_connections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "social_platform_connections"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view task actions for their accounts" ON "public"."wm_task_actions" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view tasks for their accounts" ON "public"."wm_tasks" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their Google Business scheduled post results" ON "public"."google_business_scheduled_post_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."google_business_scheduled_posts" "sp"
     JOIN "public"."account_users" "au" ON (("au"."account_id" = "sp"."account_id")))
  WHERE (("sp"."id" = "google_business_scheduled_post_results"."scheduled_post_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their Google Business scheduled posts" ON "public"."google_business_scheduled_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "google_business_scheduled_posts"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their account notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account notifications" ON "public"."notifications" FOR SELECT USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) AND (("user_id" IS NULL) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's contacts" ON "public"."contacts" FOR SELECT USING ((("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))) OR ("account_id" = "auth"."uid"())));



CREATE POLICY "Users can view their account's keyword groups" ON "public"."keyword_groups" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's keyword matches v2" ON "public"."keyword_review_matches_v2" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's keyword usage" ON "public"."keyword_prompt_page_usage" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's keywords" ON "public"."keywords" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's rotation logs" ON "public"."keyword_rotation_log" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their account's share images" ON "public"."review_share_images" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their accounts" ON "public"."accounts" FOR SELECT USING (("id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their critical errors" ON "public"."critical_function_errors" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their critical successes" ON "public"."critical_function_successes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own AI usage" ON "public"."ai_usage" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own communication records" ON "public"."communication_records" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own communication templates" ON "public"."communication_templates" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own custom kickstarters" ON "public"."kickstarters" FOR SELECT TO "authenticated" USING ((("is_default" = false) AND (EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."account_id" = "auth"."uid"()) AND (("b"."selected_kickstarters" ? ("kickstarters"."id")::"text") OR (EXISTS ( SELECT 1
           FROM "public"."prompt_pages" "pp"
          WHERE (("pp"."account_id" = "b"."account_id") AND ("pp"."selected_kickstarters" ? ("kickstarters"."id")::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."business_locations" "bl"
          WHERE (("bl"."account_id" = "b"."account_id") AND ("bl"."selected_kickstarters" ? ("kickstarters"."id")::"text"))))))))));



CREATE POLICY "Users can view their own follow-up reminders" ON "public"."follow_up_reminders" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own onboarding tasks" ON "public"."onboarding_tasks" FOR SELECT USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own widgets" ON "public"."widgets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own memberships" ON "public"."account_users" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."account_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."account_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."account_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_users_delete_policy" ON "public"."account_users" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("account_id" IN ( SELECT "account_users_1"."account_id"
   FROM "public"."account_users" "account_users_1"
  WHERE (("account_users_1"."user_id" = "auth"."uid"()) AND ("account_users_1"."role" = 'owner'::"text"))))));



CREATE POLICY "account_users_insert_policy" ON "public"."account_users" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR ("account_id" IN ( SELECT "au"."account_id"
   FROM "public"."account_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."role" = 'owner'::"text"))))));



CREATE POLICY "account_users_select_policy" ON "public"."account_users" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



COMMENT ON POLICY "account_users_select_policy" ON "public"."account_users" IS 'Critical policy for auth flow - users must ALWAYS be able to see their own account_user records';



CREATE POLICY "account_users_service_role_policy" ON "public"."account_users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "account_users_update_policy" ON "public"."account_users" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("account_id" IN ( SELECT "account_users_1"."account_id"
   FROM "public"."account_users" "account_users_1"
  WHERE (("account_users_1"."user_id" = "auth"."uid"()) AND ("account_users_1"."role" = 'owner'::"text")))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("account_id" IN ( SELECT "account_users_1"."account_id"
   FROM "public"."account_users" "account_users_1"
  WHERE (("account_users_1"."user_id" = "auth"."uid"()) AND ("account_users_1"."role" = 'owner'::"text"))))));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_insert_policy" ON "public"."accounts" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "accounts_insert_service" ON "public"."accounts" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "accounts_select_by_membership" ON "public"."accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "accounts_select_policy" ON "public"."accounts" FOR SELECT USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"()))))));



CREATE POLICY "accounts_service_role_policy" ON "public"."accounts" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "accounts_update_by_role" ON "public"."accounts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "accounts"."id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "accounts_update_policy" ON "public"."accounts" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = 'owner'::"text")))))) WITH CHECK ((("id" = "auth"."uid"()) OR ("id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = 'owner'::"text"))))));



CREATE POLICY "admins_can_delete_announcements" ON "public"."announcements" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_delete_channels" ON "public"."channels" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_delete_comments" ON "public"."post_comments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_delete_mentions" ON "public"."mentions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_delete_posts" ON "public"."posts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_insert_announcements" ON "public"."announcements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_select_all_announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_update_announcements" ON "public"."announcements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_update_channels" ON "public"."channels" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_update_comments" ON "public"."post_comments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_update_posts" ON "public"."posts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_view_all_mentions" ON "public"."mentions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



CREATE POLICY "admins_can_view_all_profiles" ON "public"."community_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."accounts"
  WHERE (("accounts"."id" = "auth"."uid"()) AND ("accounts"."is_admin" = true)))));



ALTER TABLE "public"."ai_enrichment_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_keyword_generation_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_contexts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_view_channels" ON "public"."channels" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "authenticated_users_can_view_comment_reactions" ON "public"."comment_reactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_comments" ON "public"."post_comments" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "authenticated_users_can_view_post_reactions" ON "public"."post_reactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_posts" ON "public"."posts" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "authenticated_users_can_view_profiles" ON "public"."community_profiles" FOR SELECT TO "authenticated" USING (("opted_in_at" IS NOT NULL));



CREATE POLICY "authors_can_delete_own_comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "authors_can_delete_own_comments" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK ((("author_id" = "auth"."uid"()) AND ("deleted_at" IS NOT NULL)));



CREATE POLICY "authors_can_delete_own_posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "authors_can_update_own_comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("deleted_at" IS NULL))) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "authors_can_update_own_comments" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("deleted_at" IS NULL))) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "authors_can_update_own_posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("deleted_at" IS NULL))) WITH CHECK (("author_id" = "auth"."uid"()));



ALTER TABLE "public"."billing_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "businesses_modify_policy" ON "public"."businesses" TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'member'::"text"])))))) WITH CHECK (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'member'::"text"]))))));



CREATE POLICY "businesses_select_policy" ON "public"."businesses" FOR SELECT TO "authenticated" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "businesses_service_role_policy" ON "public"."businesses" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."campaign_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comeback_email_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comparison_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comparison_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comparison_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competitor_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competitors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."concept_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "concept_schedules_account_access" ON "public"."concept_schedules" USING (("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "concept_schedules_service_access" ON "public"."concept_schedules" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_included_by_tier" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_packs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_pricing_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."critical_function_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."critical_function_successes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_domain_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faq_contexts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faqs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_up_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_leaderboard" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gbp_change_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gbp_location_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gbp_protection_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gg_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gg_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gg_daily_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gg_tracked_keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_api_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_media_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_scheduled_post_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_scheduled_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitation_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_analysis_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_prompt_page_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_review_matches_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keyword_rotation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kickstarters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_visibility_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_visibility_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_visibility_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."metadata_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."navigation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."optimizer_email_sends" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "optimizer_email_sends_service_role_full" ON "public"."optimizer_email_sends" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."optimizer_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "optimizer_leads_service_role_full" ON "public"."optimizer_leads" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "optimizer_leads_session_read" ON "public"."optimizer_leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."optimizer_sessions" "os"
  WHERE ((("os"."email")::"text" = ("optimizer_leads"."email")::"text") AND ("os"."expires_at" > "now"()) AND (("os"."session_token_hash")::"text" = "encode"("extensions"."digest"(COALESCE("current_setting"('request.header.x-session-token'::"text", true), ''::"text"), 'sha256'::"text"), 'hex'::"text"))))));



ALTER TABLE "public"."optimizer_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "optimizer_sessions_service_role_full" ON "public"."optimizer_sessions" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."platform_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rank_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rank_discovery_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rank_group_keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rank_keyword_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_counters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_keyword_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_reminder_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_reminder_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_share_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_share_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rss_feed_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rss_feed_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."selected_gbp_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sentiment_analysis_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service role can manage rate_limit_counters" ON "public"."rate_limit_counters" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."sidebar_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "simple_account_users_select" ON "public"."account_users" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "simple_accounts_select" ON "public"."accounts" FOR SELECT USING (("id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE ("account_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "simple_announcements_select" ON "public"."announcements" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."social_platform_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trial_reminder_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_create_businesses" ON "public"."businesses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "businesses"."account_id") AND ("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "users_can_create_comment_reactions" ON "public"."comment_reactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_create_comments" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "users_can_create_own_profile" ON "public"."community_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_create_post_reactions" ON "public"."post_reactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_create_posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "users_can_delete_businesses" ON "public"."businesses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "businesses"."account_id") AND ("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = 'owner'::"text")))));



CREATE POLICY "users_can_delete_own_comment_reactions" ON "public"."comment_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_delete_own_post_reactions" ON "public"."post_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_update_businesses" ON "public"."businesses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "businesses"."account_id") AND ("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "businesses"."account_id") AND ("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "users_can_update_own_mentions" ON "public"."mentions" FOR UPDATE TO "authenticated" USING (("mentioned_user_id" = "auth"."uid"())) WITH CHECK (("mentioned_user_id" = "auth"."uid"()));



CREATE POLICY "users_can_update_own_profile" ON "public"."community_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_view_own_mentions" ON "public"."mentions" FOR SELECT TO "authenticated" USING (("mentioned_user_id" = "auth"."uid"()));



CREATE POLICY "users_can_view_their_businesses" ON "public"."businesses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users"
  WHERE (("account_users"."account_id" = "businesses"."account_id") AND ("account_users"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."widget_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."widgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wm_boards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wm_task_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wm_tasks" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_account_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_business_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_business_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_review_submission_business_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."build_nav_node"("node_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."build_nav_node"("node_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."build_nav_node"("node_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_llm_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_llm_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_llm_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_next_scheduled_at"("p_frequency" character varying, "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_next_scheduled_at"("p_frequency" character varying, "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_next_scheduled_at"("p_frequency" character varying, "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_rank_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_rank_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_rank_next_scheduled_at"("p_frequency" "text", "p_day_of_week" integer, "p_day_of_month" integer, "p_hour" integer, "p_from_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_add_user_to_account"("account_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_add_user_to_account"("account_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_add_user_to_account"("account_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_account_reactivation"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_account_reactivation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_account_reactivation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_daily_submission_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_daily_submission_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_daily_submission_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_game_score_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_game_score_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_game_score_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_gbp_location_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_gbp_location_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_gbp_location_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_location_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_location_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_location_limit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_notifications"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_accounts_eligible_for_deletion"("retention_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_account_for_user"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_account_for_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_account_for_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_account_for_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_additional_account"("p_user_id" "uuid", "p_account_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_additional_account"("p_user_id" "uuid", "p_account_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_additional_account"("p_user_id" "uuid", "p_account_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_article_revision"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_article_revision"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_article_revision"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_mention_records"("p_source_type" "text", "p_source_id" "uuid", "p_author_id" "uuid", "p_mentioned_usernames" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_owns_account"("account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_owns_account"("account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_owns_account"("account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_account_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_account_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_account_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_username"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_username"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_username"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_info"("account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_info"("account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_info"("account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_user_count"("account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_user_count"("account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_user_count"("account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accounts_eligible_for_deletion"("retention_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer, "p_offset" integer, "p_event_category" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer, "p_offset" integer, "p_event_category" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_logs"("p_account_id" "uuid", "p_limit" integer, "p_offset" integer, "p_event_category" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comparison_table_data"("table_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_comparison_table_data"("table_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_comparison_table_data"("table_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_contextual_articles"("route" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer, "user_plan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer, "user_plan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_contextual_faqs"("route" "text", "limit_count" integer, "user_plan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_analytics"("p_account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_metric"("p_metric_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_metric"("p_metric_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metric"("p_metric_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_navigation_tree"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_navigation_tree"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_navigation_tree"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_display_identity"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."group_reviews"() TO "anon";
GRANT ALL ON FUNCTION "public"."group_reviews"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."group_reviews"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_clean"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_clean"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_clean"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_with_proper_pattern"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_with_proper_pattern"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_with_proper_pattern"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_confirmation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_metric"("p_metric_name" "text", "p_increment" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_metric"("p_metric_name" "text", "p_increment" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_metric"("p_metric_name" "text", "p_increment" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_rss_posts_today"("feed_id" "uuid", "increment_by" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_rss_posts_today"("feed_id" "uuid", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_rss_posts_today"("feed_id" "uuid", "increment_by" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_domain_allowed"("p_account_id" "uuid", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_account_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_event_category" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb", "p_user_agent" "text", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb", "p_user_agent" "text", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_invitation_event"("p_invitation_id" "uuid", "p_event_type" "text", "p_event_data" "jsonb", "p_user_agent" "text", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."parse_mentions"("p_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."parse_mentions"("p_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_mentions"("p_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_account_users_readable_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_account_users_readable_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_account_users_readable_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_historical_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_historical_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_historical_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_articles"("search_query" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_optimizer_leads_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_optimizer_leads_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_optimizer_leads_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."simple_ensure_account"("user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."simple_ensure_account"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."simple_ensure_account"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_ensure_account"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_account_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_account_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_account_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_account_deleted"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_account_deleted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_account_deleted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_gbp_post_published"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_gbp_post_published"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_gbp_post_published"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_populate_account_user_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_populate_account_user_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_populate_account_user_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_prompt_page_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_prompt_page_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_prompt_page_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_review_captured"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_review_captured"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_review_captured"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_review_deleted"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_review_deleted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_review_deleted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_account_users_business_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_account_users_business_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_account_users_business_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_widget_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_widget_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_widget_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_account_invitations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_account_invitations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_account_invitations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_campaign_actions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_campaign_actions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_campaign_actions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_concept_schedule_next_scheduled_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_concept_schedule_next_scheduled_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_concept_schedule_next_scheduled_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credit_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_credit_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credit_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_email_domain_policies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_email_domain_policies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_email_domain_policies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_game_scores_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_game_scores_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_game_scores_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_google_business_media_uploads_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_google_business_media_uploads_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_google_business_media_uploads_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_keyword_groups_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_keyword_groups_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_keyword_groups_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_keyword_questions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_keyword_questions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_keyword_questions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_keywords_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_keywords_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_keywords_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_llm_next_scheduled_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_llm_next_scheduled_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_llm_next_scheduled_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_llm_summary_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_llm_summary_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_llm_summary_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_location_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_location_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_location_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_metadata_templates_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_metadata_templates_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_metadata_templates_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_next_scheduled_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_next_scheduled_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_next_scheduled_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_onboarding_tasks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_onboarding_tasks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_onboarding_tasks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rank_next_scheduled_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rank_next_scheduled_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rank_next_scheduled_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wm_boards_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wm_boards_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wm_boards_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wm_tasks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wm_tasks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wm_tasks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_game_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_game_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_game_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_rls_enabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_rls_enabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_rls_enabled"() TO "service_role";



GRANT ALL ON TABLE "public"."account_events" TO "anon";
GRANT ALL ON TABLE "public"."account_events" TO "authenticated";
GRANT ALL ON TABLE "public"."account_events" TO "service_role";



GRANT ALL ON TABLE "public"."account_invitations" TO "anon";
GRANT ALL ON TABLE "public"."account_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."account_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."account_users" TO "anon";
GRANT ALL ON TABLE "public"."account_users" TO "authenticated";
GRANT ALL ON TABLE "public"."account_users" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."account_users_readable" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."account_users_readable" TO "authenticated";
GRANT ALL ON TABLE "public"."account_users_readable" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."ai_enrichment_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_enrichment_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_enrichment_usage" TO "service_role";



GRANT ALL ON TABLE "public"."ai_keyword_generation_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_keyword_generation_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_keyword_generation_usage" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."article_contexts" TO "anon";
GRANT ALL ON TABLE "public"."article_contexts" TO "authenticated";
GRANT ALL ON TABLE "public"."article_contexts" TO "service_role";



GRANT ALL ON TABLE "public"."article_revisions" TO "anon";
GRANT ALL ON TABLE "public"."article_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."article_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."billing_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."billing_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."business_locations" TO "anon";
GRANT ALL ON TABLE "public"."business_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."business_locations" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_actions" TO "anon";
GRANT ALL ON TABLE "public"."campaign_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_actions" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."comeback_email_logs" TO "anon";
GRANT ALL ON TABLE "public"."comeback_email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."comeback_email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."communication_records" TO "anon";
GRANT ALL ON TABLE "public"."communication_records" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_records" TO "service_role";



GRANT ALL ON TABLE "public"."communication_templates" TO "anon";
GRANT ALL ON TABLE "public"."communication_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_templates" TO "service_role";



GRANT ALL ON TABLE "public"."community_profiles" TO "anon";
GRANT ALL ON TABLE "public"."community_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."community_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."comparison_categories" TO "anon";
GRANT ALL ON TABLE "public"."comparison_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."comparison_categories" TO "service_role";



GRANT ALL ON TABLE "public"."comparison_features" TO "anon";
GRANT ALL ON TABLE "public"."comparison_features" TO "authenticated";
GRANT ALL ON TABLE "public"."comparison_features" TO "service_role";



GRANT ALL ON TABLE "public"."comparison_tables" TO "anon";
GRANT ALL ON TABLE "public"."comparison_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."comparison_tables" TO "service_role";



GRANT ALL ON TABLE "public"."competitor_features" TO "anon";
GRANT ALL ON TABLE "public"."competitor_features" TO "authenticated";
GRANT ALL ON TABLE "public"."competitor_features" TO "service_role";



GRANT ALL ON TABLE "public"."competitors" TO "anon";
GRANT ALL ON TABLE "public"."competitors" TO "authenticated";
GRANT ALL ON TABLE "public"."competitors" TO "service_role";



GRANT ALL ON TABLE "public"."concept_schedules" TO "anon";
GRANT ALL ON TABLE "public"."concept_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."concept_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."credit_balances" TO "anon";
GRANT ALL ON TABLE "public"."credit_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_balances" TO "service_role";



GRANT ALL ON TABLE "public"."credit_included_by_tier" TO "anon";
GRANT ALL ON TABLE "public"."credit_included_by_tier" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_included_by_tier" TO "service_role";



GRANT ALL ON TABLE "public"."credit_ledger" TO "anon";
GRANT ALL ON TABLE "public"."credit_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."credit_packs" TO "anon";
GRANT ALL ON TABLE "public"."credit_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_packs" TO "service_role";



GRANT ALL ON TABLE "public"."credit_pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."credit_pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."critical_function_errors" TO "anon";
GRANT ALL ON TABLE "public"."critical_function_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."critical_function_errors" TO "service_role";



GRANT ALL ON TABLE "public"."critical_function_successes" TO "anon";
GRANT ALL ON TABLE "public"."critical_function_successes" TO "authenticated";
GRANT ALL ON TABLE "public"."critical_function_successes" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."critical_function_health" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."critical_function_health" TO "authenticated";
GRANT ALL ON TABLE "public"."critical_function_health" TO "service_role";



GRANT ALL ON TABLE "public"."daily_stats" TO "anon";
GRANT ALL ON TABLE "public"."daily_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_stats" TO "service_role";



GRANT ALL ON TABLE "public"."email_domain_policies" TO "anon";
GRANT ALL ON TABLE "public"."email_domain_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."email_domain_policies" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."faq_contexts" TO "anon";
GRANT ALL ON TABLE "public"."faq_contexts" TO "authenticated";
GRANT ALL ON TABLE "public"."faq_contexts" TO "service_role";



GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."follow_up_reminders" TO "anon";
GRANT ALL ON TABLE "public"."follow_up_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_up_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."game_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."game_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."game_leaderboard" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."game_scores" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."game_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."game_scores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."game_scores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."game_scores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."game_scores_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gbp_change_alerts" TO "anon";
GRANT ALL ON TABLE "public"."gbp_change_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."gbp_change_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."gbp_location_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."gbp_location_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."gbp_location_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."gbp_protection_settings" TO "anon";
GRANT ALL ON TABLE "public"."gbp_protection_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."gbp_protection_settings" TO "service_role";



GRANT ALL ON TABLE "public"."gg_checks" TO "anon";
GRANT ALL ON TABLE "public"."gg_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."gg_checks" TO "service_role";



GRANT ALL ON TABLE "public"."gg_configs" TO "anon";
GRANT ALL ON TABLE "public"."gg_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."gg_configs" TO "service_role";



GRANT ALL ON TABLE "public"."gg_daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."gg_daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."gg_daily_summary" TO "service_role";



GRANT ALL ON TABLE "public"."gg_tracked_keywords" TO "anon";
GRANT ALL ON TABLE "public"."gg_tracked_keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."gg_tracked_keywords" TO "service_role";



GRANT ALL ON TABLE "public"."google_api_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."google_api_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."google_api_rate_limits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."google_api_rate_limits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."google_api_rate_limits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."google_api_rate_limits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_locations" TO "anon";
GRANT ALL ON TABLE "public"."google_business_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_locations" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_media_uploads" TO "anon";
GRANT ALL ON TABLE "public"."google_business_media_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_media_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_profiles" TO "anon";
GRANT ALL ON TABLE "public"."google_business_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_scheduled_post_results" TO "anon";
GRANT ALL ON TABLE "public"."google_business_scheduled_post_results" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_scheduled_post_results" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_scheduled_posts" TO "anon";
GRANT ALL ON TABLE "public"."google_business_scheduled_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_scheduled_posts" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_events" TO "anon";
GRANT ALL ON TABLE "public"."invitation_events" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_events" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_analysis_runs" TO "anon";
GRANT ALL ON TABLE "public"."keyword_analysis_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_analysis_runs" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_groups" TO "anon";
GRANT ALL ON TABLE "public"."keyword_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_groups" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_prompt_page_usage" TO "anon";
GRANT ALL ON TABLE "public"."keyword_prompt_page_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_prompt_page_usage" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_questions" TO "anon";
GRANT ALL ON TABLE "public"."keyword_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_questions" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_review_matches_v2" TO "anon";
GRANT ALL ON TABLE "public"."keyword_review_matches_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_review_matches_v2" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_rotation_log" TO "anon";
GRANT ALL ON TABLE "public"."keyword_rotation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_rotation_log" TO "service_role";



GRANT ALL ON TABLE "public"."keywords" TO "anon";
GRANT ALL ON TABLE "public"."keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."keywords" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_pages" TO "anon";
GRANT ALL ON TABLE "public"."prompt_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_pages" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_rotation_status" TO "anon";
GRANT ALL ON TABLE "public"."keyword_rotation_status" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_rotation_status" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_set_locations" TO "anon";
GRANT ALL ON TABLE "public"."keyword_set_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_set_locations" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_set_terms" TO "anon";
GRANT ALL ON TABLE "public"."keyword_set_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_set_terms" TO "service_role";



GRANT ALL ON TABLE "public"."keyword_sets" TO "anon";
GRANT ALL ON TABLE "public"."keyword_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."keyword_sets" TO "service_role";



GRANT ALL ON TABLE "public"."kickstarters" TO "anon";
GRANT ALL ON TABLE "public"."kickstarters" TO "authenticated";
GRANT ALL ON TABLE "public"."kickstarters" TO "service_role";



GRANT ALL ON TABLE "public"."llm_visibility_checks" TO "anon";
GRANT ALL ON TABLE "public"."llm_visibility_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_visibility_checks" TO "service_role";



GRANT ALL ON TABLE "public"."llm_visibility_schedules" TO "anon";
GRANT ALL ON TABLE "public"."llm_visibility_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_visibility_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."llm_visibility_summary" TO "anon";
GRANT ALL ON TABLE "public"."llm_visibility_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_visibility_summary" TO "service_role";



GRANT ALL ON TABLE "public"."media_assets" TO "anon";
GRANT ALL ON TABLE "public"."media_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."media_assets" TO "service_role";



GRANT ALL ON TABLE "public"."mentions" TO "anon";
GRANT ALL ON TABLE "public"."mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentions" TO "service_role";



GRANT ALL ON TABLE "public"."metadata_templates" TO "anon";
GRANT ALL ON TABLE "public"."metadata_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."metadata_templates" TO "service_role";



GRANT ALL ON TABLE "public"."navigation" TO "anon";
GRANT ALL ON TABLE "public"."navigation" TO "authenticated";
GRANT ALL ON TABLE "public"."navigation" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_tasks" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."optimizer_email_sends" TO "anon";
GRANT ALL ON TABLE "public"."optimizer_email_sends" TO "authenticated";
GRANT ALL ON TABLE "public"."optimizer_email_sends" TO "service_role";



GRANT ALL ON TABLE "public"."optimizer_leads" TO "anon";
GRANT ALL ON TABLE "public"."optimizer_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."optimizer_leads" TO "service_role";



GRANT ALL ON TABLE "public"."optimizer_sessions" TO "anon";
GRANT ALL ON TABLE "public"."optimizer_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."optimizer_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."platform_metrics" TO "anon";
GRANT ALL ON TABLE "public"."platform_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_reactions" TO "anon";
GRANT ALL ON TABLE "public"."post_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."public_leaderboard" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."public_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."public_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."rank_checks" TO "anon";
GRANT ALL ON TABLE "public"."rank_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_checks" TO "service_role";



GRANT ALL ON TABLE "public"."rank_discovery_usage" TO "anon";
GRANT ALL ON TABLE "public"."rank_discovery_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_discovery_usage" TO "service_role";



GRANT ALL ON TABLE "public"."rank_group_keywords" TO "anon";
GRANT ALL ON TABLE "public"."rank_group_keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_group_keywords" TO "service_role";



GRANT ALL ON TABLE "public"."rank_keyword_groups" TO "anon";
GRANT ALL ON TABLE "public"."rank_keyword_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_keyword_groups" TO "service_role";



GRANT ALL ON TABLE "public"."rank_locations" TO "anon";
GRANT ALL ON TABLE "public"."rank_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rank_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rank_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rank_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_counters" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_counters" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reactivation_metrics" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reactivation_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."reactivation_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."review_drafts" TO "anon";
GRANT ALL ON TABLE "public"."review_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."review_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."review_keyword_matches" TO "anon";
GRANT ALL ON TABLE "public"."review_keyword_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."review_keyword_matches" TO "service_role";



GRANT ALL ON TABLE "public"."review_reminder_logs" TO "anon";
GRANT ALL ON TABLE "public"."review_reminder_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reminder_logs" TO "service_role";



GRANT ALL ON TABLE "public"."review_reminder_settings" TO "anon";
GRANT ALL ON TABLE "public"."review_reminder_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reminder_settings" TO "service_role";



GRANT ALL ON TABLE "public"."review_share_events" TO "anon";
GRANT ALL ON TABLE "public"."review_share_events" TO "authenticated";
GRANT ALL ON TABLE "public"."review_share_events" TO "service_role";



GRANT ALL ON TABLE "public"."review_share_images" TO "anon";
GRANT ALL ON TABLE "public"."review_share_images" TO "authenticated";
GRANT ALL ON TABLE "public"."review_share_images" TO "service_role";



GRANT ALL ON TABLE "public"."review_submissions" TO "anon";
GRANT ALL ON TABLE "public"."review_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."review_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."rss_feed_items" TO "anon";
GRANT ALL ON TABLE "public"."rss_feed_items" TO "authenticated";
GRANT ALL ON TABLE "public"."rss_feed_items" TO "service_role";



GRANT ALL ON TABLE "public"."rss_feed_sources" TO "anon";
GRANT ALL ON TABLE "public"."rss_feed_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."rss_feed_sources" TO "service_role";



GRANT ALL ON TABLE "public"."selected_gbp_locations" TO "anon";
GRANT ALL ON TABLE "public"."selected_gbp_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."selected_gbp_locations" TO "service_role";



GRANT ALL ON TABLE "public"."sentiment_analysis_runs" TO "anon";
GRANT ALL ON TABLE "public"."sentiment_analysis_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."sentiment_analysis_runs" TO "service_role";



GRANT ALL ON TABLE "public"."sidebar_favorites" TO "anon";
GRANT ALL ON TABLE "public"."sidebar_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."sidebar_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."social_platform_connections" TO "anon";
GRANT ALL ON TABLE "public"."social_platform_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."social_platform_connections" TO "service_role";



GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "anon";
GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "service_role";



GRANT ALL ON TABLE "public"."widget_reviews" TO "anon";
GRANT ALL ON TABLE "public"."widget_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."widgets" TO "anon";
GRANT ALL ON TABLE "public"."widgets" TO "authenticated";
GRANT ALL ON TABLE "public"."widgets" TO "service_role";



GRANT ALL ON TABLE "public"."wm_boards" TO "anon";
GRANT ALL ON TABLE "public"."wm_boards" TO "authenticated";
GRANT ALL ON TABLE "public"."wm_boards" TO "service_role";



GRANT ALL ON TABLE "public"."wm_task_actions" TO "anon";
GRANT ALL ON TABLE "public"."wm_task_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."wm_task_actions" TO "service_role";



GRANT ALL ON TABLE "public"."wm_tasks" TO "anon";
GRANT ALL ON TABLE "public"."wm_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."wm_tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
