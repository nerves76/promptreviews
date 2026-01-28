-- Recovery migration: Restore questions from llm_visibility_checks table
-- The batch run stored questions in this table, so we can recover them

-- First, let's see what we're working with (this will show in migration logs)
DO $$
DECLARE
    checks_count INTEGER;
    questions_count INTEGER;
BEGIN
    SELECT count(*) INTO checks_count FROM llm_visibility_checks;
    SELECT count(*) INTO questions_count FROM keyword_questions;
    RAISE NOTICE 'LLM visibility checks: %, Keyword questions: %', checks_count, questions_count;
END $$;

-- Restore questions from llm_visibility_checks to keyword_questions
-- Only insert if the question doesn't already exist for that keyword
INSERT INTO keyword_questions (keyword_id, question, funnel_stage, added_at, created_at, updated_at)
SELECT DISTINCT ON (lvc.keyword_id, lvc.question)
    lvc.keyword_id,
    lvc.question,
    'middle' as funnel_stage,  -- Default to middle since we don't have the original funnel stage
    lvc.checked_at as added_at,
    NOW() as created_at,
    NOW() as updated_at
FROM llm_visibility_checks lvc
WHERE lvc.keyword_id IS NOT NULL
  AND lvc.question IS NOT NULL
  AND lvc.question != ''
  -- Don't insert if it looks like corrupted JSON
  AND lvc.question NOT LIKE '{%"question"%'
  -- Don't insert if already exists
  AND NOT EXISTS (
    SELECT 1 FROM keyword_questions kq
    WHERE kq.keyword_id = lvc.keyword_id
      AND kq.question = lvc.question
  )
ORDER BY lvc.keyword_id, lvc.question, lvc.checked_at DESC;

-- Also restore to the JSONB column for backup
-- First, aggregate questions per keyword from the checks table
WITH recovered_questions AS (
    SELECT
        keyword_id,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'question', question,
                'funnelStage', 'middle',
                'addedAt', checked_at::text
            )
        ) as questions
    FROM llm_visibility_checks
    WHERE keyword_id IS NOT NULL
      AND question IS NOT NULL
      AND question != ''
      AND question NOT LIKE '{%"question"%'
    GROUP BY keyword_id
)
UPDATE keywords k
SET related_questions = rq.questions,
    updated_at = NOW()
FROM recovered_questions rq
WHERE k.id = rq.keyword_id
  AND (k.related_questions IS NULL OR jsonb_array_length(k.related_questions) = 0);

-- Log recovery results
DO $$
DECLARE
    questions_count INTEGER;
BEGIN
    SELECT count(*) INTO questions_count FROM keyword_questions;
    RAISE NOTICE 'Keyword questions after recovery: %', questions_count;
END $$;
