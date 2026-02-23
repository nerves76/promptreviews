-- Migration: Add missing RLS policies for tenant-scoped tables
-- Date: 2026-02-22
--
-- This migration addresses several categories of RLS gaps:
--   1. Tables missing RLS entirely (rate_limit_violations)
--   2. Tables with broken RLS policies (account_events)
--   3. Tables missing service_role bypass policies (many tables)
--   4. Tables missing UPDATE/DELETE authenticated policies
--
-- All tenant-scoped tables (those with account_id) should have:
--   - RLS enabled
--   - SELECT/INSERT/UPDATE/DELETE policies for authenticated users scoped to account_users
--   - A service_role bypass policy for API routes using the service client
--
-- System/cron-only tables (billing_audit_log, trial_reminder_logs, etc.) are excluded
-- as they correctly only have service_role policies.

-- ============================================================================
-- 1. ENABLE RLS ON TABLES MISSING IT
-- ============================================================================

-- rate_limit_violations: System security table, only accessed by middleware (service role)
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_violations_service_role"
  ON rate_limit_violations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. FIX BROKEN POLICIES
-- ============================================================================

-- account_events: Has a broken policy comparing account_id (UUID) to auth.uid() (user UUID).
-- These will never match, effectively blocking all authenticated reads.
DROP POLICY IF EXISTS "Users can view own account events" ON account_events;

CREATE POLICY "account_events_select_own_account"
  ON account_events FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "account_events_insert_own_account"
  ON account_events FOR INSERT TO authenticated
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "account_events_service_role"
  ON account_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. ADD SERVICE_ROLE BYPASS POLICIES
-- These tables have proper authenticated policies but are missing
-- the service_role bypass needed by API routes using the service client.
-- ============================================================================

-- Communication system
CREATE POLICY "communication_records_service_role"
  ON communication_records FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "communication_templates_service_role"
  ON communication_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "follow_up_reminders_service_role"
  ON follow_up_reminders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Contacts
CREATE POLICY "contacts_service_role"
  ON contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Prompt pages
CREATE POLICY "prompt_pages_service_role"
  ON prompt_pages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Widgets
CREATE POLICY "widgets_service_role"
  ON widgets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Notifications
CREATE POLICY "notifications_service_role"
  ON notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "notification_preferences_service_role"
  ON notification_preferences FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Reviews & sharing
CREATE POLICY "review_share_events_service_role"
  ON review_share_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "review_share_images_service_role"
  ON review_share_images FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "review_keyword_matches_service_role"
  ON review_keyword_matches FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "sentiment_analysis_runs_service_role"
  ON sentiment_analysis_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Google Business Profile
CREATE POLICY "google_business_scheduled_posts_service_role"
  ON google_business_scheduled_posts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "selected_gbp_locations_service_role"
  ON selected_gbp_locations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "gbp_change_alerts_service_role"
  ON gbp_change_alerts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "gbp_location_snapshots_service_role"
  ON gbp_location_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "gbp_protection_settings_service_role"
  ON gbp_protection_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Social platform
CREATE POLICY "social_platform_connections_service_role"
  ON social_platform_connections FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Credit system
CREATE POLICY "credit_balances_service_role"
  ON credit_balances FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "credit_ledger_service_role"
  ON credit_ledger FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Business locations
CREATE POLICY "business_locations_service_role"
  ON business_locations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Surveys
CREATE POLICY "surveys_service_role"
  ON surveys FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "survey_responses_service_role"
  ON survey_responses FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "survey_response_purchases_service_role"
  ON survey_response_purchases FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- AI usage tracking
CREATE POLICY "ai_enrichment_usage_service_role"
  ON ai_enrichment_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "ai_keyword_generation_usage_service_role"
  ON ai_keyword_generation_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "ai_search_query_groups_service_role"
  ON ai_search_query_groups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Analysis & research
CREATE POLICY "analysis_batch_runs_service_role"
  ON analysis_batch_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "competitor_analysis_cache_service_role"
  ON competitor_analysis_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "keyword_research_results_service_role"
  ON keyword_research_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- RSS feeds
CREATE POLICY "rss_feed_sources_service_role"
  ON rss_feed_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Rank tracking
CREATE POLICY "rank_tracking_term_groups_service_role"
  ON rank_tracking_term_groups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "rank_tracking_terms_service_role"
  ON rank_tracking_terms FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Agency
CREATE POLICY "agncy_client_access_service_role"
  ON agncy_client_access FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Onboarding
CREATE POLICY "onboarding_tasks_service_role"
  ON onboarding_tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Ownership
CREATE POLICY "ownership_transfer_requests_service_role"
  ON ownership_transfer_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Web page outlines
CREATE POLICY "web_page_outlines_service_role"
  ON web_page_outlines FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Sidebar favorites
CREATE POLICY "sidebar_favorites_service_role"
  ON sidebar_favorites FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Security
CREATE POLICY "email_domain_policies_service_role"
  ON email_domain_policies FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Campaign actions (renamed from prompt_page_activities)
CREATE POLICY "campaign_actions_service_role"
  ON campaign_actions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Work Manager
CREATE POLICY "wm_boards_service_role"
  ON wm_boards FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "wm_tasks_service_role"
  ON wm_tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "wm_task_actions_service_role"
  ON wm_task_actions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "wm_resources_service_role"
  ON wm_resources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "wm_time_entries_service_role"
  ON wm_time_entries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. ADD MISSING CRUD POLICIES FOR AUTHENTICATED USERS
-- Tables that have SELECT/INSERT but are missing UPDATE and/or DELETE
-- ============================================================================

-- wm_task_actions: has SELECT + INSERT, needs UPDATE + DELETE
CREATE POLICY "wm_task_actions_update_own_account"
  ON wm_task_actions FOR UPDATE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "wm_task_actions_delete_own_account"
  ON wm_task_actions FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- communication_records: has SELECT + INSERT + UPDATE, needs DELETE
CREATE POLICY "communication_records_delete_own_account"
  ON communication_records FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- follow_up_reminders: has SELECT + INSERT + UPDATE, needs DELETE
CREATE POLICY "follow_up_reminders_delete_own_account"
  ON follow_up_reminders FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- notification_preferences: has SELECT + INSERT + UPDATE, needs DELETE
CREATE POLICY "notification_preferences_delete_own_account"
  ON notification_preferences FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- notifications: has SELECT + UPDATE (and service INSERT), needs DELETE for cleanup
CREATE POLICY "notifications_delete_own_account"
  ON notifications FOR DELETE TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- web_page_outlines: has SELECT + INSERT + UPDATE, needs DELETE
CREATE POLICY "web_page_outlines_delete_own_account"
  ON web_page_outlines FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- credit_balances: has SELECT + INSERT + UPDATE, needs DELETE
CREATE POLICY "credit_balances_delete_own_account"
  ON credit_balances FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
