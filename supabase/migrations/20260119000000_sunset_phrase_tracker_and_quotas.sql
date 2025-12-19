-- Migration: Sunset Phrase Tracker & Remove Monthly Quotas
-- This migration:
-- 1. Drops phrase tracker related tables (if they exist)
-- 2. Removes monthly quota columns from accounts table (now using credits)
-- 3. Adds credit pricing rules for sentiment analysis

-- ============================================
-- PART 1: Drop Phrase Tracker Tables
-- ============================================

-- These tables were used by the Review Phrase Tracker feature which has been sunset.
-- The feature's functionality (phrase discovery) is now integrated into Sentiment Analysis.

DROP TABLE IF EXISTS keyword_analysis_runs CASCADE;
DROP TABLE IF EXISTS keyword_set_terms CASCADE;
DROP TABLE IF EXISTS keyword_set_locations CASCADE;
DROP TABLE IF EXISTS keyword_sets CASCADE;

-- ============================================
-- PART 2: Remove Monthly Quota Columns
-- ============================================

-- Monthly quotas are being replaced by credit-based billing.
-- These columns are no longer used.

ALTER TABLE accounts
DROP COLUMN IF EXISTS keyword_analyses_this_month,
DROP COLUMN IF EXISTS keyword_analyses_last_reset_date,
DROP COLUMN IF EXISTS keyword_suggestions_this_month,
DROP COLUMN IF EXISTS keyword_suggestions_last_reset_date,
DROP COLUMN IF EXISTS sentiment_analyses_this_month,
DROP COLUMN IF EXISTS sentiment_last_reset_date;

-- ============================================
-- PART 3: Add Sentiment Analysis Credit Pricing Rules
-- ============================================

-- Insert credit pricing rules for sentiment analysis (tiered by review count)
-- Only insert if rules don't already exist

INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active)
VALUES
  ('sentiment_analysis', 'tier_50', 5, 'Sentiment analysis: up to 50 reviews', true),
  ('sentiment_analysis', 'tier_100', 10, 'Sentiment analysis: up to 100 reviews', true),
  ('sentiment_analysis', 'tier_500', 20, 'Sentiment analysis: up to 500 reviews', true),
  ('sentiment_analysis', 'tier_1000', 35, 'Sentiment analysis: up to 1,000 reviews', true),
  ('sentiment_analysis', 'tier_5000', 75, 'Sentiment analysis: up to 5,000 reviews', true),
  ('sentiment_analysis', 'tier_10000', 125, 'Sentiment analysis: up to 10,000 reviews', true),
  ('sentiment_analysis', 'tier_max', 150, 'Sentiment analysis: over 10,000 reviews', true)
ON CONFLICT (feature_type, rule_key) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE credit_pricing_rules IS 'Credit pricing rules for all features. Sentiment analysis uses tiered pricing based on review count.';
