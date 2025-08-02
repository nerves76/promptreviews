drop policy "Allow anonymous users to insert analytics events" on "public"."analytics_events";

drop policy "Allow anonymous users to insert reviews" on "public"."review_submissions";

alter table "public"."business_locations" drop constraint "unique_location_name";

drop index if exists "public"."idx_prompt_pages_emp_location";

drop index if exists "public"."idx_prompt_pages_emp_position";

drop index if exists "public"."idx_prompt_pages_eve_date";

drop index if exists "public"."idx_prompt_pages_eve_location";

drop index if exists "public"."idx_prompt_pages_eve_type";

drop index if exists "public"."unique_location_name";

alter table "public"."prompt_pages" alter column "type" drop default;

alter type "public"."prompt_page_type" rename to "prompt_page_type__old_version_to_be_dropped";

create type "public"."prompt_page_type" as enum ('universal', 'photo', 'product', 'service', 'video', 'event', 'employee', 'custom', 'individual');

alter table "public"."metadata_templates" alter column page_type type "public"."prompt_page_type" using page_type::text::"public"."prompt_page_type";

alter table "public"."prompt_pages" alter column type type "public"."prompt_page_type" using type::text::"public"."prompt_page_type";

alter table "public"."prompt_pages" alter column "type" set default 'service'::prompt_page_type;

drop type "public"."prompt_page_type__old_version_to_be_dropped";

alter table "public"."business_locations" alter column "emoji_feedback_popup_header" set default 'How can we Improve?'::text;

alter table "public"."prompt_pages" drop column "emp_bio";

alter table "public"."prompt_pages" drop column "emp_first_name";

alter table "public"."prompt_pages" drop column "emp_fun_facts";

alter table "public"."prompt_pages" drop column "emp_headshot_url";

alter table "public"."prompt_pages" drop column "emp_last_name";

alter table "public"."prompt_pages" drop column "emp_location";

alter table "public"."prompt_pages" drop column "emp_position";

alter table "public"."prompt_pages" drop column "emp_pronouns";

alter table "public"."prompt_pages" drop column "emp_review_guidance";

alter table "public"."prompt_pages" drop column "emp_skills";

alter table "public"."prompt_pages" drop column "emp_years_at_business";

alter table "public"."prompt_pages" drop column "eve_capacity";

alter table "public"."prompt_pages" drop column "eve_date";

alter table "public"."prompt_pages" drop column "eve_description";

alter table "public"."prompt_pages" drop column "eve_duration";

alter table "public"."prompt_pages" drop column "eve_location";

alter table "public"."prompt_pages" drop column "eve_name";

alter table "public"."prompt_pages" drop column "eve_organizer";

alter table "public"."prompt_pages" drop column "eve_review_guidance";

alter table "public"."prompt_pages" drop column "eve_special_features";

alter table "public"."prompt_pages" drop column "eve_type";

alter table "public"."prompt_pages" alter column "emoji_feedback_popup_header" set default 'How can we Improve?'::text;

create policy "Users can create their own business profile"
on "public"."businesses"
as permissive
for insert
to public
with check ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE (account_users.user_id = auth.uid()))));


create policy "Users can update their own business profile"
on "public"."businesses"
as permissive
for update
to public
using ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE (account_users.user_id = auth.uid()))));


create policy "Users can view their own business profile"
on "public"."businesses"
as permissive
for select
to public
using ((account_id IN ( SELECT account_users.account_id
   FROM account_users
  WHERE (account_users.user_id = auth.uid()))));



