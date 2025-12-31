-- Fix the trigger_gbp_post_published function
-- The trigger was comparing to 'published' which is not a valid enum value
-- The correct status for a published post is 'completed'

CREATE OR REPLACE FUNCTION trigger_gbp_post_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only count when status changes to 'completed' (published)
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM increment_metric('total_gbp_posts_published', 1);
  END IF;
  RETURN NEW;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION trigger_gbp_post_published() IS 'Increments the total_gbp_posts_published metric when a scheduled post status changes to completed';
