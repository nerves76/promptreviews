-- GBP Profile Protection Feature
-- Monitors Google Business Profile locations for unwanted changes made by Google
-- Available for Builder and Maven tiers only

-- Table 1: gbp_location_snapshots
-- Stores baseline state of location data for comparison
CREATE TABLE IF NOT EXISTS gbp_location_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT,
  -- Tracked fields (stored as current state)
  title TEXT,
  address JSONB,
  phone TEXT,
  website TEXT,
  hours JSONB,
  description TEXT,
  categories JSONB,
  -- Metadata
  snapshot_hash TEXT,  -- Quick comparison hash of all fields
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active snapshot per location per account
  UNIQUE(account_id, location_id)
);

-- Indexes for gbp_location_snapshots
CREATE INDEX IF NOT EXISTS idx_gbp_snapshots_account ON gbp_location_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_gbp_snapshots_location ON gbp_location_snapshots(location_id);

-- Table 2: gbp_change_alerts
-- Detected changes that are pending user review
CREATE TABLE IF NOT EXISTS gbp_change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT,
  -- Change details
  field_changed TEXT NOT NULL,  -- 'hours', 'address', 'phone', 'website', 'title', 'description', 'categories'
  old_value JSONB,
  new_value JSONB,
  change_source TEXT DEFAULT 'google',  -- 'google' or 'owner'
  -- Status tracking
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  -- Notification tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure valid status values
  CONSTRAINT gbp_alerts_valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Indexes for gbp_change_alerts
CREATE INDEX IF NOT EXISTS idx_gbp_alerts_account ON gbp_change_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_gbp_alerts_status ON gbp_change_alerts(status);
CREATE INDEX IF NOT EXISTS idx_gbp_alerts_location ON gbp_change_alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_gbp_alerts_pending ON gbp_change_alerts(account_id, status) WHERE status = 'pending';

-- Table 3: gbp_protection_settings
-- Per-account protection preferences
CREATE TABLE IF NOT EXISTS gbp_protection_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'immediate',  -- 'immediate', 'daily', 'weekly'
  auto_reject_enabled BOOLEAN DEFAULT FALSE,  -- Future feature
  protected_fields TEXT[] DEFAULT ARRAY['hours', 'address', 'phone', 'website', 'title', 'description'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure valid notification frequency
  CONSTRAINT gbp_settings_valid_frequency CHECK (notification_frequency IN ('immediate', 'daily', 'weekly'))
);

-- Index for gbp_protection_settings
CREATE INDEX IF NOT EXISTS idx_gbp_protection_settings_account ON gbp_protection_settings(account_id);

-- RLS Policies for gbp_location_snapshots
ALTER TABLE gbp_location_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots for their accounts"
  ON gbp_location_snapshots FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert snapshots for their accounts"
  ON gbp_location_snapshots FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update snapshots for their accounts"
  ON gbp_location_snapshots FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete snapshots for their accounts"
  ON gbp_location_snapshots FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for gbp_change_alerts
ALTER TABLE gbp_change_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their accounts"
  ON gbp_change_alerts FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alerts for their accounts"
  ON gbp_change_alerts FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alerts for their accounts"
  ON gbp_change_alerts FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete alerts for their accounts"
  ON gbp_change_alerts FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for gbp_protection_settings
ALTER TABLE gbp_protection_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settings for their accounts"
  ON gbp_protection_settings FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert settings for their accounts"
  ON gbp_protection_settings FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update settings for their accounts"
  ON gbp_protection_settings FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete settings for their accounts"
  ON gbp_protection_settings FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE gbp_location_snapshots IS 'Stores baseline state of GBP location data for change detection';
COMMENT ON TABLE gbp_change_alerts IS 'Pending or resolved change alerts detected by the protection system';
COMMENT ON TABLE gbp_protection_settings IS 'Per-account settings for GBP profile protection feature';

COMMENT ON COLUMN gbp_location_snapshots.snapshot_hash IS 'MD5 hash of tracked fields for quick change detection';
COMMENT ON COLUMN gbp_change_alerts.field_changed IS 'The specific field that was modified: hours, address, phone, website, title, description, categories';
COMMENT ON COLUMN gbp_change_alerts.change_source IS 'Source of the change: google (suggested by Google) or owner (made by profile owner)';
COMMENT ON COLUMN gbp_protection_settings.notification_frequency IS 'How often to send alerts: immediate, daily digest, or weekly digest';
COMMENT ON COLUMN gbp_protection_settings.protected_fields IS 'Array of field names to monitor for changes';
