-- Add pricing rule for keyword enrichment feature
-- Cost: 1 credit per keyword concept AI enrichment

INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active) VALUES
  ('keyword_enrichment', 'default', 1, 'AI-powered keyword concept enrichment: 1 credit', true)
ON CONFLICT (feature_type, rule_key, active_from) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
