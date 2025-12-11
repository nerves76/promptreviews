-- ============================================================================
-- Add scheduling columns to gg_configs for recurring geo-grid checks
-- ============================================================================

-- Add scheduling configuration columns
ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS schedule_frequency VARCHAR(20) DEFAULT NULL;
-- Values: 'daily', 'weekly', 'monthly', NULL (manual only)

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS schedule_day_of_week INTEGER DEFAULT NULL;
-- 0=Sunday, 1=Monday, ..., 6=Saturday (for weekly schedules)

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS schedule_day_of_month INTEGER DEFAULT NULL;
-- 1-28 (for monthly schedules, using 28 as max to avoid month-end issues)

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS schedule_hour INTEGER DEFAULT 9;
-- Hour to run in UTC (0-23, default 9am UTC)

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMPTZ DEFAULT NULL;
-- Pre-calculated next run time for efficient cron queries

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS last_scheduled_run_at TIMESTAMPTZ DEFAULT NULL;
-- Track when cron last ran this config

ALTER TABLE gg_configs ADD COLUMN IF NOT EXISTS last_credit_warning_sent_at TIMESTAMPTZ DEFAULT NULL;
-- Track when we last sent a credit warning to prevent spam

-- Add check constraint for schedule_frequency
ALTER TABLE gg_configs DROP CONSTRAINT IF EXISTS gg_configs_schedule_frequency_check;
ALTER TABLE gg_configs ADD CONSTRAINT gg_configs_schedule_frequency_check
  CHECK (schedule_frequency IS NULL OR schedule_frequency IN ('daily', 'weekly', 'monthly'));

-- Add check constraint for schedule_day_of_week
ALTER TABLE gg_configs DROP CONSTRAINT IF EXISTS gg_configs_schedule_day_of_week_check;
ALTER TABLE gg_configs ADD CONSTRAINT gg_configs_schedule_day_of_week_check
  CHECK (schedule_day_of_week IS NULL OR (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6));

-- Add check constraint for schedule_day_of_month
ALTER TABLE gg_configs DROP CONSTRAINT IF EXISTS gg_configs_schedule_day_of_month_check;
ALTER TABLE gg_configs ADD CONSTRAINT gg_configs_schedule_day_of_month_check
  CHECK (schedule_day_of_month IS NULL OR (schedule_day_of_month >= 1 AND schedule_day_of_month <= 28));

-- Add check constraint for schedule_hour
ALTER TABLE gg_configs DROP CONSTRAINT IF EXISTS gg_configs_schedule_hour_check;
ALTER TABLE gg_configs ADD CONSTRAINT gg_configs_schedule_hour_check
  CHECK (schedule_hour >= 0 AND schedule_hour <= 23);

-- Create index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_gg_configs_next_scheduled
  ON gg_configs (next_scheduled_at)
  WHERE schedule_frequency IS NOT NULL AND is_enabled = true;

-- ============================================================================
-- Add credit warning notification preferences
-- ============================================================================

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_credit_warnings BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_credit_warnings BOOLEAN DEFAULT true;

-- ============================================================================
-- Seed email templates for credit warnings
-- ============================================================================

INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'credit_warning_upcoming',
  'Action Required: Low Credits for Upcoming Geo-Grid Check',
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
        ⚠️ Your scheduled geo-grid check needs <strong>{{required}} credits</strong> but you only have <strong>{{available}} credits</strong>.
      </p>
    </div>

    <p>Your next geo-grid check is scheduled for <strong>{{scheduledFor}}</strong>. Without enough credits, the check will be skipped.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} PromptReviews. All rights reserved.</p>
  </div>
</body>
</html>',
  E'Hi {{firstName}},

⚠️ LOW CREDIT BALANCE

Your scheduled geo-grid check needs {{required}} credits but you only have {{available}} credits.

Your next geo-grid check is scheduled for {{scheduledFor}}. Without enough credits, the check will be skipped.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

© {{year}} PromptReviews',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();

INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'credit_check_skipped',
  'Geo-Grid Check Skipped - Insufficient Credits',
  E'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">Geo-Grid Check Skipped</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">
        ❌ Your scheduled geo-grid check was skipped because you don''t have enough credits.
      </p>
    </div>

    <p><strong>Required:</strong> {{required}} credits<br>
    <strong>Available:</strong> {{available}} credits</p>

    <p>To resume your scheduled geo-grid tracking, please add more credits to your account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} PromptReviews. All rights reserved.</p>
  </div>
</body>
</html>',
  E'Hi {{firstName}},

❌ GEO-GRID CHECK SKIPPED

Your scheduled geo-grid check was skipped because you don''t have enough credits.

Required: {{required}} credits
Available: {{available}} credits

To resume your scheduled geo-grid tracking, please add more credits to your account.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

© {{year}} PromptReviews',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();

-- ============================================================================
-- Function to calculate next scheduled run time
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_scheduled_at(
  p_frequency VARCHAR(20),
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_hour INTEGER,
  p_from_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_target_hour INTEGER;
  v_current_dow INTEGER;
  v_current_dom INTEGER;
  v_days_to_add INTEGER;
BEGIN
  v_target_hour := COALESCE(p_hour, 9);

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next occurrence at target hour
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      -- Next occurrence on target day of week at target hour
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Next occurrence on target day of month at target hour
      v_current_dom := EXTRACT(DAY FROM p_from_time)::INTEGER;
      v_next := DATE_TRUNC('month', p_from_time) + ((COALESCE(p_day_of_month, 1) - 1) || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 month';
      END IF;

    ELSE
      v_next := NULL;
  END CASE;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger to auto-update next_scheduled_at when schedule changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_next_scheduled_at()
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_next_scheduled_at ON gg_configs;
CREATE TRIGGER trg_update_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON gg_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_next_scheduled_at();
