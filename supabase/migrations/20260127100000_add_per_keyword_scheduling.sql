-- ============================================================================
-- Add per-keyword scheduling columns to gg_tracked_keywords
-- Allows each keyword to have its own schedule or inherit from config
-- ============================================================================

-- Add schedule mode column
ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS schedule_mode VARCHAR(20) DEFAULT 'inherit';
-- 'inherit' = use config schedule, 'custom' = own schedule, 'off' = manual only

-- Add scheduling configuration columns (same as gg_configs)
ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS schedule_frequency VARCHAR(20) DEFAULT NULL;
-- Values: 'daily', 'weekly', 'monthly', NULL (only used when schedule_mode = 'custom')

ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS schedule_day_of_week INTEGER DEFAULT NULL;
-- 0=Sunday, 1=Monday, ..., 6=Saturday (for weekly schedules)

ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS schedule_day_of_month INTEGER DEFAULT NULL;
-- 1-28 (for monthly schedules)

ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS schedule_hour INTEGER DEFAULT 9;
-- Hour to run in UTC (0-23, default 9am UTC)

ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMPTZ DEFAULT NULL;
-- Pre-calculated next run time for custom schedules

ALTER TABLE gg_tracked_keywords ADD COLUMN IF NOT EXISTS last_scheduled_run_at TIMESTAMPTZ DEFAULT NULL;
-- Track when cron last ran this keyword

-- Add check constraints
ALTER TABLE gg_tracked_keywords DROP CONSTRAINT IF EXISTS gg_tracked_keywords_schedule_mode_check;
ALTER TABLE gg_tracked_keywords ADD CONSTRAINT gg_tracked_keywords_schedule_mode_check
  CHECK (schedule_mode IN ('inherit', 'custom', 'off'));

ALTER TABLE gg_tracked_keywords DROP CONSTRAINT IF EXISTS gg_tracked_keywords_schedule_frequency_check;
ALTER TABLE gg_tracked_keywords ADD CONSTRAINT gg_tracked_keywords_schedule_frequency_check
  CHECK (schedule_frequency IS NULL OR schedule_frequency IN ('daily', 'weekly', 'monthly'));

ALTER TABLE gg_tracked_keywords DROP CONSTRAINT IF EXISTS gg_tracked_keywords_schedule_day_of_week_check;
ALTER TABLE gg_tracked_keywords ADD CONSTRAINT gg_tracked_keywords_schedule_day_of_week_check
  CHECK (schedule_day_of_week IS NULL OR (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6));

ALTER TABLE gg_tracked_keywords DROP CONSTRAINT IF EXISTS gg_tracked_keywords_schedule_day_of_month_check;
ALTER TABLE gg_tracked_keywords ADD CONSTRAINT gg_tracked_keywords_schedule_day_of_month_check
  CHECK (schedule_day_of_month IS NULL OR (schedule_day_of_month >= 1 AND schedule_day_of_month <= 28));

ALTER TABLE gg_tracked_keywords DROP CONSTRAINT IF EXISTS gg_tracked_keywords_schedule_hour_check;
ALTER TABLE gg_tracked_keywords ADD CONSTRAINT gg_tracked_keywords_schedule_hour_check
  CHECK (schedule_hour IS NULL OR (schedule_hour >= 0 AND schedule_hour <= 23));

-- Create index for efficient cron queries on custom-scheduled keywords
CREATE INDEX IF NOT EXISTS idx_gg_tracked_keywords_next_scheduled
  ON gg_tracked_keywords (next_scheduled_at)
  WHERE schedule_mode = 'custom' AND is_enabled = true;

-- ============================================================================
-- Trigger to auto-update next_scheduled_at when keyword schedule changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_keyword_next_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.schedule_mode = 'custom' AND NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
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

DROP TRIGGER IF EXISTS trg_update_keyword_next_scheduled_at ON gg_tracked_keywords;
CREATE TRIGGER trg_update_keyword_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_mode, schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON gg_tracked_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_next_scheduled_at();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN gg_tracked_keywords.schedule_mode IS 'inherit = use config schedule, custom = own schedule, off = manual only';
COMMENT ON COLUMN gg_tracked_keywords.schedule_frequency IS 'Daily/weekly/monthly for custom schedules only';
COMMENT ON COLUMN gg_tracked_keywords.next_scheduled_at IS 'Pre-calculated next run time for custom schedules';
