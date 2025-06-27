# Row Level Security (RLS) Policies Documentation

**Last Updated:** june 26  2025

This document contains all Row Level Security (RLS) policies currently active in the promptreviews database.

## Overview

Row Level Security (RLS) is enabled on all tables to ensure data isolation and security. Each table has specific policies that control what operations users can perform based on their authentication status and ownership of the data.

## Policy Definitions
| table_details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DETAILED TABLE: account_users
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - account_id (uuid) NOT NULL
  - user_id (uuid) NOT NULL
  - role (text) DEFAULT 'member'::text
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| DETAILED TABLE: accounts
================
Columns:
  - id (uuid) NOT NULL
  - business_name (text)
  - created_at (timestamp with time zone) DEFAULT now()
  - plan (text) DEFAULT 'NULL'::text
  - trial_start (timestamp with time zone)
  - trial_end (timestamp with time zone)
  - custom_prompt_page_count (integer) NOT NULL DEFAULT 0
  - contact_count (integer) NOT NULL DEFAULT 0
  - first_name (text)
  - last_name (text)
  - stripe_customer_id (text)
  - stripe_subscription_id (text)
  - subscription_status (text)
  - is_free_account (boolean) DEFAULT false
  - has_had_paid_plan (boolean) NOT NULL DEFAULT false
  - email (text)
  - plan_lookup_key (text)
  - review_notifications_enabled (boolean) DEFAULT true
  - user_id (uuid)
  - has_seen_welcome (boolean) DEFAULT false
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DETAILED TABLE: admins
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - account_id (uuid) NOT NULL
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DETAILED TABLE: ai_usage
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - user_id (uuid)
  - prompt_tokens (integer)
  - completion_tokens (integer)
  - total_tokens (integer)
  - cost_usd (numeric)
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DETAILED TABLE: analytics_events
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - prompt_page_id (uuid)
  - event_type (text)
  - platform (text)
  - created_at (timestamp with time zone) DEFAULT timezone('utc'::text, now())
  - metadata (jsonb) DEFAULT '{}'::jsonb
  - session_id (text)
  - user_agent (text)
  - ip_address (text)
  - emoji_sentiment (text)
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| DETAILED TABLE: announcements
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - message (text) NOT NULL
  - is_active (boolean) DEFAULT true
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
  - created_by (uuid) NOT NULL
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| DETAILED TABLE: businesses
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - name (text) NOT NULL
  - created_at (timestamp with time zone) NOT NULL DEFAULT timezone('utc'::text, now())
  - updated_at (timestamp with time zone) NOT NULL DEFAULT timezone('utc'::text, now())
  - taglines (text)
  - team_info (text)
  - review_platforms (jsonb)
  - platform_word_counts (text)
  - logo_url (text)
  - keywords (text)
  - tagline (text)
  - facebook_url (text)
  - instagram_url (text)
  - bluesky_url (text)
  - tiktok_url (text)
  - youtube_url (text)
  - linkedin_url (text)
  - pinterest_url (text)
  - primary_font (text) DEFAULT 'Inter'::text
  - secondary_font (text) DEFAULT 'Inter'::text
  - secondary_color (text) DEFAULT '#818CF8'::text
  - text_color (text) DEFAULT '#1F2937'::text
  - account_id (uuid) NOT NULL
  - background_type (text) DEFAULT 'gradient'::text
  - gradient_start (text) DEFAULT '#4F46E5'::text
  - gradient_end (text) DEFAULT '#C7D2FE'::text
  - default_offer_enabled (boolean) DEFAULT false
  - default_offer_title (text) DEFAULT 'Review Rewards'::text
  - default_offer_body (text)
  - business_website (text)
  - address_street (text)
  - address_city (text)
  - address_state (text)
  - address_zip (text)
  - address_country (text)
  - phone (text)
  - primary_color (text) DEFAULT '#4F46E5'::text
  - signup_email (text)
  - business_email (text)
  - default_offer_url (text)
  - industries_other (text)
  - industry (ARRAY)
  - services_offered (text)
  - company_values (text)
  - differentiators (text)
  - years_in_business (text)
  - industries_served (text)
  - offer_learn_more_url (text)
  - ai_dos (text)
  - ai_donts (text)
  - card_bg (text)
  - card_text (text)
  - background_color (text)
