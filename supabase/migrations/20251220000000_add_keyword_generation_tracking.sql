-- Add account_id and feature_type columns to ai_usage table for keyword generation tracking

-- Add account_id column to track which account used the AI feature
ALTER TABLE public.ai_usage
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Add feature_type column to differentiate between different AI features
ALTER TABLE public.ai_usage
ADD COLUMN IF NOT EXISTS feature_type TEXT;

-- Add foreign key constraint to accounts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_ai_usage_account_id'
  ) THEN
    ALTER TABLE public.ai_usage
    ADD CONSTRAINT fk_ai_usage_account_id
    FOREIGN KEY (account_id)
    REFERENCES public.accounts(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster queries on account_id and feature_type
CREATE INDEX IF NOT EXISTS idx_ai_usage_account_id ON public.ai_usage(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_type ON public.ai_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_account_feature ON public.ai_usage(account_id, feature_type, created_at);

-- Add comment for documentation
COMMENT ON COLUMN public.ai_usage.account_id IS 'Account that used the AI feature';
COMMENT ON COLUMN public.ai_usage.feature_type IS 'Type of AI feature used (e.g., keyword_generation, review_generation, grammar_fix)';
