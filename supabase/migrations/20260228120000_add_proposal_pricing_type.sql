-- Add pricing_type column to proposals table
-- Values: 'fixed' (default), 'monthly', 'hourly'
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'fixed';
