-- Migration: Force plan default to 'no_plan' for accounts
-- This migration ensures the plan column defaults to 'no_plan' for all new accounts

ALTER TABLE accounts ALTER COLUMN plan SET DEFAULT 'no_plan';

COMMENT ON COLUMN accounts.plan IS 'The user''s subscription plan. no_plan means no plan selected yet.'; 