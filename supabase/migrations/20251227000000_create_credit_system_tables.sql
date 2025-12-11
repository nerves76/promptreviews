-- Credit System Tables Migration
-- Creates tables for account-based credit wallet system

-- ============================================================================
-- Table: credit_balances
-- Stores current credit balance per account (denormalized for fast reads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  included_credits INTEGER NOT NULL DEFAULT 0,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  included_credits_expire_at TIMESTAMPTZ,
  last_monthly_grant_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_balances_account_unique UNIQUE (account_id),
  CONSTRAINT credit_balances_included_non_negative CHECK (included_credits >= 0),
  CONSTRAINT credit_balances_purchased_non_negative CHECK (purchased_credits >= 0)
);

-- Indexes for credit_balances
CREATE INDEX idx_credit_balances_account_id ON credit_balances(account_id);
CREATE INDEX idx_credit_balances_expire_at ON credit_balances(included_credits_expire_at);

-- ============================================================================
-- Table: credit_ledger
-- Immutable audit log of all credit transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Transaction details
  amount INTEGER NOT NULL, -- Positive for credits, negative for debits
  balance_after INTEGER NOT NULL, -- Total balance after this transaction

  -- Credit type affected
  credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('included', 'purchased')),

  -- Transaction type
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'monthly_grant',      -- Monthly included credits granted
    'monthly_expire',     -- Monthly included credits expired
    'purchase',           -- Credits purchased via Stripe
    'refund',             -- Credits refunded (Stripe refund)
    'feature_debit',      -- Credits used for a feature
    'feature_refund',     -- Credits refunded due to feature failure
    'manual_adjust',      -- Manual adjustment by admin
    'promo_grant'         -- Promotional credits granted
  )),

  -- Feature tracking (for debits)
  feature_type VARCHAR(30), -- 'geo_grid', 'keyword_tracking', 'keyword_finder', 'ai_review_gen'
  feature_metadata JSONB, -- Feature-specific data (grid_size, keyword_id, etc.)

  -- Idempotency and external references
  idempotency_key VARCHAR(255), -- Unique key to prevent duplicate transactions
  stripe_session_id VARCHAR(255), -- For purchase transactions
  stripe_invoice_id VARCHAR(255), -- For subscription/auto-topup transactions
  stripe_charge_id VARCHAR(255), -- For refund tracking

  -- Audit fields
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- NULL for system transactions
);

-- Indexes for credit_ledger
CREATE INDEX idx_credit_ledger_account_id ON credit_ledger(account_id);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at DESC);
CREATE INDEX idx_credit_ledger_transaction_type ON credit_ledger(transaction_type);
CREATE INDEX idx_credit_ledger_feature_type ON credit_ledger(feature_type);
CREATE INDEX idx_credit_ledger_stripe_session ON credit_ledger(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_credit_ledger_stripe_invoice ON credit_ledger(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Unique constraint for idempotency (allows NULL for transactions that don't need it)
CREATE UNIQUE INDEX idx_credit_ledger_idempotency ON credit_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- Table: credit_pricing_rules
-- Configurable pricing for credit-based features
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_type VARCHAR(30) NOT NULL, -- 'geo_grid', 'keyword_tracking', etc.
  rule_key VARCHAR(50) NOT NULL, -- e.g., 'base_cost', '3x3', 'daily', etc.
  credit_cost INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ, -- NULL means no expiration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_pricing_rules_unique UNIQUE (feature_type, rule_key, active_from)
);

-- Index for querying active rules
CREATE INDEX idx_credit_pricing_rules_active ON credit_pricing_rules(feature_type, is_active, active_from DESC);

-- ============================================================================
-- Table: credit_included_by_tier
-- Monthly included credits per subscription tier
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_included_by_tier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(30) NOT NULL UNIQUE, -- 'free', 'grower', 'builder', 'maven'
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Table: credit_packs
-- Available credit pack configurations (maps to Stripe prices)
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- Price in cents (e.g., 2000 = $20.00)
  stripe_price_id VARCHAR(255), -- Stripe Price ID for one-time purchase
  stripe_price_id_recurring VARCHAR(255), -- Stripe Price ID for auto-topup
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on all credit tables
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_included_by_tier ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- credit_balances: Users can only see their own account's balance
CREATE POLICY "Users can view own account credit balance"
  ON credit_balances FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- credit_ledger: Users can only see their own account's ledger
CREATE POLICY "Users can view own account credit ledger"
  ON credit_ledger FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- credit_pricing_rules: Everyone can read active pricing rules
CREATE POLICY "Anyone can view active pricing rules"
  ON credit_pricing_rules FOR SELECT
  USING (is_active = true);

-- credit_included_by_tier: Everyone can read tier credits
CREATE POLICY "Anyone can view tier credits"
  ON credit_included_by_tier FOR SELECT
  USING (true);

-- credit_packs: Everyone can read active packs
CREATE POLICY "Anyone can view active credit packs"
  ON credit_packs FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_credit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER credit_balances_updated_at
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW EXECUTE FUNCTION update_credit_updated_at();

CREATE TRIGGER credit_pricing_rules_updated_at
  BEFORE UPDATE ON credit_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_credit_updated_at();

CREATE TRIGGER credit_included_by_tier_updated_at
  BEFORE UPDATE ON credit_included_by_tier
  FOR EACH ROW EXECUTE FUNCTION update_credit_updated_at();

CREATE TRIGGER credit_packs_updated_at
  BEFORE UPDATE ON credit_packs
  FOR EACH ROW EXECUTE FUNCTION update_credit_updated_at();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE credit_balances IS 'Current credit balance per account. Denormalized for fast reads.';
COMMENT ON TABLE credit_ledger IS 'Immutable audit log of all credit transactions.';
COMMENT ON TABLE credit_pricing_rules IS 'Configurable pricing for credit-based features.';
COMMENT ON TABLE credit_included_by_tier IS 'Monthly included credits per subscription tier.';
COMMENT ON TABLE credit_packs IS 'Available credit pack configurations for purchase.';

COMMENT ON COLUMN credit_ledger.idempotency_key IS 'Unique key to prevent duplicate transactions on retries.';
COMMENT ON COLUMN credit_ledger.credit_type IS 'Whether this affects included or purchased credits.';
COMMENT ON COLUMN credit_balances.included_credits_expire_at IS 'When current included credits expire (end of billing period).';
