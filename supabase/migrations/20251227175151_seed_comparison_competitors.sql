-- Seed comparison competitors
-- These are the main competitors for PromptReviews comparison tables

INSERT INTO competitors (slug, name, website_url, status, pricing, display_order) VALUES
  ('birdeye', 'Birdeye', 'https://birdeye.com', 'active', '{"Pro": {"price": 299, "period": "month"}}', 1),
  ('podium', 'Podium', 'https://podium.com', 'active', '{"Essentials": {"price": 249, "period": "month"}}', 2),
  ('nicejob', 'NiceJob', 'https://nicejob.com', 'active', '{"Grow": {"price": 75, "period": "month"}}', 3),
  ('gatherup', 'GatherUp', 'https://gatherup.com', 'active', '{"Starter": {"price": 99, "period": "month"}}', 4),
  ('grade-us', 'Grade.us', 'https://grade.us', 'active', '{"Solo": {"price": 90, "period": "month"}}', 5),
  ('brightlocal', 'BrightLocal', 'https://brightlocal.com', 'active', '{"Single": {"price": 39, "period": "month"}}', 6),
  ('reputation-com', 'Reputation.com', 'https://reputation.com', 'active', '{"Enterprise": {"price": 500, "period": "month"}}', 7),
  ('whitespark', 'Whitespark', 'https://whitespark.ca', 'active', '{"Small Biz": {"price": 39, "period": "month"}}', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  website_url = EXCLUDED.website_url,
  pricing = EXCLUDED.pricing,
  display_order = EXCLUDED.display_order;
