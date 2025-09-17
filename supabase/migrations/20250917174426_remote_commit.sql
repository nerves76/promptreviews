drop policy "accounts_select_policy" on "public"."accounts";

drop policy "simple_accounts_select" on "public"."accounts";

alter table "public"."prompt_pages" drop constraint "prompt_pages_account_id_fkey";

drop function if exists "public"."can_add_user_to_account"(account_id uuid);

drop view if exists "public"."account_users_readable";

alter table "public"."businesses" add column "kickstarters_accent_color" text;

alter table "public"."google_business_profiles" add column "selected_account_id" text;

alter table "public"."google_business_profiles" add column "selected_account_name" text;

alter table "public"."prompt_pages" add column "settings" jsonb default '{}'::jsonb;

alter table "public"."widgets" drop column "corner_radius";

alter table "public"."widgets" drop column "description";

alter table "public"."widgets" drop column "display_count";

alter table "public"."widgets" drop column "font_family";

alter table "public"."widgets" drop column "link_text";

alter table "public"."widgets" drop column "link_url";

alter table "public"."widgets" drop column "show_dates";

alter table "public"."widgets" drop column "show_names";

alter table "public"."widgets" drop column "show_photos";

alter table "public"."widgets" drop column "show_ratings";

alter table "public"."widgets" drop column "theme_color";

alter table "public"."widgets" drop column "title";

alter table "public"."widgets" add column "config" jsonb default '{}'::jsonb;

alter table "public"."widgets" add column "is_active" boolean default true;

alter table "public"."widgets" add column "name" text not null;

alter table "public"."widgets" alter column "account_id" set not null;

alter table "public"."widgets" alter column "type" drop default;

alter table "public"."widgets" alter column "type" set not null;

CREATE INDEX idx_widgets_is_active ON public.widgets USING btree (is_active);

CREATE INDEX idx_widgets_type ON public.widgets USING btree (type);

alter table "public"."widgets" add constraint "widgets_type_check" CHECK ((type = ANY (ARRAY['single'::text, 'multi'::text, 'photo'::text]))) not valid;

alter table "public"."widgets" validate constraint "widgets_type_check";

alter table "public"."prompt_pages" add constraint "prompt_pages_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE not valid;

alter table "public"."prompt_pages" validate constraint "prompt_pages_account_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_add_user_to_account(account_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_additional_account(p_user_id uuid, p_account_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_with_proper_pattern()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

create or replace view "public"."account_users_readable" as  SELECT au.account_id,
    au.user_id,
    au.role,
    au.created_at AS joined_at,
    ( SELECT users.email
           FROM auth.users
          WHERE (users.id = au.user_id)) AS user_email,
    b.name AS business_name,
    b.business_email,
    b.phone AS business_phone
   FROM (account_users au
     LEFT JOIN businesses b ON ((b.account_id = au.account_id)));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create policy "Service role can insert memberships"
on "public"."account_users"
as permissive
for insert
to service_role
with check (true);


create policy "Members can update account"
on "public"."accounts"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = accounts.id) AND (au.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = accounts.id) AND (au.user_id = auth.uid())))));


create policy "Members can view account"
on "public"."accounts"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = accounts.id) AND (au.user_id = auth.uid())))));


create policy "Service role can create accounts"
on "public"."accounts"
as permissive
for insert
to service_role
with check (true);


create policy "Users can delete their own widgets"
on "public"."widgets"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = widgets.account_id) AND (au.user_id = auth.uid())))));


create policy "Users can insert their own widgets"
on "public"."widgets"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = widgets.account_id) AND (au.user_id = auth.uid())))));


create policy "Users can update their own widgets"
on "public"."widgets"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = widgets.account_id) AND (au.user_id = auth.uid())))));


create policy "Users can view their own widgets"
on "public"."widgets"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = widgets.account_id) AND (au.user_id = auth.uid())))));


create policy "accounts_select_policy"
on "public"."accounts"
as permissive
for select
to public
using (((id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM account_users au
  WHERE ((au.account_id = accounts.id) AND (au.user_id = auth.uid()))))));


create policy "simple_accounts_select"
on "public"."accounts"
as permissive
for select
to public
using ((id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE (account_users.user_id = auth.uid()))));


CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


