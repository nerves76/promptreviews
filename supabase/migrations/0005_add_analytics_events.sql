-- Add required columns for analytics
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add new event types to track
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS valid_event_type;
ALTER TABLE analytics_events 
ADD CONSTRAINT valid_event_type 
CHECK (event_type IN (
  'view',              -- Page view
  'copy_submit',       -- User copied/submitted a review
  'ai_generate',       -- AI generated a review
  'login',             -- User login
  'prompt_page_created', -- New prompt page created
  'contacts_uploaded',  -- Contacts uploaded
  'review_submitted',   -- Review submitted to platform
  'save_for_later',    -- User saved a review for later
  'unsave_for_later',  -- User removed a saved review
  'time_spent',        -- Time spent on page
  'feature_used'       -- General feature usage tracking
));

-- Add a function to track user logins
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO analytics_events (
    event_type,
    created_at,
    user_agent,
    ip_address,
    session_id
  ) VALUES (
    'login',
    NEW.last_sign_in_at,
    NEW.raw_user_meta_data->>'user_agent',
    NEW.raw_user_meta_data->>'ip_address',
    NEW.raw_user_meta_data->>'session_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS track_user_login_trigger ON auth.users;
CREATE TRIGGER track_user_login_trigger
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION track_user_login();

-- Add function to track time spent
CREATE OR REPLACE FUNCTION track_time_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if time_spent is provided in metadata
  IF NEW.metadata->>'time_spent' IS NOT NULL THEN
    INSERT INTO analytics_events (
      prompt_page_id,
      event_type,
      created_at,
      user_agent,
      ip_address,
      session_id,
      metadata
    ) VALUES (
      NEW.prompt_page_id,
      'time_spent',
      NEW.created_at,
      NEW.user_agent,
      NEW.ip_address,
      NEW.session_id,
      jsonb_build_object(
        'time_spent_seconds', NEW.metadata->>'time_spent',
        'platform', NEW.platform
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for time spent tracking
DROP TRIGGER IF EXISTS track_time_spent_trigger ON analytics_events;
CREATE TRIGGER track_time_spent_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'view')
  EXECUTE FUNCTION track_time_spent();

-- Add function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO analytics_events (
    prompt_page_id,
    event_type,
    created_at,
    user_agent,
    ip_address,
    session_id,
    metadata
  ) VALUES (
    NEW.prompt_page_id,
    'feature_used',
    NEW.created_at,
    NEW.user_agent,
    NEW.ip_address,
    NEW.session_id,
    jsonb_build_object(
      'feature', NEW.metadata->>'feature',
      'action', NEW.metadata->>'action',
      'platform', NEW.platform
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for feature usage tracking
DROP TRIGGER IF EXISTS track_feature_usage_trigger ON analytics_events;
CREATE TRIGGER track_feature_usage_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  WHEN (NEW.event_type IN ('ai_generate', 'contacts_uploaded', 'save_for_later', 'unsave_for_later'))
  EXECUTE FUNCTION track_feature_usage();

-- Add comments
COMMENT ON CONSTRAINT valid_event_type ON analytics_events IS 'Validates that event_type is one of the predefined types';
COMMENT ON FUNCTION track_user_login IS 'Tracks user logins in analytics_events table';
COMMENT ON FUNCTION track_time_spent IS 'Tracks time spent on pages';
COMMENT ON FUNCTION track_feature_usage IS 'Tracks feature usage across the application';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event data stored as JSON';
COMMENT ON COLUMN analytics_events.session_id IS 'Unique session identifier for tracking user sessions';
COMMENT ON COLUMN analytics_events.user_agent IS 'User agent string from the browser';
COMMENT ON COLUMN analytics_events.ip_address IS 'IP address of the user';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON analytics_events USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON analytics_events(platform);
CREATE INDEX IF NOT EXISTS idx_prompt_page_events_session_id ON prompt_page_events(session_id); 