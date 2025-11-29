-- Keyword Analysis Runs Table
-- Stores historical snapshots of keyword mention analysis

CREATE TABLE IF NOT EXISTS keyword_analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Analysis metadata
    review_count_analyzed INTEGER NOT NULL DEFAULT 0,
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,

    -- Keywords analyzed (snapshot at time of analysis)
    keywords_analyzed TEXT[] NOT NULL DEFAULT '{}',

    -- Results stored as JSONB for flexibility
    -- Structure: { keyword: string, mentionCount: number, reviewIds: string[], excerpts: { reviewId: string, excerpt: string }[] }[]
    results_json JSONB NOT NULL DEFAULT '[]',

    -- Summary stats
    total_mentions INTEGER NOT NULL DEFAULT 0,
    keywords_with_mentions INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_keyword_analysis_runs_account_id ON keyword_analysis_runs(account_id);
CREATE INDEX idx_keyword_analysis_runs_run_date ON keyword_analysis_runs(run_date DESC);
CREATE INDEX idx_keyword_analysis_runs_account_date ON keyword_analysis_runs(account_id, run_date DESC);

-- RLS Policies
ALTER TABLE keyword_analysis_runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's analysis runs
CREATE POLICY "Users can view own account keyword analysis runs"
    ON keyword_analysis_runs
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Users can insert analysis runs for their own accounts
CREATE POLICY "Users can insert own account keyword analysis runs"
    ON keyword_analysis_runs
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own account's analysis runs
CREATE POLICY "Users can delete own account keyword analysis runs"
    ON keyword_analysis_runs
    FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Add usage tracking columns to accounts table
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS keyword_analyses_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS keyword_last_reset_date DATE;

COMMENT ON TABLE keyword_analysis_runs IS 'Stores historical keyword mention analysis results for tracking trends over time';
COMMENT ON COLUMN keyword_analysis_runs.results_json IS 'Array of keyword results: [{ keyword, mentionCount, reviewIds, excerpts }]';
