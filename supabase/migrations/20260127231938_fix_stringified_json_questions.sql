-- Fix corrupted related_questions where JSON objects were accidentally stringified
-- This migration cleans up entries like '{"question":"text","funnelStage":"top"}'
-- and converts them to proper JSONB objects

-- First, let's fix the related_questions JSONB column in keywords table
DO $$
DECLARE
    keyword_record RECORD;
    question_item JSONB;
    fixed_questions JSONB[];
    needs_fix BOOLEAN;
    parsed_question JSONB;
    question_text TEXT;
    i INTEGER;
BEGIN
    -- Loop through all keywords with related_questions
    FOR keyword_record IN
        SELECT id, related_questions
        FROM keywords
        WHERE related_questions IS NOT NULL
          AND jsonb_array_length(related_questions) > 0
    LOOP
        needs_fix := FALSE;
        fixed_questions := ARRAY[]::JSONB[];

        -- Check each question in the array
        FOR i IN 0..jsonb_array_length(keyword_record.related_questions) - 1
        LOOP
            question_item := keyword_record.related_questions->i;

            -- Check if this item is a string that looks like JSON
            IF jsonb_typeof(question_item) = 'string' THEN
                question_text := question_item #>> '{}';  -- Extract string value

                -- Check if it's a stringified JSON object
                IF question_text LIKE '{%"question"%}' THEN
                    BEGIN
                        -- Try to parse the stringified JSON
                        parsed_question := question_text::JSONB;
                        fixed_questions := array_append(fixed_questions, parsed_question);
                        needs_fix := TRUE;
                        RAISE NOTICE 'Fixed stringified JSON in keyword %: %', keyword_record.id, question_text;
                    EXCEPTION WHEN OTHERS THEN
                        -- Not valid JSON, keep as string but convert to object format
                        fixed_questions := array_append(fixed_questions, jsonb_build_object(
                            'question', question_text,
                            'funnelStage', 'middle',
                            'addedAt', NOW()::TEXT
                        ));
                        needs_fix := TRUE;
                    END;
                ELSE
                    -- Plain string question, convert to object format
                    fixed_questions := array_append(fixed_questions, jsonb_build_object(
                        'question', question_text,
                        'funnelStage', 'middle',
                        'addedAt', NOW()::TEXT
                    ));
                    needs_fix := TRUE;
                END IF;
            ELSE
                -- Already an object, keep as is
                fixed_questions := array_append(fixed_questions, question_item);
            END IF;
        END LOOP;

        -- Update if we made any fixes
        IF needs_fix THEN
            UPDATE keywords
            SET related_questions = to_jsonb(fixed_questions),
                updated_at = NOW()
            WHERE id = keyword_record.id;

            RAISE NOTICE 'Updated keyword % with fixed questions', keyword_record.id;
        END IF;
    END LOOP;
END $$;

-- Also fix the keyword_questions table if any question column contains stringified JSON
UPDATE keyword_questions
SET question = (question::JSONB->>'question'),
    updated_at = NOW()
WHERE question LIKE '{%"question"%}'
  AND question::JSONB->>'question' IS NOT NULL;

-- Log how many were fixed
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    IF fixed_count > 0 THEN
        RAISE NOTICE 'Fixed % stringified questions in keyword_questions table', fixed_count;
    END IF;
END $$;
