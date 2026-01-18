-- Enable RLS on analysis batch tables
-- These tables were created without RLS policies

-- Enable RLS on analysis_batch_runs
ALTER TABLE analysis_batch_runs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analysis_batch_run_items
ALTER TABLE analysis_batch_run_items ENABLE ROW LEVEL SECURITY;

-- Policies for analysis_batch_runs
-- Users can view batch runs for accounts they belong to
CREATE POLICY "Users can view their account batch runs"
  ON analysis_batch_runs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Users can create batch runs for accounts they belong to
CREATE POLICY "Users can create batch runs for their accounts"
  ON analysis_batch_runs
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Users can update batch runs for accounts they belong to
CREATE POLICY "Users can update their account batch runs"
  ON analysis_batch_runs
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Users can delete batch runs for accounts they belong to
CREATE POLICY "Users can delete their account batch runs"
  ON analysis_batch_runs
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policies for analysis_batch_run_items
-- Users can view items for batch runs they have access to
CREATE POLICY "Users can view their batch run items"
  ON analysis_batch_run_items
  FOR SELECT
  USING (
    batch_run_id IN (
      SELECT id FROM analysis_batch_runs
      WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create items for batch runs they have access to
CREATE POLICY "Users can create batch run items"
  ON analysis_batch_run_items
  FOR INSERT
  WITH CHECK (
    batch_run_id IN (
      SELECT id FROM analysis_batch_runs
      WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update items for batch runs they have access to
CREATE POLICY "Users can update their batch run items"
  ON analysis_batch_run_items
  FOR UPDATE
  USING (
    batch_run_id IN (
      SELECT id FROM analysis_batch_runs
      WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete items for batch runs they have access to
CREATE POLICY "Users can delete their batch run items"
  ON analysis_batch_run_items
  FOR DELETE
  USING (
    batch_run_id IN (
      SELECT id FROM analysis_batch_runs
      WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Comments
COMMENT ON POLICY "Users can view their account batch runs" ON analysis_batch_runs IS 'Allow users to view batch runs for accounts they belong to';
COMMENT ON POLICY "Users can view their batch run items" ON analysis_batch_run_items IS 'Allow users to view items for batch runs they have access to';
