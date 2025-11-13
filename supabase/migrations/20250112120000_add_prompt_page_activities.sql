-- Create activity_type enum
CREATE TYPE activity_type AS ENUM ('email', 'sms', 'status_change', 'note', 'manual');

-- Create prompt_page_activities table
CREATE TABLE IF NOT EXISTS prompt_page_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_page_id UUID NOT NULL REFERENCES prompt_pages(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_page_activities_prompt_page_id
  ON prompt_page_activities(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_prompt_page_activities_account_id
  ON prompt_page_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_page_activities_created_at
  ON prompt_page_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_page_activities_activity_type
  ON prompt_page_activities(activity_type);

-- Add RLS policies
ALTER TABLE prompt_page_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities for their account's prompt pages
CREATE POLICY "Users can view activities for their account"
  ON prompt_page_activities
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM account_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create activities for their account's prompt pages
CREATE POLICY "Users can create activities for their account"
  ON prompt_page_activities
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id
      FROM account_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON prompt_page_activities
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON prompt_page_activities
  FOR DELETE
  USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_prompt_page_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_page_activities_updated_at
  BEFORE UPDATE ON prompt_page_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_page_activities_updated_at();

-- Migrate existing notes to activities
-- Note: We don't have a created_by field in prompt_pages, so these will have NULL created_by
INSERT INTO prompt_page_activities (
  prompt_page_id,
  contact_id,
  account_id,
  activity_type,
  content,
  created_at
)
SELECT
  pp.id as prompt_page_id,
  pp.contact_id,
  pp.account_id,
  'note'::activity_type,
  pp.notes as content,
  pp.created_at
FROM prompt_pages pp
WHERE pp.notes IS NOT NULL
  AND pp.notes != '';

-- Add comment
COMMENT ON TABLE prompt_page_activities IS 'Activity log for prompt pages including notes, communications, and status changes';
