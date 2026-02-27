-- Add 'on_hold' to allowed proposal statuses
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'on_hold'));
