-- ============================================
-- KEYWORD ROTATION SETTINGS
-- Add rotation configuration to prompt_pages
-- ============================================

-- Add rotation settings columns to prompt_pages
ALTER TABLE prompt_pages
  ADD COLUMN IF NOT EXISTS keyword_auto_rotate_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS keyword_auto_rotate_threshold INTEGER DEFAULT 16,
  ADD COLUMN IF NOT EXISTS keyword_active_pool_size INTEGER DEFAULT 10;

-- Add comment explaining the columns
COMMENT ON COLUMN prompt_pages.keyword_auto_rotate_enabled IS 'Whether to automatically rotate overused keywords';
COMMENT ON COLUMN prompt_pages.keyword_auto_rotate_threshold IS 'Usage count at which a keyword should be rotated (default: 16)';
COMMENT ON COLUMN prompt_pages.keyword_active_pool_size IS 'Maximum number of keywords in the active pool (default: 10)';

-- Update keyword_prompt_page_usage to track rotation history
ALTER TABLE keyword_prompt_page_usage
  ADD COLUMN IF NOT EXISTS rotated_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rotated_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rotation_count INTEGER DEFAULT 0;

COMMENT ON COLUMN keyword_prompt_page_usage.rotated_out_at IS 'When the keyword was last moved to reserve';
COMMENT ON COLUMN keyword_prompt_page_usage.rotated_in_at IS 'When the keyword was last moved to active pool';
COMMENT ON COLUMN keyword_prompt_page_usage.rotation_count IS 'Number of times this keyword has been rotated';

-- Create keyword_rotation_log table for audit trail
CREATE TABLE IF NOT EXISTS keyword_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  prompt_page_id UUID NOT NULL REFERENCES prompt_pages(id) ON DELETE CASCADE,

  -- The rotation event
  rotated_out_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  rotated_in_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,

  -- Context
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('auto', 'manual')),
  usage_count_at_rotation INTEGER,
  threshold_at_rotation INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for keyword_rotation_log
CREATE INDEX IF NOT EXISTS idx_krl_account ON keyword_rotation_log(account_id);
CREATE INDEX IF NOT EXISTS idx_krl_prompt_page ON keyword_rotation_log(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_krl_created_at ON keyword_rotation_log(created_at DESC);

-- RLS for keyword_rotation_log
ALTER TABLE keyword_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's rotation logs"
  ON keyword_rotation_log FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create rotation logs for their accounts"
  ON keyword_rotation_log FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Service role can do anything
CREATE POLICY "Service role bypass for rotation logs"
  ON keyword_rotation_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create view for rotation status per prompt page
CREATE OR REPLACE VIEW keyword_rotation_status AS
SELECT
  kppu.prompt_page_id,
  kppu.account_id,
  pp.keyword_auto_rotate_enabled,
  pp.keyword_auto_rotate_threshold,
  pp.keyword_active_pool_size,
  COUNT(*) FILTER (WHERE kppu.is_in_active_pool = true) AS active_pool_count,
  COUNT(*) FILTER (WHERE kppu.is_in_active_pool = false) AS reserve_pool_count,
  COUNT(*) FILTER (WHERE kppu.is_in_active_pool = true AND k.review_usage_count >= pp.keyword_auto_rotate_threshold) AS overused_active_count,
  COUNT(*) FILTER (WHERE kppu.is_in_active_pool = false AND k.review_usage_count < pp.keyword_auto_rotate_threshold) AS available_reserve_count
FROM keyword_prompt_page_usage kppu
JOIN prompt_pages pp ON pp.id = kppu.prompt_page_id
JOIN keywords k ON k.id = kppu.keyword_id
GROUP BY kppu.prompt_page_id, kppu.account_id, pp.keyword_auto_rotate_enabled, pp.keyword_auto_rotate_threshold, pp.keyword_active_pool_size;

COMMENT ON VIEW keyword_rotation_status IS 'Aggregated rotation status for each prompt page';
