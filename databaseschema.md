database schema for promptreviews mon june 16th 2025

| table_name       | column_name                  | data_type                | character_maximum_length | is_nullable | column_default               |
| ---------------- | ---------------------------- | ------------------------ | ------------------------ | ----------- | ---------------------------- |
| account_users    | id                           | uuid                     | null                     | NO          | gen_random_uuid()            |
| account_users    | account_id                   | uuid                     | null                     | NO          | null                         |
| account_users    | user_id                      | uuid                     | null                     | NO          | null                         |
| account_users    | role                         | text                     | null                     | YES         | 'member'::text               |
| account_users    | created_at                   | timestamp with time zone | null                     | YES         | now()                        |
| accounts         | id                           | uuid                     | null                     | NO          | null                         |
| accounts         | business_name                | text                     | null                     | YES         | null                         |
| accounts         | created_at                   | timestamp with time zone | null                     | YES         | now()                        |
| accounts         | plan                         | text                     | null                     | YES         | 'NULL'::text                 |
| accounts         | trial_start                  | timestamp with time zone | null                     | YES         | null                         |
| accounts         | trial_end                    | timestamp with time zone | null                     | YES         | null                         |
| accounts         | custom_prompt_page_count     | integer                  | null                     | NO          | 0                            |
| accounts         | contact_count                | integer                  | null                     | NO          | 0                            |
| accounts         | first_name                   | text                     | null                     | YES         | null                         |
| accounts         | last_name                    | text                     | null                     | YES         | null                         |
| accounts         | stripe_customer_id           | text                     | null                     | YES         | null                         |
| accounts         | stripe_subscription_id       | text                     | null                     | YES         | null                         |
| accounts         | subscription_status          | text                     | null                     | YES         | null                         |
| accounts         | is_free_account              | boolean                  | null                     | YES         | false                        |
| accounts         | has_had_paid_plan            | boolean                  | null                     | NO          | false                        |
| accounts         | email                        | text                     | null                     | YES         | null                         |
| accounts         | plan_lookup_key              | text                     | null                     | YES         | null                         |
| accounts         | review_notifications_enabled | boolean                  | null                     | YES         | true                         |
| accounts         | user_id                      | uuid                     | null                     | YES         | null                         |
| ai_usage         | id                           | uuid                     | null                     | NO          | gen_random_uuid()            |
| ai_usage         | user_id                      | uuid                     | null                     | YES         | null                         |
| ai_usage         | prompt_tokens                | integer                  | null                     | YES         | null                         |
| ai_usage         | completion_tokens            | integer                  | null                     | YES         | null                         |
| ai_usage         | total_tokens                 | integer                  | null                     | YES         | null                         |
| ai_usage         | cost_usd                     | numeric                  | null                     | YES         | null                         |
| ai_usage         | created_at                   | timestamp with time zone | null                     | YES         | now()                        |
| analytics_events | id                           | uuid                     | null                     | NO          | gen_random_uuid()            |
| analytics_events | prompt_page_id               | uuid                     | null                     | YES         | null                         |
| analytics_events | event_type                   | text                     | null                     | YES         | null                         |
| analytics_events | platform                     | text                     | null                     | YES         | null                         |
| analytics_events | created_at                   | timestamp with time zone | null                     | YES         | timezone('utc'::text, now()) |
| analytics_events | metadata                     | jsonb                    | null                     | YES         | '{}'::jsonb                  |
| analytics_events | session_id                   | text                     | null                     | YES         | null                         |
| analytics_events | user_agent                   | text                     | null                     | YES         | null                         |
| analytics_events | ip_address                   | text                     | null                     | YES         | null                         |
| analytics_events | emoji_sentiment              | text                     | null                     | YES         | null                         |
| businesses       | id                           | uuid                     | null                     | NO          | gen_random_uuid()            |
| businesses       | name                         | text                     | null                     | NO          | null                         |
| businesses       | created_at                   | timestamp with time zone | null                     | NO          | timezone('utc'::text, now()) |
| businesses       | updated_at                   | timestamp with time zone | null                     | NO          | timezone('utc'::text, now()) |
| businesses       | taglines                     | text                     | null                     | YES         | null                         |
| businesses       | team_info                    | text                     | null                     | YES         | null                         |
| businesses       | review_platforms             | jsonb                    | null                     | YES         | null                         |
| businesses       | platform_word_counts         | text                     | null                     | YES         | null                         |
| businesses       | logo_url                     | text                     | null                     | YES         | null                         |
| businesses       | keywords                     | text                     | null                     | YES         | null                         |
| businesses       | tagline                      | text                     | null                     | YES         | null                         |
| businesses       | facebook_url                 | text                     | null                     | YES         | null                         |
| businesses       | instagram_url                | text                     | null                     | YES         | null                         |
| businesses       | bluesky_url                  | text                     | null                     | YES         | null                         |
| businesses       | tiktok_url                   | text                     | null                     | YES         | null                         |
| businesses       | youtube_url                  | text                     | null                     | YES         | null                         |
| businesses       | linkedin_url                 | text                     | null                     | YES         | null                         |
| businesses       | pinterest_url                | text                     | null                     | YES         | null                         |
| businesses       | primary_font                 | text                     | null                     | YES         | 'Inter'::text                |
| businesses       | secondary_font               | text                     | null                     | YES         | 'Inter'::text                |
| businesses       | secondary_color              | text                     | null                     | YES         | '#818CF8'::text              |
| businesses       | text_color                   | text                     | null                     | YES         | '#1F2937'::text              |
| businesses       | account_id                   | uuid                     | null                     | NO          | null                         |
| businesses       | background_type              | text                     | null                     | YES         | 'gradient'::text             |
| businesses       | gradient_start               | text                     | null                     | YES         | '#4F46E5'::text              |
| businesses       | gradient_end                 | text                     | null                     | YES         | '#C7D2FE'::text              |
| businesses       | default_offer_enabled        | boolean                  | null                     | YES         | false                        |
| businesses       | default_offer_title          | text                     | null                     | YES         | 'Review Rewards'::text       |
| businesses       | default_offer_body           | text                     | null                     | YES         | null                         |
| businesses       | business_website             | text                     | null                     | YES         | null                         |
| businesses       | address_street               | text                     | null                     | YES         | null                         |
| businesses       | address_city                 | text                     | null                     | YES         | null                         |
| businesses       | address_state                | text                     | null                     | YES         | null                         |
| businesses       | address_zip                  | text                     | null                     | YES         | null                         |
| businesses       | address_country              | text                     | null                     | YES         | null                         |
| businesses       | phone                        | text                     | null                     | YES         | null                         |
| businesses       | primary_color                | text                     | null                     | YES         | '#4F46E5'::text              |
| businesses       | signup_email                 | text                     | null                     | YES         | null                         |
| businesses       | business_email               | text                     | null                     | YES         | null                         |
| businesses       | default_offer_url            | text                     | null                     | YES         | null                         |
| businesses       | industries_other             | text                     | null                     | YES         | null                         |
| businesses       | industry                     | ARRAY                    | null                     | YES         | null                         |
| businesses       | services_offered             | text                     | null                     | YES         | null                         |
| businesses       | company_values               | text                     | null                     | YES         | null                         |
| businesses       | differentiators              | text                     | null                     | YES         | null                         |
| businesses       | years_in_business            | text                     | null                     | YES         | null                         |
| businesses       | industries_served            | text                     | null                     | YES         | null                         |
| businesses       | offer_learn_more_url         | text                     | null                     | YES         | null                         |
| businesses       | ai_dos                       | text                     | null                     | YES         | null                         |
| businesses       | ai_donts                     | text                     | null                     | YES         | null                         |
| businesses       | card_bg                      | text                     | null                     | YES         | null                         |
| businesses       | card_text                    | text                     | null                     | YES         | null                         |
| businesses       | background_color             | text                     | null                     | YES         | null                         |
| contacts         | id                           | uuid                     | null                     | NO          | gen_random_uuid()            |
| contacts         | account_id                   | uuid                     | null                     | NO          | null                         |
| contacts         | first_name                   | text                     | null                     | NO          | null                         |
| contacts         | email                        | text                     | null                     | YES         | null                         |
| contacts         | phone                        | text                     | null                     | YES         | null                         |
| contacts         | notes                        | text                     | null                     | YES         | null                         |