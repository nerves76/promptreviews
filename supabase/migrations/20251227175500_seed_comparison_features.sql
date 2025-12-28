-- Seed comparison categories, features, and competitor feature mappings

-- Update competitors with logo URLs (using favicons)
UPDATE competitors SET logo_url = 'https://birdeye.com/favicon.ico' WHERE slug = 'birdeye';
UPDATE competitors SET logo_url = 'https://www.podium.com/favicon.ico' WHERE slug = 'podium';
UPDATE competitors SET logo_url = 'https://get.nicejob.com/favicon.ico' WHERE slug = 'nicejob';
UPDATE competitors SET logo_url = 'https://gatherup.com/favicon.ico' WHERE slug = 'gatherup';
UPDATE competitors SET logo_url = 'https://www.grade.us/favicon.ico' WHERE slug = 'grade-us';
UPDATE competitors SET logo_url = 'https://www.brightlocal.com/favicon.ico' WHERE slug = 'brightlocal';
UPDATE competitors SET logo_url = 'https://www.reputation.com/favicon.ico' WHERE slug = 'reputation-com';
UPDATE competitors SET logo_url = 'https://whitespark.ca/favicon.ico' WHERE slug = 'whitespark';

-- Create feature categories
INSERT INTO comparison_categories (slug, name, description, icon_name, display_order) VALUES
  ('review-generation', 'Review generation', 'Features for collecting new reviews from customers', 'FaStar', 1),
  ('review-management', 'Review management', 'Tools for monitoring and responding to reviews', 'FaComments', 2),
  ('local-seo', 'Local SEO', 'Local search optimization features', 'FaMapMarker', 3),
  ('integrations', 'Integrations', 'Third-party integrations and API access', 'FaPlug', 4),
  ('analytics', 'Analytics & reporting', 'Data insights and reporting tools', 'FaChartLine', 5),
  ('pricing-value', 'Pricing & value', 'Cost and contract flexibility', 'FaCoins', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Create features for each category
-- Review Generation features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'review-generation'),
  display_order
FROM (VALUES
  ('sms-review-requests', 'SMS review requests', 'Get reviews via text message', 'Send review requests via SMS', 'boolean', 1),
  ('email-review-requests', 'Email review requests', 'Get reviews via email', 'Send review requests via email campaigns', 'boolean', 2),
  ('qr-codes', 'QR code generation', 'Easy in-store review collection', 'Generate QR codes for review collection', 'boolean', 3),
  ('review-automation', 'Automated follow-ups', 'Set and forget review collection', 'Automatically send review request sequences', 'boolean', 4),
  ('custom-landing-pages', 'Custom review pages', 'Branded review experience', 'Customizable review landing pages', 'boolean', 5),
  ('multi-platform-requests', 'Multi-platform support', 'Reviews on Google, Facebook & more', 'Request reviews for multiple platforms', 'boolean', 6),
  ('review-filtering', 'Smart review filtering', 'Route unhappy customers privately', 'Filter negative feedback before public posting', 'boolean', 7),
  ('nfc-tap-reviews', 'NFC tap-to-review', 'Contactless review collection', 'NFC-enabled review collection cards/stands', 'boolean', 8)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Review Management features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'review-management'),
  display_order
FROM (VALUES
  ('review-monitoring', 'Review monitoring', 'Never miss a review', 'Monitor reviews across platforms', 'boolean', 1),
  ('review-response', 'Review response tools', 'Respond from one dashboard', 'Respond to reviews from central dashboard', 'boolean', 2),
  ('ai-responses', 'AI response suggestions', 'Save time with AI-written replies', 'AI-powered review response generation', 'boolean', 3),
  ('negative-alerts', 'Negative review alerts', 'Address issues fast', 'Instant alerts for negative reviews', 'boolean', 4),
  ('review-widgets', 'Website review widgets', 'Show off your reviews', 'Embeddable review widgets for websites', 'boolean', 5),
  ('social-sharing', 'Social media sharing', 'Amplify positive reviews', 'Share reviews to social media', 'boolean', 6),
  ('review-reports', 'Review performance reports', 'Track your reputation', 'Detailed review analytics and trends', 'boolean', 7)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Local SEO features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'local-seo'),
  display_order
FROM (VALUES
  ('gbp-integration', 'Google Business Profile', 'Direct GBP connection', 'Native Google Business Profile integration', 'boolean', 1),
  ('gbp-posting', 'GBP post scheduling', 'Keep your listing active', 'Schedule posts to Google Business Profile', 'boolean', 2),
  ('local-rank-tracking', 'Local rank tracking', 'Monitor your visibility', 'Track local search rankings by location', 'boolean', 3),
  ('citation-management', 'Citation management', 'Consistent business listings', 'Manage business citations across directories', 'boolean', 4),
  ('listing-sync', 'Listing syndication', 'Be found everywhere', 'Sync listings to multiple directories', 'boolean', 5)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Integrations features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'integrations'),
  display_order
FROM (VALUES
  ('crm-integrations', 'CRM integrations', 'Connect your customer data', 'Integrations with popular CRMs', 'boolean', 1),
  ('pos-integrations', 'POS integrations', 'Automate from transactions', 'Point of sale system integrations', 'boolean', 2),
  ('zapier', 'Zapier integration', 'Connect 5000+ apps', 'Zapier connectivity for automation', 'boolean', 3),
  ('api-access', 'API access', 'Build custom integrations', 'Developer API for custom integrations', 'boolean', 4),
  ('webhooks', 'Webhooks', 'Real-time data sync', 'Webhook support for events', 'boolean', 5)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Analytics features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'analytics'),
  display_order
