-- Consolidate "Ungrouped" (NULL group_id) items into "General" groups.
-- After this migration, no keywords, keyword_questions, or rank_tracking_terms should have NULL group_id.
-- The app layer will enforce non-null going forward.

DO $$
DECLARE
  acct RECORD;
  ai_general_id UUID;
  rt_general_id UUID;
  kw_general_id UUID;
BEGIN
  -- Process each account that has ungrouped items
  FOR acct IN
    SELECT DISTINCT a.id AS account_id
    FROM accounts a
    WHERE EXISTS (
      SELECT 1 FROM keyword_questions kq
      JOIN keywords k ON k.id = kq.keyword_id
      WHERE k.account_id = a.id AND kq.group_id IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM rank_tracking_terms rtt
      WHERE rtt.account_id = a.id AND rtt.group_id IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM keywords kw
      WHERE kw.account_id = a.id AND kw.group_id IS NULL
    )
  LOOP
    -- Ensure "General" AI search query group exists for this account
    SELECT id INTO ai_general_id
    FROM ai_search_query_groups
    WHERE account_id = acct.account_id AND name = 'General';

    IF ai_general_id IS NULL THEN
      INSERT INTO ai_search_query_groups (account_id, name, display_order)
      VALUES (acct.account_id, 'General', 0)
      RETURNING id INTO ai_general_id;
    END IF;

    -- Ensure "General" rank tracking term group exists for this account
    SELECT id INTO rt_general_id
    FROM rank_tracking_term_groups
    WHERE account_id = acct.account_id AND name = 'General';

    IF rt_general_id IS NULL THEN
      INSERT INTO rank_tracking_term_groups (account_id, name, display_order)
      VALUES (acct.account_id, 'General', 0)
      RETURNING id INTO rt_general_id;
    END IF;

    -- Ensure "General" keyword group exists for this account
    SELECT id INTO kw_general_id
    FROM keyword_groups
    WHERE account_id = acct.account_id AND name = 'General';

    IF kw_general_id IS NULL THEN
      INSERT INTO keyword_groups (account_id, name, display_order)
      VALUES (acct.account_id, 'General', 0)
      RETURNING id INTO kw_general_id;
    END IF;

    -- Backfill NULL group_id in keyword_questions to General
    UPDATE keyword_questions kq
    SET group_id = ai_general_id
    FROM keywords k
    WHERE kq.keyword_id = k.id
      AND k.account_id = acct.account_id
      AND kq.group_id IS NULL;

    -- Backfill NULL group_id in rank_tracking_terms to General
    UPDATE rank_tracking_terms
    SET group_id = rt_general_id
    WHERE account_id = acct.account_id
      AND group_id IS NULL;

    -- Backfill NULL group_id in keywords to General
    UPDATE keywords
    SET group_id = kw_general_id
    WHERE account_id = acct.account_id
      AND group_id IS NULL;
  END LOOP;
END $$;
