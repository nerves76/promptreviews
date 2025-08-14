

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."prompt_page_status" AS ENUM (
    'in_queue',
    'in_progress',
    'complete',
    'draft'
);


ALTER TYPE "public"."prompt_page_status" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_user_account"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create account record if it doesn't exist
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count
    ) VALUES (
        user_id,
        'grower',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create account_user record if it doesn't exist
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
    )
    ON CONFLICT (account_id, user_id) DO NOTHING;
    
END;
$$;


ALTER FUNCTION "public"."setup_user_account"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."setup_user_account"("user_id" "uuid") IS 'Sets up account and account_user records for a user after successful authentication';



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



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."account_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."account_users" IS 'Links users to accounts with roles';



COMMENT ON COLUMN "public"."account_users"."account_id" IS 'The account this user belongs to';



COMMENT ON COLUMN "public"."account_users"."user_id" IS 'The user ID from auth.users';



COMMENT ON COLUMN "public"."account_users"."role" IS 'The role of this user in the account (owner, member, etc.)';



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'grower'::"text" NOT NULL,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "is_free_account" boolean DEFAULT false,
    "custom_prompt_page_count" integer DEFAULT 0,
    "contact_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_seen_welcome" boolean DEFAULT false,
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
    "user_id" "uuid"
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."accounts" IS 'Stores user account information including plan and trial status';



COMMENT ON COLUMN "public"."accounts"."plan" IS 'The user''s subscription plan';



COMMENT ON COLUMN "public"."accounts"."trial_start" IS 'When the user''s trial started';



COMMENT ON COLUMN "public"."accounts"."trial_end" IS 'When the user''s trial ends';



COMMENT ON COLUMN "public"."accounts"."is_free_account" IS 'Whether the account is marked as free';



COMMENT ON COLUMN "public"."accounts"."custom_prompt_page_count" IS 'Number of custom prompt pages created';



COMMENT ON COLUMN "public"."accounts"."contact_count" IS 'Number of contacts created';



COMMENT ON COLUMN "public"."accounts"."created_at" IS 'Account creation timestamp';



COMMENT ON COLUMN "public"."accounts"."updated_at" IS 'Account last update timestamp';



COMMENT ON COLUMN "public"."accounts"."has_seen_welcome" IS 'Tracks whether the user has seen the welcome popup on first login';



COMMENT ON COLUMN "public"."accounts"."business_name" IS 'Business name for the account';



COMMENT ON COLUMN "public"."accounts"."first_name" IS 'First name of the account owner';



COMMENT ON COLUMN "public"."accounts"."last_name" IS 'Last name of the account owner';



COMMENT ON COLUMN "public"."accounts"."stripe_customer_id" IS 'Stripe customer ID';



COMMENT ON COLUMN "public"."accounts"."stripe_subscription_id" IS 'Stripe subscription ID';



COMMENT ON COLUMN "public"."accounts"."subscription_status" IS 'Stripe subscription status';



COMMENT ON COLUMN "public"."accounts"."has_had_paid_plan" IS 'Whether the account has ever had a paid plan';



COMMENT ON COLUMN "public"."accounts"."email" IS 'Primary email for the account';



COMMENT ON COLUMN "public"."accounts"."plan_lookup_key" IS 'Stripe plan lookup key';



COMMENT ON COLUMN "public"."accounts"."review_notifications_enabled" IS 'Whether review notifications are enabled';



COMMENT ON COLUMN "public"."accounts"."user_id" IS 'User ID (auth.users.id) for the account owner';



CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "cost_usd" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage" OWNER TO "postgres";


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
    CONSTRAINT "valid_event_type" CHECK (("event_type" = ANY (ARRAY['view'::"text", 'copy_submit'::"text", 'ai_generate'::"text", 'login'::"text", 'prompt_page_created'::"text", 'contacts_uploaded'::"text", 'review_submitted'::"text", 'save_for_later'::"text", 'unsave_for_later'::"text", 'time_spent'::"text", 'feature_used'::"text"])))
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'Tracks various events related to prompt pages (views, AI generations, etc.)';



COMMENT ON COLUMN "public"."analytics_events"."event_type" IS 'Type of event (page_view, ai_generate, etc.)';



COMMENT ON COLUMN "public"."analytics_events"."metadata" IS 'Additional event data stored as JSON';



COMMENT ON COLUMN "public"."analytics_events"."platform" IS 'Platform where the event occurred';



COMMENT ON COLUMN "public"."analytics_events"."session_id" IS 'Unique session identifier for tracking user sessions';



