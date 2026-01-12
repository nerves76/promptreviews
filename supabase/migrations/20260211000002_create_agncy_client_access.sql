-- Create agency-client access table
-- Tracks which agency users have access to which client accounts

CREATE TABLE agncy_client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('manager', 'billing_manager')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one active relationship per agency-client pair
  UNIQUE(agency_account_id, client_account_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_agncy_access_agency ON agncy_client_access(agency_account_id);
CREATE INDEX idx_agncy_access_client ON agncy_client_access(client_account_id);
CREATE INDEX idx_agncy_access_user ON agncy_client_access(user_id);
CREATE INDEX idx_agncy_access_status ON agncy_client_access(status) WHERE status = 'active';

-- Comments
COMMENT ON TABLE agncy_client_access IS 'Tracks agency user access to client accounts';
COMMENT ON COLUMN agncy_client_access.agency_account_id IS 'The agency account that owns this relationship';
COMMENT ON COLUMN agncy_client_access.client_account_id IS 'The client account being managed';
COMMENT ON COLUMN agncy_client_access.user_id IS 'The agency user who has access';
COMMENT ON COLUMN agncy_client_access.role IS 'Access level: manager (no billing) or billing_manager (with billing)';
COMMENT ON COLUMN agncy_client_access.status IS 'Relationship status: pending, active, or removed';

-- Enable RLS
ALTER TABLE agncy_client_access ENABLE ROW LEVEL SECURITY;

-- Policy: Agency users can see their own access records
CREATE POLICY "Users can view their own agency access"
  ON agncy_client_access FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Agency owners can manage access for their agency
CREATE POLICY "Agency owners can manage agency access"
  ON agncy_client_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = agncy_client_access.agency_account_id
      AND au.user_id = auth.uid()
      AND au.role = 'owner'
    )
  );

-- Policy: Client owners can view and remove agency access to their account
CREATE POLICY "Client owners can view agency access to their account"
  ON agncy_client_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = agncy_client_access.client_account_id
      AND au.user_id = auth.uid()
      AND au.role = 'owner'
    )
  );

CREATE POLICY "Client owners can update agency access to their account"
  ON agncy_client_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = agncy_client_access.client_account_id
      AND au.user_id = auth.uid()
      AND au.role = 'owner'
    )
  );