FROM (VALUES
  ('analytics-dashboard', 'Analytics dashboard', 'See your performance at a glance', 'Comprehensive analytics dashboard', 'boolean', 1),
  ('sentiment-analysis', 'Sentiment analysis', 'Understand customer feelings', 'AI-powered sentiment analysis', 'boolean', 2),
  ('competitor-benchmarking', 'Competitor benchmarking', 'Compare against competitors', 'Benchmark against local competitors', 'boolean', 3),
  ('custom-reports', 'Custom reports', 'Get the data you need', 'Customizable reporting', 'boolean', 4),
  ('white-label-reports', 'White-label reports', 'Reports with your branding', 'Branded reports for agencies', 'boolean', 5)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Pricing & Value features
INSERT INTO comparison_features (slug, name, benefit_framing, description, feature_type, category_id, display_order)
SELECT
  slug, name, benefit_framing, description, feature_type,
  (SELECT id FROM comparison_categories WHERE slug = 'pricing-value'),
  display_order
FROM (VALUES
  ('free-trial', 'Free trial', 'Try before you buy', 'Free trial period available', 'boolean', 1),
  ('no-contracts', 'No long-term contracts', 'Cancel anytime', 'Month-to-month billing available', 'boolean', 2),
  ('transparent-pricing', 'Transparent pricing', 'Know what you''ll pay', 'Public pricing on website', 'boolean', 3),
  ('smb-affordable', 'SMB-friendly pricing', 'Built for small business budgets', 'Pricing accessible for small businesses', 'boolean', 4),
  ('unlimited-review-requests', 'Unlimited review requests', 'No caps on growth', 'No limits on review request volume', 'boolean', 5),
  ('unlimited-users', 'Unlimited team members', 'Whole team access', 'No per-seat pricing', 'boolean', 6)
) AS t(slug, name, benefit_framing, description, feature_type, display_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_framing = EXCLUDED.benefit_framing,
  description = EXCLUDED.description;

-- Now map features to competitors
-- We'll use a temp table approach to make this cleaner

-- First, let's create the competitor feature mappings
-- Format: competitor_slug, feature_slug, has_feature, is_limited

DO $$
DECLARE
  v_competitor_id uuid;
  v_feature_id uuid;
BEGIN
  -- BIRDEYE (enterprise, has most features but expensive)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'birdeye';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  -- Birdeye exceptions - things they DON'T have or are limited
  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('transparent-pricing', 'smb-affordable', 'no-contracts', 'unlimited-users', 'nfc-tap-reviews'));

  -- PODIUM (strong on messaging, expensive)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'podium';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('transparent-pricing', 'smb-affordable', 'no-contracts', 'local-rank-tracking', 'citation-management', 'competitor-benchmarking', 'nfc-tap-reviews'));

  -- NICEJOB (good SMB option, some limitations)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'nicejob';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('local-rank-tracking', 'citation-management', 'listing-sync', 'pos-integrations', 'competitor-benchmarking', 'white-label-reports', 'nfc-tap-reviews', 'gbp-posting'));

  UPDATE competitor_features SET is_limited = true
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('api-access', 'webhooks'));

  -- GATHERUP (solid mid-market)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'gatherup';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('local-rank-tracking', 'citation-management', 'listing-sync', 'pos-integrations', 'nfc-tap-reviews', 'gbp-posting', 'unlimited-users'));

  -- GRADE.US (agency focused)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'grade-us';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('local-rank-tracking', 'citation-management', 'listing-sync', 'pos-integrations', 'ai-responses', 'sentiment-analysis', 'competitor-benchmarking', 'nfc-tap-reviews', 'gbp-posting', 'gbp-integration'));

  -- BRIGHTLOCAL (SEO focused, reviews secondary)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'brightlocal';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('sms-review-requests', 'review-automation', 'review-filtering', 'ai-responses', 'social-sharing', 'pos-integrations', 'crm-integrations', 'nfc-tap-reviews', 'gbp-posting', 'unlimited-review-requests'));

  UPDATE competitor_features SET is_limited = true
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('email-review-requests', 'review-widgets'));

  -- REPUTATION.COM (enterprise only)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'reputation-com';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, true, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = true, is_limited = false;
  END LOOP;

  UPDATE competitor_features SET has_feature = false
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('transparent-pricing', 'smb-affordable', 'no-contracts', 'free-trial', 'nfc-tap-reviews', 'unlimited-users'));

  -- WHITESPARK (local SEO focused)
  SELECT id INTO v_competitor_id FROM competitors WHERE slug = 'whitespark';

  FOR v_feature_id IN SELECT id FROM comparison_features LOOP
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited)
    VALUES (v_competitor_id, v_feature_id, false, false)
    ON CONFLICT (competitor_id, feature_id) DO UPDATE SET has_feature = false, is_limited = false;
  END LOOP;

  -- Whitespark HAS these (they're SEO focused)
  UPDATE competitor_features SET has_feature = true
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN (
    'local-rank-tracking', 'citation-management', 'listing-sync', 'gbp-integration',
    'review-monitoring', 'analytics-dashboard', 'competitor-benchmarking', 'custom-reports',
    'free-trial', 'no-contracts', 'transparent-pricing', 'smb-affordable'
  ));

  -- Limited features for Whitespark
  UPDATE competitor_features SET has_feature = true, is_limited = true
  WHERE competitor_id = v_competitor_id
  AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('email-review-requests', 'review-widgets'));

END $$;