COMMENT ON COLUMN "public"."analytics_events"."user_agent" IS 'User agent string from the browser';



COMMENT ON COLUMN "public"."analytics_events"."ip_address" IS 'IP address of the user';



COMMENT ON CONSTRAINT "valid_event_type" ON "public"."analytics_events" IS 'Validates that event_type is one of the predefined types';



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
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
    "default_offer_title" "text" DEFAULT 'Review Rewards'::"text",
    "default_offer_body" "text",
    "account_id" "uuid" NOT NULL,
    CONSTRAINT "check_background_type" CHECK (("background_type" = ANY (ARRAY['solid'::"text", 'gradient'::"text"])))
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


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
    "role" "text"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Table for storing contact information for review requests';



COMMENT ON COLUMN "public"."contacts"."account_id" IS 'The ID of the account that owns this contact';



COMMENT ON COLUMN "public"."contacts"."email" IS 'The email address of the contact';



COMMENT ON COLUMN "public"."contacts"."phone" IS 'The phone number of the contact';



COMMENT ON COLUMN "public"."contacts"."category" IS 'Optional category for organizing contacts';



COMMENT ON COLUMN "public"."contacts"."notes" IS 'Optional notes about the contact';



COMMENT ON COLUMN "public"."contacts"."status" IS 'Workflow status for the contact (draft, in_queue, sent, completed)';



COMMENT ON COLUMN "public"."contacts"."role" IS 'Role/Position/Occupation of the contact';



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


COMMENT ON TABLE "public"."email_templates" IS 'Stores email templates for various system emails';



COMMENT ON COLUMN "public"."email_templates"."name" IS 'Unique identifier for the template (e.g., welcome, trial_reminder)';



COMMENT ON COLUMN "public"."email_templates"."subject" IS 'Email subject line';



COMMENT ON COLUMN "public"."email_templates"."html_content" IS 'HTML version of the email content with template variables';



COMMENT ON COLUMN "public"."email_templates"."text_content" IS 'Plain text version of the email content with template variables';



COMMENT ON COLUMN "public"."email_templates"."is_active" IS 'Whether this template is currently active';



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
    "offer_title" "text",
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
    "status" "public"."prompt_page_status" DEFAULT 'in_queue'::"public"."prompt_page_status",
    "offer_learn_more_url" "text",
    "role" "text"
);


ALTER TABLE "public"."prompt_pages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."prompt_pages"."first_name" IS 'First name of the reviewer';



COMMENT ON COLUMN "public"."prompt_pages"."last_name" IS 'Last name of the reviewer';



COMMENT ON COLUMN "public"."prompt_pages"."services_offered" IS 'Array of services offered';



COMMENT ON COLUMN "public"."prompt_pages"."outcomes" IS 'Outcomes or results of the project';



COMMENT ON COLUMN "public"."prompt_pages"."project_type" IS 'Type of project or service provided';



COMMENT ON COLUMN "public"."prompt_pages"."offer_enabled" IS 'Whether the featured offer is enabled for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_title" IS 'Title of the featured offer for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_body" IS 'Body/description of the featured offer for this prompt page';



COMMENT ON COLUMN "public"."prompt_pages"."offer_url" IS 'URL for the learn more page about the offer';



COMMENT ON COLUMN "public"."prompt_pages"."role" IS 'Role/Position of the reviewer';



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


COMMENT ON COLUMN "public"."quotes"."button_text" IS 'Optional button text to display with the quote';



COMMENT ON COLUMN "public"."quotes"."button_url" IS 'Optional URL for the button link';



CREATE TABLE IF NOT EXISTS "public"."review_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_page_id" "uuid" NOT NULL,
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
    CONSTRAINT "review_submissions_status_check" CHECK (("status" = ANY (ARRAY['clicked'::"text", 'submitted'::"text"]))),
    CONSTRAINT "reviewer_name_required" CHECK ((("reviewer_name" IS NOT NULL) AND ("reviewer_name" <> ''::"text")))
);


ALTER TABLE "public"."review_submissions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."review_submissions"."reviewer_name" IS 'Name of the reviewer (required)';



COMMENT ON COLUMN "public"."review_submissions"."reviewer_role" IS 'Role/Position/Occupation of the reviewer (optional)';



COMMENT ON COLUMN "public"."review_submissions"."review_content" IS 'The actual review content submitted';



COMMENT ON COLUMN "public"."review_submissions"."review_group_id" IS 'Groups multiple reviews from the same user';



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
    "star_rating" integer DEFAULT 5,
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "photo_url" "text",
    CONSTRAINT "widget_reviews_star_rating_check" CHECK ((("star_rating" >= 1) AND ("star_rating" <= 5)))
);


