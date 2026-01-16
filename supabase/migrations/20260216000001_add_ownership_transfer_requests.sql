-- Add ownership transfer requests table
-- This migration adds a table for tracking ownership transfer requests between account users

-- Create ownership_transfer_requests table
CREATE TABLE IF NOT EXISTS ownership_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Prevent self-transfer
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Create unique partial index to ensure only one pending transfer per account at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_transfer_per_account
  ON ownership_transfer_requests(account_id)
  WHERE status = 'pending';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_account_id ON ownership_transfer_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_token ON ownership_transfer_requests(token);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_to_user ON ownership_transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_from_user ON ownership_transfer_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_status ON ownership_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_expires_at ON ownership_transfer_requests(expires_at);

-- RLS policies for ownership_transfer_requests
ALTER TABLE ownership_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Allow account owners to view transfers for their account
CREATE POLICY "Account owners can view transfers" ON ownership_transfer_requests
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR to_user_id = auth.uid()
    OR from_user_id = auth.uid()
  );

-- Allow account owners to create transfers
CREATE POLICY "Account owners can create transfers" ON ownership_transfer_requests
  FOR INSERT WITH CHECK (
    from_user_id = auth.uid() AND
    account_id IN (
      SELECT account_id FROM account_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow involved parties to update transfers (accept/decline/cancel)
CREATE POLICY "Involved parties can update transfers" ON ownership_transfer_requests
  FOR UPDATE USING (
    to_user_id = auth.uid() OR from_user_id = auth.uid()
  );

-- Allow initiator to delete transfers (cancel)
CREATE POLICY "Initiator can delete transfers" ON ownership_transfer_requests
  FOR DELETE USING (
    from_user_id = auth.uid()
  );

-- Add comment to explain the table purpose
COMMENT ON TABLE ownership_transfer_requests IS 'Tracks ownership transfer requests between account users. Transfer acceptance is handled via API with admin client.';
