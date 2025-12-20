-- Migration: Add funnel stage support to related_questions
-- Creates related_questions as JSONB array with structure:
-- [{ question: string, funnelStage: 'top' | 'middle' | 'bottom', addedAt: string }]

-- Add related_questions column if it doesn't exist
DO $$
BEGIN
  -- Check if related_questions column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'related_questions'
  ) THEN
    -- Column doesn't exist, create it as JSONB
    ALTER TABLE keywords ADD COLUMN related_questions jsonb DEFAULT '[]'::jsonb;
  ELSE
    -- Column exists, check if it's text[] and needs migration
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'keywords'
        AND column_name = 'related_questions'
        AND data_type = 'ARRAY'
    ) THEN
      -- It's a text array, migrate to JSONB
      ALTER TABLE keywords ADD COLUMN related_questions_v2 jsonb DEFAULT '[]'::jsonb;

      UPDATE keywords
      SET related_questions_v2 = (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'question', q,
              'funnelStage', 'middle',
              'addedAt', COALESCE(created_at::text, now()::text)
            )
          ),
          '[]'::jsonb
        )
        FROM unnest(related_questions::text[]) AS q
      )
      WHERE related_questions IS NOT NULL;

      ALTER TABLE keywords DROP COLUMN related_questions;
      ALTER TABLE keywords RENAME COLUMN related_questions_v2 TO related_questions;
    END IF;
    -- If it's already JSONB, nothing to do
  END IF;
END $$;

-- Add a GIN index for efficient JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_keywords_related_questions
ON keywords USING GIN (related_questions jsonb_path_ops);

-- Add a comment explaining the structure
COMMENT ON COLUMN keywords.related_questions IS 'JSONB array of related questions with funnel stage. Structure: [{ question: string, funnelStage: "top" | "middle" | "bottom", addedAt: string }]';
