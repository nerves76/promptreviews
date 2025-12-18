-- Migration: Add funnel stage support to related_questions
-- Changes related_questions from text[] to jsonb array with structure:
-- [{ question: string, funnelStage: 'top' | 'middle' | 'bottom', addedAt: string }]

-- First, add a new column for the JSONB data
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS related_questions_v2 jsonb DEFAULT '[]'::jsonb;

-- Migrate existing data from text array to JSONB array with default 'middle' funnel stage
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
  FROM unnest(related_questions) AS q
)
WHERE related_questions IS NOT NULL
  AND array_length(related_questions, 1) > 0;

-- Drop the old column
ALTER TABLE keywords DROP COLUMN IF EXISTS related_questions;

-- Rename the new column to the original name
ALTER TABLE keywords RENAME COLUMN related_questions_v2 TO related_questions;

-- Add a GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_keywords_related_questions
ON keywords USING GIN (related_questions jsonb_path_ops);

-- Add a comment explaining the structure
COMMENT ON COLUMN keywords.related_questions IS 'JSONB array of related questions with funnel stage. Structure: [{ question: string, funnelStage: "top" | "middle" | "bottom", addedAt: string }]';
