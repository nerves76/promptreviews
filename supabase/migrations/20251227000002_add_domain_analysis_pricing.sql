-- Add domain analysis pricing rule
-- Cost: 3 credits per analysis (covers DataForSEO tech + whois API costs with ~170% margin)

INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active)
VALUES ('domain_analysis', 'per_analysis', 3, 'Domain analysis: technology stack + whois data')
ON CONFLICT (feature_type, rule_key, active_from) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();
