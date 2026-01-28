-- Quick check of current batch status
DO $$
DECLARE
    rec RECORD;
BEGIN
    SELECT status, processed_questions, total_questions,
           successful_checks, failed_checks, updated_at
    INTO rec
    FROM llm_batch_runs
    WHERE id = '42620c52-b5ff-45d7-a4fc-31e535b7fd6d';

    RAISE NOTICE 'Status: %, Progress: %/%, Success: %, Failed: %, Last update: %',
        rec.status, rec.processed_questions, rec.total_questions,
        rec.successful_checks, rec.failed_checks, rec.updated_at;
END $$;
