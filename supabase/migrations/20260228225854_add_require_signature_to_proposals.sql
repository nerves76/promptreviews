-- Add require_signature toggle to proposals
-- Default true preserves existing behavior (signature form always shown)
ALTER TABLE proposals ADD COLUMN require_signature BOOLEAN NOT NULL DEFAULT true;