--- |
| DETAILED TABLE: contacts
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - account_id (uuid) NOT NULL
  - first_name (text) NOT NULL
  - email (text)
  - phone (text)
  - notes (text)
  - created_at (timestamp with time zone) NOT NULL DEFAULT timezone('utc'::text, now())
  - updated_at (timestamp with time zone) NOT NULL DEFAULT timezone('utc'::text, now())
  - last_name (text)
  - role (text)
  - update_token (text)
  - last_updated_at (timestamp with time zone)
  - address (text)
  - business_name (text)
  - address_line1 (text)
  - address_line2 (text)
  - city (text)
  - state (text)
  - postal_code (text)
  - country (text)
  - category (text)
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DETAILED TABLE: debug_errors
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - error_text (text)
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DETAILED TABLE: email_templates
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - name (text) NOT NULL
  - subject (text) NOT NULL
  - html_content (text) NOT NULL
  - text_content (text)
  - is_active (boolean) DEFAULT true
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DETAILED TABLE: feedback
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - user_id (uuid)
  - category (text) NOT NULL
  - message (text) NOT NULL
  - email (text)
  - is_read (boolean) DEFAULT false
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DETAILED TABLE: prompt_pages
================
Columns:
  - id (uuid) NOT NULL DEFAULT uuid_generate_v4()
  - account_id (uuid) NOT NULL
  - slug (text)
  - client_name (text)
  - location (text)
  - project_type (text)
  - services_offered (ARRAY)
  - outcomes (text)
  - date_completed (date)
  - assigned_team_members (text)
  - review_platforms (jsonb)
  - qr_code_url (text)
  - created_at (timestamp with time zone) DEFAULT now()
  - is_universal (boolean) DEFAULT false
  - team_member (uuid)
  - first_name (text)
  - last_name (text)
  - phone (text)
  - email (text)
  - offer_enabled (boolean) DEFAULT false
  - offer_title (text) DEFAULT 'Review Rewards'::text
  - offer_body (text)
  - category (text)
  - friendly_note (text)
  - offer_url (text)
  - status (USER-DEFINED) DEFAULT 'in_queue'::prompt_page_status
  - role (text)
  - falling_icon (text) DEFAULT 'star'::text
  - review_type (text) DEFAULT 'review'::text
  - no_platform_review_template (text)
  - video_max_length (integer)
  - video_quality (text)
  - video_preset (text)
  - video_questions (jsonb)
  - video_note (text)
  - video_tips (text)
  - video_recipient (text)
  - emoji_sentiment_enabled (boolean) DEFAULT false
  - emoji_sentiment_question (text)
  - emoji_feedback_message (text)
  - emoji_thank_you_message (text)
  - ai_button_enabled (boolean) DEFAULT true
  - product_description (text)
  - features_or_benefits (jsonb)
  - product_name (text)
  - product_photo (text)
  - product_subcopy (text)
  - show_friendly_note (boolean) NOT NULL DEFAULT true
---                                                                                                                                                                                                                              |
| DETAILED TABLE: quotes
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - text (text) NOT NULL
  - author (text)
  - is_active (boolean) DEFAULT true
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
  - created_by (uuid) NOT NULL
  - button_text (text)
  - button_url (text)
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DETAILED TABLE: review_drafts
================
Columns:
  - id (uuid) NOT NULL DEFAULT uuid_generate_v4()
  - prompt_page_id (uuid)
  - platform (text)
  - review_text (text)
  - regeneration_count (integer) DEFAULT 0
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| DETAILED TABLE: review_submissions
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - prompt_page_id (uuid) NOT NULL
  - platform (text) NOT NULL
  - submitted_at (timestamp with time zone) DEFAULT now()
  - status (text) NOT NULL
  - user_agent (text)
  - ip_address (text)
  - created_at (timestamp with time zone) DEFAULT now()
  - reviewer_role (text)
  - review_content (text)
  - review_group_id (uuid) DEFAULT gen_random_uuid()
  - photo_url (text)
  - emoji_sentiment_selection (character varying(32))
  - first_name (character varying(100))
  - last_name (character varying(100))
  - email (character varying(255))
  - phone (character varying(50))
  - prompt_page_type (text)
  - review_type (text)
  - verified (boolean) DEFAULT false
  - verified_at (timestamp with time zone)
  - platform_url (text)
  - business_id (uuid)
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| DETAILED TABLE: trial_reminder_logs
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - account_id (uuid) NOT NULL
  - email (text) NOT NULL
  - reminder_type (text) NOT NULL
  - sent_at (timestamp with time zone) DEFAULT now()
  - success (boolean) NOT NULL
  - error_message (text)
  - created_at (timestamp with time zone) DEFAULT now()
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DETAILED TABLE: widget_reviews
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - widget_id (uuid) NOT NULL
  - review_id (uuid)
  - review_content (text) NOT NULL
  - reviewer_role (text)
  - platform (text)
  - order_index (integer)
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
  - first_name (character varying) NOT NULL
  - last_name (character varying) NOT NULL
  - star_rating (numeric)
  - photo_url (text)
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DETAILED TABLE: widgets
================
Columns:
  - id (uuid) NOT NULL DEFAULT gen_random_uuid()
  - account_id (uuid) NOT NULL
  - name (text) NOT NULL
  - theme (jsonb)
  - review_count (integer) DEFAULT 5
  - is_active (boolean) DEFAULT true
  - created_at (timestamp with time zone) DEFAULT now()
  - updated_at (timestamp with time zone) DEFAULT now()
  - widget_type (text) DEFAULT 'multi'::text
---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |