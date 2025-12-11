-- Seed Credit System Data
-- Initial pricing rules, tier credits, and pack configurations

-- ============================================================================
-- Seed: credit_included_by_tier
-- Monthly included credits per subscription tier
-- ============================================================================
INSERT INTO credit_included_by_tier (tier, monthly_credits, description) VALUES
  ('free', 0, 'Free accounts receive no monthly credits'),
  ('grower', 100, 'Grower plan: 100 credits/month'),
  ('builder', 200, 'Builder plan: 200 credits/month'),
  ('maven', 400, 'Maven plan: 400 credits/month')
ON CONFLICT (tier) DO UPDATE SET
  monthly_credits = EXCLUDED.monthly_credits,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- Seed: credit_pricing_rules
-- Geo Grid pricing: 10 base + 1 per cell
-- ============================================================================

-- Geo Grid pricing: 10 base + 1 per cell + 2 per keyword
INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description) VALUES
  ('geo_grid', 'base_cost', 10, 'Base cost for any geo grid check'),
  ('geo_grid', 'cost_per_cell', 1, 'Additional cost per grid cell'),
  ('geo_grid', 'cost_per_keyword', 2, 'Additional cost per keyword tracked (2 credits each)'),
  -- Pre-calculated totals for common grid sizes with 1 keyword (for reference)
  ('geo_grid', '3x3', 21, '3x3 grid + 1 keyword: 10 base + 9 cells + 2 = 21 credits'),
  ('geo_grid', '5x5', 37, '5x5 grid + 1 keyword: 10 base + 25 cells + 2 = 37 credits'),
  ('geo_grid', '7x7', 61, '7x7 grid + 1 keyword: 10 base + 49 cells + 2 = 61 credits'),
  ('geo_grid', '9x9', 93, '9x9 grid + 1 keyword: 10 base + 81 cells + 2 = 93 credits')
ON CONFLICT (feature_type, rule_key, active_from) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- Seed: credit_pricing_rules (Future features - inactive for now)
-- ============================================================================

-- Keyword Tracking (future)
INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active) VALUES
  ('keyword_tracking', 'daily', 10, 'Daily keyword tracking: 10 credits/keyword/month', false),
  ('keyword_tracking', '3x_week', 7, '3x/week keyword tracking: 7 credits/keyword/month', false),
  ('keyword_tracking', 'weekly', 4, 'Weekly keyword tracking: 4 credits/keyword/month', false)
ON CONFLICT (feature_type, rule_key, active_from) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Keyword Finder (future)
INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active) VALUES
  ('keyword_finder', 'small_bucket', 10, 'Small review volume: 10 credits', false),
  ('keyword_finder', 'medium_bucket', 25, 'Medium review volume: 25 credits', false),
  ('keyword_finder', 'large_bucket', 50, 'Large review volume: 50 credits', false)
ON CONFLICT (feature_type, rule_key, active_from) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- Seed: credit_packs
-- Available credit pack configurations
-- Note: stripe_price_id will be updated after creating Stripe products
-- ============================================================================
-- Test mode Price IDs (for local development)
-- Production uses live mode IDs - update via SQL in production Supabase
INSERT INTO credit_packs (name, credits, price_cents, display_order, stripe_price_id, stripe_price_id_recurring) VALUES
  ('200 Credits', 200, 2000, 1, 'price_1Sch62LqwlpgZPtwESJPmPnx', NULL),
  ('700 Credits', 700, 6000, 2, 'price_1Sch6ULqwlpgZPtwsCnXauj5', NULL),
  ('2,300 Credits', 2300, 18000, 3, 'price_1Sch6YLqwlpgZPtwrPlLaKwI', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Initialize credit_balances for existing accounts
-- Creates a balance record for all accounts with 0 credits
-- Monthly grant job will populate included credits based on tier
-- ============================================================================
INSERT INTO credit_balances (account_id, included_credits, purchased_credits)
SELECT id, 0, 0
FROM accounts
WHERE deleted_at IS NULL
ON CONFLICT (account_id) DO NOTHING;
