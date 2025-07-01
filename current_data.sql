SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '3ebe9c40-45b0-4429-90d9-7ac8fc43f978', '{"action":"user_confirmation_requested","actor_id":"95749100-7e48-4fb5-99d6-966b7d52df3c","actor_username":"boltro3000@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-01 02:56:56.50455+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ef63349-a7a7-4513-bf72-d634b678a85d', '{"action":"user_confirmation_requested","actor_id":"cdd76ed7-418d-43d5-a01c-c61aa3d275f6","actor_username":"nerves76@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-01 03:07:38.280759+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") VALUES
	('85ec626f-fda7-4859-a91f-3b0de2908973', '95749100-7e48-4fb5-99d6-966b7d52df3c', '20aba0c2-0b9c-4a3d-9ad1-c89f6537f449', 's256', 'pqYT-acC-rpW6EYR8FCkVUHLLyqjfUAWyxFQzxasZbM', 'email', '', '', '2025-07-01 02:56:56.507101+00', '2025-07-01 02:56:56.507101+00', 'email/signup', NULL),
	('397a60ac-6a40-40d9-9978-b48323a0ac30', 'cdd76ed7-418d-43d5-a01c-c61aa3d275f6', '69ff2432-67c9-49a5-8733-e69789f28a69', 's256', 'tr0D_jYeX1F2hyXTvPSqWTUJk1seqVQYv6799yOV5a0', 'email', '', '', '2025-07-01 03:07:38.281545+00', '2025-07-01 03:07:38.281545+00', 'email/signup', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '95749100-7e48-4fb5-99d6-966b7d52df3c', 'authenticated', 'authenticated', 'boltro3000@gmail.com', '$2a$10$krjHpaiX2FGzXdgc1yojCuizkl1Y.Nd1cyT2bplsbOpZhkASCJdR2', NULL, NULL, 'pkce_287f891eb5fd5504c03f48063d235c46c984b0138ad9e1b350968c89', '2025-07-01 02:56:56.510821+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "95749100-7e48-4fb5-99d6-966b7d52df3c", "email": "boltro3000@gmail.com", "email_verified": false, "phone_verified": false}', NULL, '2025-07-01 02:56:56.48577+00', '2025-07-01 02:56:56.935805+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cdd76ed7-418d-43d5-a01c-c61aa3d275f6', 'authenticated', 'authenticated', 'nerves76@gmail.com', '$2a$10$ENDVvxDZ5TVaAKHTQFf7Z.pZLsdot6WUQk382TLHKQGwdGytL3R2W', NULL, NULL, 'pkce_e71ae4c9f6b8b4716c33a1fbe096a1d5a97f01b905a82bd1a42ab41f', '2025-07-01 03:07:38.28234+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "cdd76ed7-418d-43d5-a01c-c61aa3d275f6", "email": "nerves76@gmail.com", "email_verified": false, "phone_verified": false}', NULL, '2025-07-01 03:07:38.273068+00', '2025-07-01 03:07:39.713878+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('95749100-7e48-4fb5-99d6-966b7d52df3c', '95749100-7e48-4fb5-99d6-966b7d52df3c', '{"sub": "95749100-7e48-4fb5-99d6-966b7d52df3c", "email": "boltro3000@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-01 02:56:56.50071+00', '2025-07-01 02:56:56.500762+00', '2025-07-01 02:56:56.500762+00', '47f67ccc-224d-4170-8ee2-81651becf525'),
	('cdd76ed7-418d-43d5-a01c-c61aa3d275f6', 'cdd76ed7-418d-43d5-a01c-c61aa3d275f6', '{"sub": "cdd76ed7-418d-43d5-a01c-c61aa3d275f6", "email": "nerves76@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-01 03:07:38.278055+00', '2025-07-01 03:07:38.278103+00', '2025-07-01 03:07:38.278103+00', 'c0f0a25f-ef7f-4cc9-9bac-8e384996cd0f');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('cc12a403-c069-47a3-bb23-252d6828e0c7', '95749100-7e48-4fb5-99d6-966b7d52df3c', 'confirmation_token', 'pkce_287f891eb5fd5504c03f48063d235c46c984b0138ad9e1b350968c89', 'boltro3000@gmail.com', '2025-07-01 02:56:56.938604', '2025-07-01 02:56:56.938604'),
	('e3f1288c-89f8-417d-8686-f1152938e8c1', 'cdd76ed7-418d-43d5-a01c-c61aa3d275f6', 'confirmation_token', 'pkce_e71ae4c9f6b8b4716c33a1fbe096a1d5a97f01b905a82bd1a42ab41f', 'nerves76@gmail.com', '2025-07-01 03:07:39.715664', '2025-07-01 03:07:39.715664');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: account_users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prompt_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."announcements" ("id", "message", "is_active", "created_by", "created_at", "updated_at") VALUES
	('92e83ecb-6de5-4fca-be6b-443e1e98120a', 'Welcome to PromptReviews! We''re excited to help you collect and manage customer reviews.', true, NULL, '2025-06-30 14:51:56.596099+00', '2025-06-30 14:51:56.596099+00');


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_templates" ("id", "name", "subject", "html_content", "text_content", "is_active", "created_at", "updated_at") VALUES
	('afe33e4c-b753-4cb2-87f7-ba13e21f1398', 'welcome', 'Welcome to PromptReviews! 🎉', '<p>Hi {{firstName}},</p>

<p>I''m really glad you''re here. Even if it''s just for a short ride.</p>

<p>Prompt Reviews isn''t just an app—it''s a tool to help small businesses like yours earn the 5-star feedback you deserve, without nagging or chasing your customers.</p>

<p>In a world where big companies are rushing to replace humans with AI, you offer something they can''t: real connection. People want to support small businesses. They want to give back. Sometimes they just need a little nudge—and an easy way to do it.</p>

<p>That''s where Prompt Reviews comes in.<br>
It helps your customers say what they already feel—it helps them help you.</p>

<p><strong>Did you know:</strong></p>
<ul>
  <li>Every 10 Google reviews = 2.7% more conversions</li>
  <li>25% of people check 3+ sites before making a decision</li>
</ul>

<p>Reviews matter. Let''s make them easier to collect—and more meaningful.</p>

<p>👉 <a href="{{dashboardUrl}}">Get started here</a></p>

<p>Let me know how it goes.</p>

<p>If you ever want help or ideas, I''d love to hear from you.</p>

<p>– Chris<br>
Founder, Prompt Reviews<br>
(Oh, Prompty says, Hi!)</p>

<p><small>You can also <a href="{{loginUrl}}">log in here</a> anytime.</small></p>', 'Hi {{firstName}},

I''m really glad you''re here. Even if it''s just for a short ride.

Prompt Reviews isn''t just an app—it''s a tool to help small businesses like yours earn the 5-star feedback you deserve, without nagging or chasing your customers.

In a world where big companies are rushing to replace humans with AI, you offer something they can''t: real connection. People want to support small businesses. They want to give back. Sometimes they just need a little nudge—and an easy way to do it.

That''s where Prompt Reviews comes in.
It helps your customers say what they already feel—it helps them help you.

Did you know:
- Every 10 Google reviews = 2.7% more conversions
- 25% of people check 3+ sites before making a decision

Reviews matter. Let''s make them easier to collect—and more meaningful.

Get started here: {{dashboardUrl}}

Let me know how it goes.

If you ever want help or ideas, I''d love to hear from you.

– Chris
Founder, Prompt Reviews
(Oh, Prompty says, Hi!)

You can also log in here anytime: {{loginUrl}}', true, '2025-06-30 14:51:55.744233+00', '2025-06-30 14:51:55.744233+00'),
	('14f7a229-e5cd-4d8f-8732-120b1a4e2f0a', 'trial_reminder', 'Your PromptReviews trial expires in 3 days! ⏰', '<p>Hi {{firstName}},</p>

<p>Just a friendly reminder that your PromptReviews trial expires in <strong>3 days</strong>.</p>

<p>Don''t lose access to all the great features you''ve been using:</p>
<ul>
  <li>✅ Universal prompt page</li>
  <li>✅ Custom prompt pages</li>
  <li>✅ Review widget</li>
  <li>✅ And more!</li>
</ul>

<p>Upgrade now to keep collecting those 5-star reviews and growing your business:</p>

<p><a href="{{upgradeUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Upgrade Now - $15/month</a></p>

<p>Questions? Just reply to this email - I''m here to help!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>', 'Hi {{firstName}},

Just a friendly reminder that your PromptReviews trial expires in 3 days.

Don''t lose access to all the great features you''ve been using:
✅ Universal prompt page
✅ Custom prompt pages
✅ Review widget
✅ And more!

Upgrade now to keep collecting those 5-star reviews and growing your business:

{{upgradeUrl}}

Questions? Just reply to this email - I''m here to help!

– Chris
Founder, Prompt Reviews', true, '2025-06-30 14:51:55.744233+00', '2025-06-30 14:51:55.744233+00'),
	('c4ed5dff-42b2-43d9-8dc8-3347879dac0b', 'trial_expired', 'Your PromptReviews trial has expired 😔', '<p>Hi {{firstName}},</p>

<p>Your PromptReviews trial has expired. We''re sad to see you go!</p>

<p>But don''t worry - you can still upgrade and get back to collecting those amazing reviews:</p>

<p><a href="{{upgradeUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Upgrade Now - $15/month</a></p>

<p>Remember what you were building:</p>
<ul>
  <li>🌟 More 5-star reviews</li>
  <li>🌟 Better online visibility</li>
  <li>🌟 Happy customers spreading the word</li>
</ul>

<p>Ready to continue? Just click the button above!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>', 'Hi {{firstName}},

Your PromptReviews trial has expired. We''re sad to see you go!

But don''t worry - you can still upgrade and get back to collecting those amazing reviews:

{{upgradeUrl}}

Remember what you were building:
🌟 More 5-star reviews
🌟 Better online visibility
🌟 Happy customers spreading the word

Ready to continue? Just click the link above!

– Chris
Founder, Prompt Reviews', true, '2025-06-30 14:51:55.744233+00', '2025-06-30 14:51:55.744233+00');


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: onboarding_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quotes" ("id", "text", "author", "is_active", "created_by", "created_at", "updated_at", "button_text", "button_url") VALUES
	('e6953a5f-1875-4494-9e07-300e88dc5025', 'Customer reviews are the lifeblood of any business.', 'Business Wisdom', true, NULL, '2025-06-30 14:51:56.596099+00', '2025-06-30 14:51:56.596099+00', NULL, NULL);


--
-- Data for Name: review_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: trial_reminder_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: widget_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('logos', 'logos', NULL, '2025-05-11 01:23:31.000571+00', '2025-05-11 01:23:31.000571+00', true, false, 307200, NULL, NULL),
	('products', 'products', NULL, '2025-06-01 13:24:26.763567+00', '2025-06-01 13:24:26.763567+00', true, false, 512000, NULL, NULL),
	('testimonial-photos', 'testimonial-photos', NULL, '2025-05-24 04:05:52.820874+00', '2025-05-24 04:05:52.820874+00', true, false, 307200, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('3e116949-c7f9-44a7-b19f-f2f36fffd0fe', 'logos', 'business-logos/.emptyFolderPlaceholder', NULL, '2025-05-24 03:08:25.494472+00', '2025-05-24 03:08:25.494472+00', '2025-05-24 03:08:25.494472+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-05-24T03:08:26.000Z", "contentLength": 0, "httpStatusCode": 200}', '09161d5d-52ad-4d52-baf4-0587de470be8', NULL, '{}'),
	('27e3d27f-1966-4e54-a3f5-a137bbd964ef', 'testimonial-photos', 'photo_1748102973435_gr9uy3579gm.jpg', NULL, '2025-05-24 16:09:33.836618+00', '2025-05-24 16:09:33.836618+00', '2025-05-24 16:09:33.836618+00', '{"eTag": "\"6e3a62742f4045031775b088c94b8fbc\"", "size": 4865, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-05-24T16:09:34.000Z", "contentLength": 4865, "httpStatusCode": 200}', '341aac71-7c0c-4fc3-a377-a8ca785cb919', NULL, '{}'),
	('440a8814-95dc-48f7-a757-27dbc2b3847a', 'testimonial-photos', 'photo_1748103653064_e00zqbqaa1.jpg', NULL, '2025-05-24 16:20:53.605889+00', '2025-05-24 16:20:53.605889+00', '2025-05-24 16:20:53.605889+00', '{"eTag": "\"6e3a62742f4045031775b088c94b8fbc\"", "size": 4865, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-05-24T16:20:54.000Z", "contentLength": 4865, "httpStatusCode": 200}', 'cee32ff1-2f4c-4bfa-b7fb-30e969ddc971', NULL, '{}'),
	('4754b1da-ec5b-4d3b-9ca9-5f108aecdb09', 'testimonial-photos', 'photo_1748103844020_j7fvp6r3ptc.jpg', NULL, '2025-05-24 16:24:04.579137+00', '2025-05-24 16:24:04.579137+00', '2025-05-24 16:24:04.579137+00', '{"eTag": "\"6e3a62742f4045031775b088c94b8fbc\"", "size": 4865, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-05-24T16:24:05.000Z", "contentLength": 4865, "httpStatusCode": 200}', '15376131-1b7f-4f8a-8585-fa6d2e0f6f34', NULL, '{}'),
	('14ca116e-9295-4659-bcd2-e321ed35f058', 'logos', 'prompt-assets/prompt-reviews-get-reviews-online.png', NULL, '2025-05-25 00:50:19.177445+00', '2025-05-25 00:50:19.177445+00', '2025-05-25 00:50:19.177445+00', '{"eTag": "\"9e3921dd57f2d464ba504913fa292864-1\"", "size": 51625, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-05-25T00:50:19.000Z", "contentLength": 51625, "httpStatusCode": 200}', 'd1d9edb1-fd72-46b7-a83d-6130903bf554', NULL, NULL),
	('2f9e4ef0-b960-477d-baab-58097a25dd8a', 'logos', 'prompt-assets/prompt-reviews-get-more-reviews-logo.png', NULL, '2025-05-26 05:26:32.030269+00', '2025-05-26 05:26:32.030269+00', '2025-05-26 05:26:32.030269+00', '{"eTag": "\"efe60fe168f8de55193f4e87fa40d68f-1\"", "size": 18749, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-05-26T05:26:32.000Z", "contentLength": 18749, "httpStatusCode": 200}', '73b6a129-f504-4ab6-b74e-15fcf791c081', NULL, NULL),
	('78741a3b-0bc4-4ffa-8bde-843e5616134a', 'logos', 'business-logos/7dbbc3d5-3aba-4f82-9b7d-b0c1b751263d.png', '7dbbc3d5-3aba-4f82-9b7d-b0c1b751263d', '2025-05-24 21:41:47.791069+00', '2025-05-24 21:49:14.983205+00', '2025-05-24 21:41:47.791069+00', '{"eTag": "\"dd8340f33cb3d76e1f8c3e488753a500\"", "size": 19457, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-05-24T21:49:15.000Z", "contentLength": 19457, "httpStatusCode": 200}', '5b9fb359-1332-407c-aab4-eacddc41269f', '7dbbc3d5-3aba-4f82-9b7d-b0c1b751263d', '{}'),
	('eea6f957-9ac7-4dad-90fc-480dbbadebdf', 'logos', 'business-logos/f3fa0bb0-feab-4501-8644-c0ca579da96d.png', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-05-27 18:55:44.921178+00', '2025-05-27 18:55:44.921178+00', '2025-05-27 18:55:44.921178+00', '{"eTag": "\"dd8340f33cb3d76e1f8c3e488753a500\"", "size": 19457, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-05-27T18:55:45.000Z", "contentLength": 19457, "httpStatusCode": 200}', '9506ff4a-37d3-47ec-b052-9985792738ea', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('1f37888b-dcd7-4408-b2df-175bc65ce60b', 'products', 'addon-icon-forms.png', NULL, '2025-06-01 16:24:56.030412+00', '2025-06-01 16:24:56.030412+00', '2025-06-01 16:24:56.030412+00', '{"eTag": "\"a6f371954dc99a8220cf55d44fc7eb66-1\"", "size": 441, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-01T16:24:56.000Z", "contentLength": 441, "httpStatusCode": 200}', 'dc24d4fb-e63f-4065-8218-79ecb5930527', NULL, NULL),
	('efccde63-c2cd-40ce-8bd2-aebed571690b', 'products', 'product-photos/.emptyFolderPlaceholder', NULL, '2025-06-01 16:31:40.076771+00', '2025-06-01 16:31:40.076771+00', '2025-06-01 16:31:40.076771+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-06-01T16:31:40.000Z", "contentLength": 0, "httpStatusCode": 200}', '83e3e30d-e7c7-4586-bdae-b7ec6ca20ca9', NULL, '{}'),
	('6fc60653-17a9-4644-86ee-3835c6b7c0d2', 'products', 'product-photos/f3fa0bb0-feab-4501-8644-c0ca579da96d-1748808040621.png', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-06-01 20:00:41.246546+00', '2025-06-01 20:00:41.246546+00', '2025-06-01 20:00:41.246546+00', '{"eTag": "\"22322f3939da834d66caa71b6306309f\"", "size": 17404, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-01T20:00:42.000Z", "contentLength": 17404, "httpStatusCode": 200}', '650fc40c-ba64-4bce-b9ee-5c72c3258f3c', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('b2d6fd57-2ca0-43ca-b3c9-4b2b7153cb8a', 'products', 'product-photos/f3fa0bb0-feab-4501-8644-c0ca579da96d-1748810400302.png', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-06-01 20:40:00.773168+00', '2025-06-01 20:40:00.773168+00', '2025-06-01 20:40:00.773168+00', '{"eTag": "\"803b8dcd0278375ae067d9119bf49b27\"", "size": 20173, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-01T20:40:01.000Z", "contentLength": 20173, "httpStatusCode": 200}', '71efcbeb-218f-42bc-8e09-1d673ed01e46', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('dbf9d6d0-ed6b-4a5a-a145-12d72a097087', 'products', 'product-photos/f3fa0bb0-feab-4501-8644-c0ca579da96d-1748994569823.png', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-06-03 23:49:30.67453+00', '2025-06-03 23:49:30.67453+00', '2025-06-03 23:49:30.67453+00', '{"eTag": "\"4128254a0f229a36453ca980dd5278e5\"", "size": 184073, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-03T23:49:31.000Z", "contentLength": 184073, "httpStatusCode": 200}', '37a985e7-367d-4320-b878-0e680bbbf981', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('5a27aac1-1a1c-474b-8d2a-b2df6e1b082b', 'products', 'product-photos/f3fa0bb0-feab-4501-8644-c0ca579da96d-1748997140878.webp', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-06-04 00:32:21.125452+00', '2025-06-04 00:32:21.125452+00', '2025-06-04 00:32:21.125452+00', '{"eTag": "\"5be5b75583c5c348694aed940f14d62e\"", "size": 39392, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2025-06-04T00:32:22.000Z", "contentLength": 39392, "httpStatusCode": 200}', '008c9535-96a7-4255-a075-6f96217b95c4', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('f6e7183c-62ec-4b81-8ec6-f87b42eea0e0', 'logos', 'business-logos/f3fa0bb0-feab-4501-8644-c0ca579da96d.webp', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '2025-06-04 03:16:42.130139+00', '2025-06-04 03:16:42.130139+00', '2025-06-04 03:16:42.130139+00', '{"eTag": "\"8e191943fa4c400bfd9c445a0ca84036\"", "size": 5340, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2025-06-04T03:16:43.000Z", "contentLength": 5340, "httpStatusCode": 200}', 'f7bd339b-df67-473c-af4d-b623e97d5548', 'f3fa0bb0-feab-4501-8644-c0ca579da96d', '{}'),
	('ae3109e9-44e4-490c-9819-46780f0eac2a', 'testimonial-photos', 'widget_2094ae64-c13f-4709-b684-99027e6b51b8_photo_1749485096532_s9dujmhxgbl.jpg', NULL, '2025-06-09 16:04:56.938354+00', '2025-06-09 16:04:56.938354+00', '2025-06-09 16:04:56.938354+00', '{"eTag": "\"f7f7af5a3a8b3e663fb45515159b99a2\"", "size": 36089, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-09T16:04:57.000Z", "contentLength": 36089, "httpStatusCode": 200}', '59f39d77-46e5-4620-9e0a-e3f93ea15f0f', NULL, '{}'),
	('16ad1bf4-63d3-4840-8f73-a2749f8ce87a', 'testimonial-photos', 'widget_2094ae64-c13f-4709-b684-99027e6b51b8_photo_1749665284829_rjta7cz7ipt.jpg', NULL, '2025-06-11 18:08:05.441085+00', '2025-06-11 18:08:05.441085+00', '2025-06-11 18:08:05.441085+00', '{"eTag": "\"805e2c3ba27f587372e30befdb4c6494\"", "size": 71369, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-11T18:08:06.000Z", "contentLength": 71369, "httpStatusCode": 200}', 'a0712530-e15d-41d0-8d77-505c6eee1734', NULL, '{}'),
	('a383f4bc-f1b2-430c-ad6c-535007c7bfb3', 'testimonial-photos', 'widget_2094ae64-c13f-4709-b684-99027e6b51b8_photo_1750625496542_t2zeamt4sp8.jpg', NULL, '2025-06-22 20:51:37.132395+00', '2025-06-22 20:51:37.132395+00', '2025-06-22 20:51:37.132395+00', '{"eTag": "\"9db462ed11b9474035f5543e8fcab8f9\"", "size": 39049, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-22T20:51:38.000Z", "contentLength": 39049, "httpStatusCode": 200}', 'd1bade91-6543-4330-afef-ce110bad969a', NULL, '{}'),
	('d98ad65f-5d88-4eca-bf51-f7c5704ff8aa', 'testimonial-photos', 'widget_2094ae64-c13f-4709-b684-99027e6b51b8_photo_1750625700211_nl0j35a19p.jpg', NULL, '2025-06-22 20:55:00.639605+00', '2025-06-22 20:55:00.639605+00', '2025-06-22 20:55:00.639605+00', '{"eTag": "\"9db462ed11b9474035f5543e8fcab8f9\"", "size": 39049, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-22T20:55:01.000Z", "contentLength": 39049, "httpStatusCode": 200}', '5dbd307d-d556-4c80-a6da-174f57532958', NULL, '{}'),
	('3b6138b8-d123-413b-b5de-1910d26a2a2e', 'testimonial-photos', 'widget_2094ae64-c13f-4709-b684-99027e6b51b8_photo_1750626276072_sxv1vby9fm.jpg', NULL, '2025-06-22 21:04:36.439498+00', '2025-06-22 21:04:36.439498+00', '2025-06-22 21:04:36.439498+00', '{"eTag": "\"9db462ed11b9474035f5543e8fcab8f9\"", "size": 39049, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-22T21:04:37.000Z", "contentLength": 39049, "httpStatusCode": 200}', '1db20c28-e516-459b-a189-b6bb006915b2', NULL, '{}'),
	('103f5763-e478-4baa-b1a7-8146f71e1334', 'logos', 'prompt-assets/promptreviews-get-review-qr-code.jpg', NULL, '2025-06-23 16:32:57.619483+00', '2025-06-23 16:32:57.619483+00', '2025-06-23 16:32:57.619483+00', '{"eTag": "\"a807f2677cb92e0f5db79dc85786d686-1\"", "size": 128402, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-23T16:32:58.000Z", "contentLength": 128402, "httpStatusCode": 200}', '8d88993e-cc0e-4cc1-b275-26a73117653f', NULL, NULL),
	('fd3e7f07-0488-4eb6-967d-726a5c4096cd', 'logos', 'prompt-assets/qr-code-review.jpg', NULL, '2025-06-23 17:12:57.536596+00', '2025-06-23 17:12:57.536596+00', '2025-06-23 17:12:57.536596+00', '{"eTag": "\"81f36bf09e5420aaa6af9a699bd4f4e6-1\"", "size": 41373, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-06-23T17:12:58.000Z", "contentLength": 41373, "httpStatusCode": 200}', '1f46dcba-9899-4b15-aa4f-613bd291b2b7', NULL, NULL),
	('0de98439-3000-4269-8940-5c62dc0bc060', 'logos', 'prompt-assets/prompty-600kb.png', NULL, '2025-06-25 03:21:21.709743+00', '2025-06-25 03:21:21.709743+00', '2025-06-25 03:21:21.709743+00', '{"eTag": "\"be0cd5ce34e07b8ba4b74026bbf13b41-1\"", "size": 168969, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-25T03:21:22.000Z", "contentLength": 168969, "httpStatusCode": 200}', 'b927a507-ad08-4217-b76c-dd2c2186b229', NULL, NULL),
	('b1bd42c0-77cf-4461-8cf2-c36783268943', 'logos', 'prompt-assets/prompty-catching-review-stars.png', NULL, '2025-06-25 22:11:49.83841+00', '2025-06-25 22:11:49.83841+00', '2025-06-25 22:11:49.83841+00', '{"eTag": "\"4849a7df404a2a802bc52c752ef1f61d-1\"", "size": 115641, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-25T22:11:50.000Z", "contentLength": 115641, "httpStatusCode": 200}', '654b7f10-2ea9-4748-a993-f1e81bf22007', NULL, NULL),
	('3908c152-b4cc-44ea-bcdb-5f024fb87e52', 'logos', 'prompt-assets/prompty-fishing-for-stars.png', NULL, '2025-06-26 02:02:03.380065+00', '2025-06-26 02:02:03.380065+00', '2025-06-26 02:02:03.380065+00', '{"eTag": "\"4b03413ae1b0c61809bcda135604ea68-1\"", "size": 217771, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-26T02:02:03.000Z", "contentLength": 217771, "httpStatusCode": 200}', '97bb5591-f6bd-4d68-b1f7-ca92b10ae1cd', NULL, NULL),
	('689e4097-bc18-4c3c-9964-22cee0df3bbb', 'logos', 'prompt-assets/new-cowboy-icon.png', NULL, '2025-06-26 14:54:50.816684+00', '2025-06-26 14:54:50.816684+00', '2025-06-26 14:54:50.816684+00', '{"eTag": "\"49bbbb77f36b0316b9cf535657f7eb25-1\"", "size": 4003, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-06-26T14:54:51.000Z", "contentLength": 4003, "httpStatusCode": 200}', '5e5ec544-9a42-45a5-8238-147a42afafdb', NULL, NULL);


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 784, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
