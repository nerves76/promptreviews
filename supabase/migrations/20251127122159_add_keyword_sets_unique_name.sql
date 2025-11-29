-- Add unique constraint on keyword_sets (account_id, name)
-- Prevents duplicate keyword set names within the same account

CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_sets_account_name_unique
  ON public.keyword_sets(account_id, lower(name));
