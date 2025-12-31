-- ============================================
-- Analytics System - Auto-increment Triggers
-- ============================================
-- Automatically updates platform_metrics when:
-- - Accounts are created/deleted
-- - Reviews are captured/deleted
-- - Widgets are created
-- - Prompt pages are created
-- - GBP posts are published
-- ============================================

-- ============================================
-- Trigger: Account Created
-- ============================================
CREATE OR REPLACE FUNCTION trigger_account_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_accounts_created', 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_account_created
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_account_created();

-- ============================================
-- Trigger: Account Deleted
-- ============================================
CREATE OR REPLACE FUNCTION trigger_account_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_accounts_deleted', 1);
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_account_deleted
  AFTER DELETE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_account_deleted();

-- ============================================
-- Trigger: Review Captured
-- ============================================
CREATE OR REPLACE FUNCTION trigger_review_captured()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_reviews_captured', 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_captured
  AFTER INSERT ON review_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_review_captured();

-- ============================================
-- Trigger: Review Deleted
-- ============================================
CREATE OR REPLACE FUNCTION trigger_review_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_reviews_deleted', 1);
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_review_deleted
  AFTER DELETE ON review_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_review_deleted();

-- ============================================
-- Trigger: Widget Created
-- ============================================
CREATE OR REPLACE FUNCTION trigger_widget_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_widgets_created', 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_widget_created
  AFTER INSERT ON widgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_widget_created();

-- ============================================
-- Trigger: Prompt Page Created
-- ============================================
CREATE OR REPLACE FUNCTION trigger_prompt_page_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM increment_metric('total_prompt_pages_created', 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_prompt_page_created
  AFTER INSERT ON prompt_pages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prompt_page_created();

-- ============================================
-- Trigger: GBP Post Published
-- Track when posts are successfully published to Google Business
-- ============================================
CREATE OR REPLACE FUNCTION trigger_gbp_post_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only count when status changes to 'completed' (the enum value for published posts)
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM increment_metric('total_gbp_posts_published', 1);
  END IF;
  RETURN NEW;
END;
$$;

-- Only create trigger if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'google_business_scheduled_posts'
  ) THEN
    CREATE TRIGGER on_gbp_post_published
      AFTER INSERT OR UPDATE ON google_business_scheduled_posts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_gbp_post_published();
    RAISE NOTICE '✅ GBP post trigger created';
  ELSE
    RAISE NOTICE 'ℹ️  GBP scheduled posts table not found, skipping trigger';
  END IF;
END $$;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics triggers created successfully';
  RAISE NOTICE 'Tracking: accounts, reviews, widgets, prompt pages, GBP posts';
  RAISE NOTICE 'Metrics will auto-increment on each creation/deletion';
END $$;
