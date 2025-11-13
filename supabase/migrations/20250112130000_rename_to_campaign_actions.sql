-- Rename prompt_page_activities table to campaign_actions for better clarity
ALTER TABLE prompt_page_activities RENAME TO campaign_actions;

-- Update indexes
ALTER INDEX idx_prompt_page_activities_prompt_page_id RENAME TO idx_campaign_actions_prompt_page_id;
ALTER INDEX idx_prompt_page_activities_account_id RENAME TO idx_campaign_actions_account_id;
ALTER INDEX idx_prompt_page_activities_created_at RENAME TO idx_campaign_actions_created_at;
ALTER INDEX idx_prompt_page_activities_activity_type RENAME TO idx_campaign_actions_activity_type;

-- Update trigger and function names
ALTER TRIGGER update_prompt_page_activities_updated_at ON campaign_actions RENAME TO update_campaign_actions_updated_at;
ALTER FUNCTION update_prompt_page_activities_updated_at() RENAME TO update_campaign_actions_updated_at;

-- Update table comment
COMMENT ON TABLE campaign_actions IS 'Activity log for prompt page campaigns including notes, communications, and status changes';
