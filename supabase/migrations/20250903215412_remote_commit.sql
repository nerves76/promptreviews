alter table "public"."contacts" drop constraint "contacts_review_submission_id_fkey";

alter table "public"."contacts" drop constraint "contacts_review_verification_status_check";

alter table "public"."contacts" drop constraint "contacts_source_check";

alter table "public"."analytics_events" drop constraint "valid_event_type";

drop view if exists "public"."account_users_readable";

drop view if exists "public"."reactivation_metrics";

drop index if exists "public"."idx_contacts_facebook_review_verified_at";

drop index if exists "public"."idx_contacts_google_review_verified_at";

drop index if exists "public"."idx_contacts_review_submission_id";

drop index if exists "public"."idx_contacts_review_verification_status";

drop index if exists "public"."idx_contacts_source";

drop index if exists "public"."idx_contacts_yelp_review_verified_at";

alter table "public"."accounts" alter column "max_contacts" set default 0;

alter table "public"."accounts" alter column "max_prompt_pages" set default 3;

alter table "public"."businesses" alter column "emoji_feedback_page_header" set default ''::text;

alter table "public"."businesses" alter column "emoji_feedback_popup_header" set default ''::text;

alter table "public"."contacts" drop column "facebook_review_verified_at";

alter table "public"."contacts" drop column "google_review_verified_at";

alter table "public"."contacts" drop column "last_review_check_at";

alter table "public"."contacts" drop column "manual_verification_notes";

alter table "public"."contacts" drop column "potential_review_matches";

alter table "public"."contacts" drop column "review_submission_id";

alter table "public"."contacts" drop column "review_verification_status";

alter table "public"."contacts" drop column "source";

alter table "public"."contacts" drop column "tripadvisor_review_verified_at";

alter table "public"."contacts" drop column "yelp_review_verified_at";

alter table "public"."prompt_pages" alter column "show_friendly_note" set default true;

alter table "public"."analytics_events" add constraint "valid_event_type" CHECK ((event_type = ANY (ARRAY['view'::text, 'copy_submit'::text, 'ai_generate'::text, 'login'::text, 'prompt_page_created'::text, 'contacts_uploaded'::text, 'review_submitted'::text, 'save_for_later'::text, 'unsave_for_later'::text, 'time_spent'::text, 'feature_used'::text, 'emoji_sentiment'::text, 'emoji_sentiment_choice'::text, 'constructive_feedback'::text]))) not valid;

alter table "public"."analytics_events" validate constraint "valid_event_type";

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


create or replace view "public"."reactivation_metrics" as  SELECT count(DISTINCT accounts.id) AS total_reactivations,
    (avg((EXTRACT(epoch FROM (accounts.reactivated_at - accounts.deleted_at)) / (86400)::numeric)))::integer AS avg_days_to_return,
    max(accounts.reactivation_count) AS max_reactivations_per_user,
    count(DISTINCT accounts.id) FILTER (WHERE (accounts.reactivated_at > (now() - '30 days'::interval))) AS reactivations_last_30_days,
    count(DISTINCT accounts.id) FILTER (WHERE (accounts.reactivated_at > (now() - '7 days'::interval))) AS reactivations_last_7_days
   FROM accounts
  WHERE (accounts.reactivated_at IS NOT NULL);



