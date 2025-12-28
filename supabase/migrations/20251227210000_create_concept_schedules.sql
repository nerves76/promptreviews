-- ============================================================================
-- Create concept_schedules table for unified concept-level scheduling
-- Allows scheduling all check types (search rank, geo-grid, LLM) from one place
-- ============================================================================

CREATE TABLE IF NOT EXISTS concept_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Schedule settings (reuses existing pattern)
  schedule_frequency VARCHAR(20) CHECK (schedule_frequency IS NULL OR schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INTEGER CHECK (schedule_day_of_week IS NULL OR (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6)),
  schedule_day_of_month INTEGER CHECK (schedule_day_of_month IS NULL OR (schedule_day_of_month >= 1 AND schedule_day_of_month <= 28)),
  schedule_hour INTEGER NOT NULL DEFAULT 9 CHECK (schedule_hour >= 0 AND schedule_hour <= 23),

  -- Check type toggles
  search_rank_enabled BOOLEAN NOT NULL DEFAULT true,
  geo_grid_enabled BOOLEAN NOT NULL DEFAULT true,
  llm_visibility_enabled BOOLEAN NOT NULL DEFAULT true,

  -- LLM-specific settings
  llm_providers TEXT[] NOT NULL DEFAULT ARRAY['chatgpt', 'claude', 'gemini', 'perplexity'],

  -- Cached cost for UI display (updated when schedule is saved)
  estimated_credits INTEGER NOT NULL DEFAULT 0,

  -- Scheduling state
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  next_scheduled_at TIMESTAMPTZ,
  last_scheduled_run_at TIMESTAMPTZ,
  last_credit_warning_sent_at TIMESTAMPTZ,

  -- Override tracking (stores IDs of paused individual schedules)
  paused_llm_schedule_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each keyword can only have one concept schedule per account
  UNIQUE(account_id, keyword_id)
);

-- ============================================================================
-- Indexes for efficient queries
-- ============================================================================

-- Index for cron job to find due schedules quickly
CREATE INDEX IF NOT EXISTS idx_concept_schedules_next_scheduled
  ON concept_schedules (next_scheduled_at)
  WHERE is_enabled = true AND schedule_frequency IS NOT NULL;

-- Index for finding schedules by account
CREATE INDEX IF NOT EXISTS idx_concept_schedules_account
  ON concept_schedules (account_id);

-- Index for finding schedule by keyword
CREATE INDEX IF NOT EXISTS idx_concept_schedules_keyword
  ON concept_schedules (keyword_id);

-- ============================================================================
-- Trigger to auto-update next_scheduled_at when schedule changes
-- Reuses the existing calculate_next_scheduled_at() function from geo-grid
-- ============================================================================

CREATE OR REPLACE FUNCTION update_concept_schedule_next_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_concept_schedule_next_scheduled_at ON concept_schedules;
CREATE TRIGGER trg_update_concept_schedule_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON concept_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_concept_schedule_next_scheduled_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE concept_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access schedules for accounts they belong to
CREATE POLICY concept_schedules_account_access ON concept_schedules
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role has full access (for cron jobs)
CREATE POLICY concept_schedules_service_access ON concept_schedules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Add email template for concept schedule credit warnings
-- ============================================================================

INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'concept_schedule_credit_warning',
  'Action Required: Low Credits for Upcoming Concept Checks',
  E'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">Low Credit Balance</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #856404;">
        Your scheduled concept check for <strong>{{conceptName}}</strong> needs <strong>{{required}} credits</strong> but you only have <strong>{{available}} credits</strong>.
      </p>
    </div>

    <p>Your next concept check is scheduled for <strong>{{scheduledFor}}</strong>. Without enough credits, the check will be skipped.</p>

    <p><strong>Enabled checks:</strong></p>
    <ul>
      {{#if searchRankEnabled}}<li>Search rank tracking</li>{{/if}}
      {{#if geoGridEnabled}}<li>Local ranking grid</li>{{/if}}
      {{#if llmEnabled}}<li>LLM visibility</li>{{/if}}
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>{{year}} PromptReviews. All rights reserved.</p>
  </div>
</body>
</html>',
  E'Hi {{firstName}},

LOW CREDIT BALANCE

Your scheduled concept check for {{conceptName}} needs {{required}} credits but you only have {{available}} credits.

Your next concept check is scheduled for {{scheduledFor}}. Without enough credits, the check will be skipped.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

{{year}} PromptReviews',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();