ALTER TABLE "public"."widget_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."widgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "widgets_type_check" CHECK (("type" = ANY (ARRAY['single'::"text", 'multi'::"text", 'photo'::"text"])))
);


ALTER TABLE "public"."widgets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trial_reminder_logs"
    ADD CONSTRAINT "trial_reminder_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "unique_user_account" UNIQUE ("user_id", "account_id");



ALTER TABLE ONLY "public"."widget_reviews"
    ADD CONSTRAINT "widget_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widgets"
    ADD CONSTRAINT "widgets_pkey" PRIMARY KEY ("id");



CREATE INDEX "contacts_account_id_idx" ON "public"."contacts" USING "btree" ("account_id");



CREATE INDEX "contacts_email_idx" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "contacts_phone_idx" ON "public"."contacts" USING "btree" ("phone");



CREATE INDEX "idx_account_users_account_id" ON "public"."account_users" USING "btree" ("account_id");



CREATE INDEX "idx_account_users_role" ON "public"."account_users" USING "btree" ("role");



CREATE INDEX "idx_account_users_user_id" ON "public"."account_users" USING "btree" ("user_id");



CREATE INDEX "idx_accounts_created_at" ON "public"."accounts" USING "btree" ("created_at");



CREATE INDEX "idx_accounts_plan" ON "public"."accounts" USING "btree" ("plan");



CREATE INDEX "idx_accounts_plan_trial_end" ON "public"."accounts" USING "btree" ("plan", "trial_end");



CREATE INDEX "idx_accounts_trial_end" ON "public"."accounts" USING "btree" ("trial_end");



CREATE INDEX "idx_admins_account_id" ON "public"."admins" USING "btree" ("account_id");



CREATE INDEX "idx_ai_usage_created_at" ON "public"."ai_usage" USING "btree" ("created_at");



CREATE INDEX "idx_ai_usage_user_id" ON "public"."ai_usage" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_metadata" ON "public"."analytics_events" USING "gin" ("metadata");



CREATE INDEX "idx_analytics_events_platform" ON "public"."analytics_events" USING "btree" ("platform");



CREATE INDEX "idx_analytics_events_prompt_page_id" ON "public"."analytics_events" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_announcements_active" ON "public"."announcements" USING "btree" ("is_active");



CREATE INDEX "idx_businesses_account_id" ON "public"."businesses" USING "btree" ("account_id");



CREATE INDEX "idx_businesses_created_at" ON "public"."businesses" USING "btree" ("created_at");



CREATE INDEX "idx_contacts_account_id" ON "public"."contacts" USING "btree" ("account_id");



CREATE INDEX "idx_contacts_category" ON "public"."contacts" USING "btree" ("category");



CREATE INDEX "idx_contacts_created_at" ON "public"."contacts" USING "btree" ("created_at");



CREATE INDEX "idx_contacts_email" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "idx_contacts_phone" ON "public"."contacts" USING "btree" ("phone");



CREATE INDEX "idx_feedback_category" ON "public"."feedback" USING "btree" ("category");



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("created_at");



CREATE INDEX "idx_feedback_is_read" ON "public"."feedback" USING "btree" ("is_read");



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_prompt_pages_account_id" ON "public"."prompt_pages" USING "btree" ("account_id");



CREATE INDEX "idx_prompt_pages_account_status" ON "public"."prompt_pages" USING "btree" ("account_id", "status");



CREATE INDEX "idx_prompt_pages_created_at" ON "public"."prompt_pages" USING "btree" ("created_at");



CREATE INDEX "idx_prompt_pages_slug" ON "public"."prompt_pages" USING "btree" ("slug");



CREATE INDEX "idx_prompt_pages_status" ON "public"."prompt_pages" USING "btree" ("status");



CREATE INDEX "idx_quotes_active" ON "public"."quotes" USING "btree" ("is_active");



CREATE INDEX "idx_review_submissions_created_at" ON "public"."review_submissions" USING "btree" ("created_at");



CREATE INDEX "idx_review_submissions_group_id" ON "public"."review_submissions" USING "btree" ("review_group_id");



CREATE INDEX "idx_review_submissions_page_platform" ON "public"."review_submissions" USING "btree" ("prompt_page_id", "platform");



CREATE INDEX "idx_review_submissions_platform" ON "public"."review_submissions" USING "btree" ("platform");



CREATE INDEX "idx_review_submissions_prompt_page_id" ON "public"."review_submissions" USING "btree" ("prompt_page_id");



