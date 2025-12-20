-- Migration: Add credit pricing for AI Generate 10 keyword concepts
-- Cost: 5 credits per generation

INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active)
SELECT 'keyword_finder', 'generate_10', 5, 'AI Generate 10 keyword concepts', true
WHERE NOT EXISTS (
  SELECT 1 FROM credit_pricing_rules 
  WHERE feature_type = 'keyword_finder' AND rule_key = 'generate_10'
);
