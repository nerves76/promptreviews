-- Add feature_type and account_id columns to ai_usage table for keyword generation tracking

-- Add feature_type column (text) to track different AI feature types
ALTER TABLE public.ai_usage
ADD COLUMN IF NOT EXISTS feature_type text;

-- Add account_id column to associate usage with accounts
ALTER TABLE public.ai_usage
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Create index on feature_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_type ON public.ai_usage(feature_type);

-- Create index on account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_account_id ON public.ai_usage(account_id);

-- Create composite index for common query pattern (user_id + feature_type + created_at)
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature_created
ON public.ai_usage(user_id, feature_type, created_at DESC);