CREATE INDEX "idx_review_submissions_submitted_at" ON "public"."review_submissions" USING "btree" ("submitted_at");



CREATE INDEX "idx_trial_reminder_logs_account_id" ON "public"."trial_reminder_logs" USING "btree" ("account_id");



CREATE INDEX "idx_trial_reminder_logs_reminder_type" ON "public"."trial_reminder_logs" USING "btree" ("reminder_type");



CREATE INDEX "idx_trial_reminder_logs_sent_at" ON "public"."trial_reminder_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_widget_reviews_created_at" ON "public"."widget_reviews" USING "btree" ("created_at");



CREATE INDEX "idx_widget_reviews_review_id" ON "public"."widget_reviews" USING "btree" ("review_id");



CREATE INDEX "idx_widget_reviews_widget_id" ON "public"."widget_reviews" USING "btree" ("widget_id");



CREATE INDEX "idx_widgets_account_id" ON "public"."widgets" USING "btree" ("account_id");



CREATE INDEX "idx_widgets_is_active" ON "public"."widgets" USING "btree" ("is_active");



CREATE INDEX "idx_widgets_type" ON "public"."widgets" USING "btree" ("type");



CREATE INDEX "prompt_pages_account_id_idx" ON "public"."prompt_pages" USING "btree" ("account_id");



CREATE INDEX "prompt_pages_email_idx" ON "public"."prompt_pages" USING "btree" ("email");



CREATE INDEX "prompt_pages_phone_idx" ON "public"."prompt_pages" USING "btree" ("phone");



CREATE OR REPLACE TRIGGER "group_reviews_trigger" BEFORE INSERT ON "public"."review_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."group_reviews"();



CREATE OR REPLACE TRIGGER "handle_accounts_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_businesses_updated_at" BEFORE UPDATE ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_email_templates_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "track_feature_usage_trigger" AFTER INSERT ON "public"."analytics_events" FOR EACH ROW WHEN (("new"."event_type" = ANY (ARRAY['ai_generate'::"text", 'contacts_uploaded'::"text", 'save_for_later'::"text", 'unsave_for_later'::"text"]))) EXECUTE FUNCTION "public"."track_feature_usage"();



CREATE OR REPLACE TRIGGER "track_time_spent_trigger" AFTER INSERT ON "public"."analytics_events" FOR EACH ROW WHEN (("new"."event_type" = 'view'::"text")) EXECUTE FUNCTION "public"."track_time_spent"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_widget_reviews_updated_at" BEFORE UPDATE ON "public"."widget_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_widgets_updated_at" BEFORE UPDATE ON "public"."widgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "fk_ai_usage_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "fk_businesses_account_id" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_pages"
    ADD CONSTRAINT "prompt_pages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."review_submissions"
    ADD CONSTRAINT "review_submissions_prompt_page_id_fkey" FOREIGN KEY ("prompt_page_id") REFERENCES "public"."prompt_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trial_reminder_logs"
    ADD CONSTRAINT "trial_reminder_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_reviews"
    ADD CONSTRAINT "widget_reviews_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widgets"
    ADD CONSTRAINT "widgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete email templates" ON "public"."email_templates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can delete feedback" ON "public"."feedback" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can insert email templates" ON "public"."email_templates" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can update email templates" ON "public"."email_templates" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can update feedback" ON "public"."feedback" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all admins" ON "public"."admins" FOR SELECT USING (true);



CREATE POLICY "Admins can view all feedback" ON "public"."feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view email templates" ON "public"."email_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."account_id" = "auth"."uid"()))));



CREATE POLICY "Allow admin management of announcements" ON "public"."announcements" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."account_id" = "auth"."uid"()) AND ("admins"."id" = "announcements"."created_by")))));



CREATE POLICY "Allow admin management of quotes" ON "public"."quotes" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."account_id" = "auth"."uid"()) AND ("admins"."id" = "quotes"."created_by")))));



CREATE POLICY "Allow admins to manage announcements" ON "public"."announcements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."account_id" = "auth"."uid"()) AND ("admins"."id" = "announcements"."created_by")))));



CREATE POLICY "Allow admins to manage quotes" ON "public"."quotes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."account_id" = "auth"."uid"()) AND ("admins"."id" = "quotes"."created_by")))));



CREATE POLICY "Allow all users to read active announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow all users to read active quotes" ON "public"."quotes" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to delete widget reviews" ON "public"."widget_reviews" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert widget reviews" ON "public"."widget_reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update widget reviews" ON "public"."widget_reviews" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view widget reviews" ON "public"."widget_reviews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow delete for authenticated users" ON "public"."widget_reviews" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" = "auth"."uid"())))));



