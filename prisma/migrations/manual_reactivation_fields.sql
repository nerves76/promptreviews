-- Add reactivation fields to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_cancellation_reason TEXT;

-- Create account_events table for tracking reactivation history
CREATE TABLE IF NOT EXISTS public.account_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for account_events
CREATE INDEX IF NOT EXISTS idx_account_events_account ON public.account_events(account_id);
CREATE INDEX IF NOT EXISTS idx_account_events_type ON public.account_events(event_type);
CREATE INDEX IF NOT EXISTS idx_account_events_created ON public.account_events(created_at DESC);

-- Add index for deleted_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at ON public.accounts(deleted_at);

-- Add comments for documentation
COMMENT ON COLUMN public.accounts.reactivated_at IS 'Timestamp when account was last reactivated after cancellation';
COMMENT ON COLUMN public.accounts.reactivation_count IS 'Number of times this account has been reactivated';
COMMENT ON COLUMN public.accounts.last_cancellation_reason IS 'Reason provided for the most recent cancellation';
COMMENT ON TABLE public.account_events IS 'Tracks account lifecycle events including reactivations and cancellations';