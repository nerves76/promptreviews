-- Add usage tracking for keyword suggestions (Discover keywords feature)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS keyword_suggestions_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS keyword_suggestions_last_reset_date DATE;
