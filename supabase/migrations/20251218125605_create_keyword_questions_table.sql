-- Migration: Create keyword_questions table (normalized approach)
-- This replaces the JSONB related_questions column with a proper junction table

-- Create the keyword_questions table
CREATE TABLE IF NOT EXISTS keyword_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  question text NOT NULL,
  funnel_stage text NOT NULL DEFAULT 'middle' CHECK (funnel_stage IN ('top', 'middle', 'bottom')),
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate questions per keyword
  UNIQUE(keyword_id, question)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_keyword_questions_keyword_id ON keyword_questions(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_questions_funnel_stage ON keyword_questions(funnel_stage);

-- Add RLS policies (inherit from keywords table via join)
ALTER TABLE keyword_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view questions for keywords they have access to
CREATE POLICY "Users can view keyword questions"
  ON keyword_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN account_users au ON k.account_id = au.account_id
      WHERE k.id = keyword_questions.keyword_id
      AND au.user_id = auth.uid()
    )
  );

-- Policy: Users can insert questions for keywords they have access to
CREATE POLICY "Users can insert keyword questions"
  ON keyword_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN account_users au ON k.account_id = au.account_id
      WHERE k.id = keyword_questions.keyword_id
      AND au.user_id = auth.uid()
    )
  );

-- Policy: Users can update questions for keywords they have access to
CREATE POLICY "Users can update keyword questions"
  ON keyword_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN account_users au ON k.account_id = au.account_id
      WHERE k.id = keyword_questions.keyword_id
      AND au.user_id = auth.uid()
    )
  );

-- Policy: Users can delete questions for keywords they have access to
CREATE POLICY "Users can delete keyword questions"
  ON keyword_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN account_users au ON k.account_id = au.account_id
      WHERE k.id = keyword_questions.keyword_id
      AND au.user_id = auth.uid()
    )
  );

-- Migrate existing data from JSONB to the new table
INSERT INTO keyword_questions (keyword_id, question, funnel_stage, added_at, created_at)
SELECT
  k.id as keyword_id,
  (q->>'question')::text as question,
  COALESCE((q->>'funnelStage')::text, 'middle') as funnel_stage,
  COALESCE((q->>'addedAt')::timestamptz, k.created_at) as added_at,
  k.created_at
FROM keywords k
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(k.related_questions, '[]'::jsonb)) as q
WHERE jsonb_typeof(k.related_questions) = 'array'
  AND jsonb_array_length(k.related_questions) > 0
ON CONFLICT (keyword_id, question) DO NOTHING;

-- Add comment explaining the table
COMMENT ON TABLE keyword_questions IS 'Normalized table for keyword-related questions with funnel stage tracking. Replaces the JSONB related_questions column on keywords table.';
COMMENT ON COLUMN keyword_questions.funnel_stage IS 'Marketing funnel stage: top (awareness), middle (consideration), bottom (decision)';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_keyword_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keyword_questions_updated_at
  BEFORE UPDATE ON keyword_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_questions_updated_at();
