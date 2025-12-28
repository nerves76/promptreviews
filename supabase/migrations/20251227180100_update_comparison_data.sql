-- Update comparison data with accurate 2025 pricing and features

-- Update pricing to accurate 2025 values
UPDATE competitors SET pricing = '{"Starter": {"price": 299, "period": "month"}, "Growth": {"price": 349, "period": "month"}, "Dominate": {"price": 399, "period": "month"}}' WHERE slug = 'birdeye';
UPDATE competitors SET pricing = '{"Core": {"price": 349, "period": "month"}, "Pro": {"price": 599, "period": "month"}}' WHERE slug = 'podium';
UPDATE competitors SET pricing = '{"Reviews": {"price": 75, "period": "month"}, "Pro": {"price": 125, "period": "month"}}' WHERE slug = 'nicejob';
UPDATE competitors SET pricing = '{"Starter": {"price": 99, "period": "month"}, "Professional": {"price": 199, "period": "month"}}' WHERE slug = 'gatherup';
UPDATE competitors SET pricing = '{"Solo": {"price": 110, "period": "month"}, "Professional": {"price": 180, "period": "month"}, "Agency": {"price": 400, "period": "month"}}' WHERE slug = 'grade-us';
UPDATE competitors SET pricing = '{"Track": {"price": 39, "period": "month"}, "Manage": {"price": 49, "period": "month"}, "Grow": {"price": 59, "period": "month"}}' WHERE slug = 'brightlocal';
UPDATE competitors SET pricing = '{"Enterprise": {"price": 500, "period": "month"}}' WHERE slug = 'reputation-com';
UPDATE competitors SET pricing = '{"Rank Tracker": {"price": 25, "period": "month"}, "Citation Finder": {"price": 39, "period": "month"}, "Reputation Builder": {"price": 79, "period": "month"}}' WHERE slug = 'whitespark';

-- Fix BrightLocal features - they DO have SMS (via credits) and email review requests
UPDATE competitor_features SET has_feature = true, is_limited = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'brightlocal')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('sms-review-requests', 'email-review-requests'));

-- Fix BrightLocal - they DO have review automation
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'brightlocal')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'review-automation');

-- Fix Whitespark - they DO have SMS and email review requests via Reputation Builder
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'whitespark')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('sms-review-requests', 'email-review-requests', 'review-automation', 'review-filtering', 'review-response', 'negative-alerts', 'review-reports'));

-- Whitespark has limited SMS (300/mo on base plan)
UPDATE competitor_features SET is_limited = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'whitespark')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'sms-review-requests');

-- Fix Grade.us - they DO have review widgets
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'grade-us')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'review-widgets');

-- Podium is known for transparent pricing issues and contracts
UPDATE competitor_features SET has_feature = false
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'podium')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug IN ('transparent-pricing', 'unlimited-users'));

-- NiceJob - confirm they have AI responses on Pro plan
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'nicejob')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'ai-responses');

-- GatherUp has AI responses
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'gatherup')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'ai-responses');

-- Birdeye does have transparent pricing now (on website)
UPDATE competitor_features SET has_feature = true
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'birdeye')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'transparent-pricing');

-- Birdeye still not SMB affordable (starts at $299/mo)
UPDATE competitor_features SET has_feature = false
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'birdeye')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'smb-affordable');

-- All competitors - verify free trial status
-- Birdeye: Yes, Podium: Yes, NiceJob: Yes (14 day), GatherUp: Yes (14 day),
-- Grade.us: Yes (14 day), BrightLocal: Yes (14 day), Reputation.com: No, Whitespark: Yes
UPDATE competitor_features SET has_feature = true
WHERE competitor_id IN (SELECT id FROM competitors WHERE slug IN ('birdeye', 'podium', 'nicejob', 'gatherup', 'grade-us', 'brightlocal', 'whitespark'))
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'free-trial');

UPDATE competitor_features SET has_feature = false
WHERE competitor_id = (SELECT id FROM competitors WHERE slug = 'reputation-com')
AND feature_id IN (SELECT id FROM comparison_features WHERE slug = 'free-trial');