CREATE POLICY "Allow delete for authenticated users" ON "public"."widgets" FOR DELETE TO "authenticated" USING (("account_id" = "auth"."uid"()));



CREATE POLICY "Allow insert for authenticated users" ON "public"."widget_reviews" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" = "auth"."uid"())))));



CREATE POLICY "Allow insert for authenticated users" ON "public"."widgets" FOR INSERT TO "authenticated" WITH CHECK (("account_id" = "auth"."uid"()));



CREATE POLICY "Allow public read access" ON "public"."widget_reviews" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access" ON "public"."widgets" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access to active announcements" ON "public"."announcements" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to active quotes" ON "public"."quotes" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to widget reviews" ON "public"."widget_reviews" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."review_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."widget_reviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" = "auth"."uid"())))));



CREATE POLICY "Allow select for authenticated users" ON "public"."widgets" FOR SELECT TO "authenticated" USING (("account_id" = "auth"."uid"()));



CREATE POLICY "Allow update for authenticated users" ON "public"."widget_reviews" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."widgets" "w"
  WHERE (("w"."id" = "widget_reviews"."widget_id") AND ("w"."account_id" = "auth"."uid"())))));



CREATE POLICY "Allow update for authenticated users" ON "public"."widgets" FOR UPDATE TO "authenticated" USING (("account_id" = "auth"."uid"())) WITH CHECK (("account_id" = "auth"."uid"()));



CREATE POLICY "Only admins can delete admins" ON "public"."admins" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."account_id" = "auth"."uid"()))));



CREATE POLICY "Only admins can insert admins" ON "public"."admins" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."account_id" = "auth"."uid"()))));



CREATE POLICY "Only admins can update admins" ON "public"."admins" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."account_id" = "auth"."uid"()))));



CREATE POLICY "Service role can access all account_users" ON "public"."account_users" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can access all accounts" ON "public"."accounts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can create accounts" ON "public"."accounts" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage trial reminder logs" ON "public"."trial_reminder_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own business profile" ON "public"."businesses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "businesses"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own account_users" ON "public"."account_users" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own contacts" ON "public"."contacts" FOR DELETE USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can delete their own prompt pages" ON "public"."prompt_pages" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can delete their own widgets" ON "public"."widgets" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own feedback" ON "public"."feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own AI usage" ON "public"."ai_usage" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own account" ON "public"."accounts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own account_users" ON "public"."account_users" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own contacts" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can insert their own events" ON "public"."analytics_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert their own prompt pages" ON "public"."prompt_pages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can insert their own widgets" ON "public"."widgets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own account" ON "public"."accounts" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own account_user records" ON "public"."account_users" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own account_users" ON "public"."account_users" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own business profile" ON "public"."businesses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "businesses"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own contacts" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can update their own prompt pages" ON "public"."prompt_pages" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "account_id")) WITH CHECK (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can update their own widgets" ON "public"."widgets" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own feedback" ON "public"."feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own AI usage" ON "public"."ai_usage" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own account" ON "public"."accounts" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own account_user records" ON "public"."account_users" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own account_users" ON "public"."account_users" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own business profile" ON "public"."businesses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "businesses"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own businesses" ON "public"."businesses" FOR SELECT TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own contacts" ON "public"."contacts" FOR SELECT USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can view their own events" ON "public"."analytics_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view their own prompt pages" ON "public"."prompt_pages" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "account_id"));



CREATE POLICY "Users can view their own widgets" ON "public"."widgets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "widgets"."account_id") AND ("au"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trial_reminder_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."widget_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."widgets" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("business_name" "text", "existing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_schema"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."group_reviews"() TO "anon";
GRANT ALL ON FUNCTION "public"."group_reviews"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."group_reviews"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_user_account"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_user_account"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_user_account"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_feature_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_time_spent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."account_users" TO "anon";
GRANT ALL ON TABLE "public"."account_users" TO "authenticated";
GRANT ALL ON TABLE "public"."account_users" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_pages" TO "anon";
GRANT ALL ON TABLE "public"."prompt_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_pages" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."review_submissions" TO "anon";
GRANT ALL ON TABLE "public"."review_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."review_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "anon";
GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."trial_reminder_logs" TO "service_role";



GRANT ALL ON TABLE "public"."widget_reviews" TO "anon";
GRANT ALL ON TABLE "public"."widget_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."widgets" TO "anon";
GRANT ALL ON TABLE "public"."widgets" TO "authenticated";
GRANT ALL ON TABLE "public"."widgets" TO "service_role";



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
