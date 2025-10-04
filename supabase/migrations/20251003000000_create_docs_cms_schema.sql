/**
 * Docs CMS Schema Migration
 *
 * Creates tables for managing documentation and help content dynamically.
 * This replaces the hardcoded TSX content approach with a database-driven CMS.
 *
 * Tables:
 * - articles: Main documentation content
 * - article_revisions: Version history for articles
 * - faqs: Frequently asked questions
 * - navigation: Sidebar navigation structure
 * - article_contexts: Route-to-article mappings for contextual help
 * - media_assets: Images, videos, and other assets
 *
 * Migration Date: 2025-10-03
 * Related Docs: /docs-promptreviews/docs-site/PHASE_0_CHARTER.md
 */

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,  -- Markdown/MDX content

  -- Metadata stored as JSONB for flexibility
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Workflow status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9/-]+$'),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_updated_at ON articles(updated_at DESC);

-- Full-text search index
CREATE INDEX idx_articles_search ON articles USING gin(
  to_tsvector('english', title || ' ' || content)
);

-- JSONB indexes for metadata queries
CREATE INDEX idx_articles_metadata_category ON articles ((metadata->>'category'));
CREATE INDEX idx_articles_metadata_tags ON articles USING gin ((metadata->'tags'));

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE articles IS 'Documentation articles and help content';
COMMENT ON COLUMN articles.metadata IS 'JSONB field containing: description, keywords, category, tags, icons, featured content, CTAs, plan availability';
COMMENT ON COLUMN articles.status IS 'Workflow status: draft (not visible), published (live), archived (hidden but searchable)';

-- ============================================================================
-- ARTICLE REVISIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Snapshot of content at this revision
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Revision metadata
  editor_id uuid REFERENCES auth.users(id),
  change_summary text,  -- Optional description of what changed

  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX idx_article_revisions_created_at ON article_revisions(created_at DESC);
CREATE INDEX idx_article_revisions_editor_id ON article_revisions(editor_id);

-- Trigger to create revision on article update
CREATE OR REPLACE FUNCTION create_article_revision()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create revision if content or metadata actually changed
    IF OLD.content IS DISTINCT FROM NEW.content OR
       OLD.metadata IS DISTINCT FROM NEW.metadata THEN
        INSERT INTO article_revisions (article_id, content, metadata, editor_id)
        VALUES (OLD.id, OLD.content, OLD.metadata, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_article_revision_trigger BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION create_article_revision();

COMMENT ON TABLE article_revisions IS 'Version history for documentation articles';

-- ============================================================================
-- FAQS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,

  -- Organization
  category text NOT NULL,

  -- Plan availability filter
  plans text[] DEFAULT ARRAY['grower', 'builder', 'maven', 'enterprise'],

  -- Ordering within category
  order_index int DEFAULT 0,

  -- Optional: Link to related article
  article_id uuid REFERENCES articles(id) ON DELETE SET NULL,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT question_not_empty CHECK (length(trim(question)) > 0),
  CONSTRAINT answer_not_empty CHECK (length(trim(answer)) > 0),
  CONSTRAINT valid_plans CHECK (
    plans <@ ARRAY['grower', 'builder', 'maven', 'enterprise']::text[]
  )
);

-- Indexes
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_article_id ON faqs(article_id);
CREATE INDEX idx_faqs_order ON faqs(category, order_index);
CREATE INDEX idx_faqs_plans ON faqs USING gin(plans);

-- Full-text search
CREATE INDEX idx_faqs_search ON faqs USING gin(
  to_tsvector('english', question || ' ' || answer)
);

-- Auto-update trigger
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE faqs IS 'Frequently Asked Questions with plan-based filtering';
COMMENT ON COLUMN faqs.plans IS 'Array of plan names this FAQ applies to';

-- ============================================================================
-- NAVIGATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hierarchical structure
  parent_id uuid REFERENCES navigation(id) ON DELETE CASCADE,

  -- Display info
  title text NOT NULL,
  href text,  -- Optional: some nav items are just groupings
  icon_name text,  -- Lucide icon name (e.g., 'BookOpen')

  -- Ordering
  order_index int DEFAULT 0,

  -- Visibility controls where this nav item appears
  visibility text[] DEFAULT ARRAY['docs', 'help'],  -- 'docs' site, 'help' modal, both

  -- Status
  is_active boolean DEFAULT true,

  -- Audit
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT valid_visibility CHECK (
    visibility <@ ARRAY['docs', 'help']::text[]
  )
);

-- Indexes
CREATE INDEX idx_navigation_parent_id ON navigation(parent_id);
CREATE INDEX idx_navigation_order ON navigation(parent_id NULLS FIRST, order_index);
CREATE INDEX idx_navigation_visibility ON navigation USING gin(visibility);
CREATE INDEX idx_navigation_is_active ON navigation(is_active);

-- Auto-update trigger
CREATE TRIGGER update_navigation_updated_at BEFORE UPDATE ON navigation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE navigation IS 'Hierarchical navigation structure for docs site and help modal';
COMMENT ON COLUMN navigation.visibility IS 'Where this nav item appears: docs site, help modal, or both';

-- ============================================================================
-- ARTICLE CONTEXTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Route pattern matching
  route_pattern text NOT NULL,  -- e.g., '/dashboard/prompt-pages'

  -- Keywords for relevance scoring
  keywords text[] DEFAULT ARRAY[]::text[],

  -- Priority/weight for this context (0-100, higher = more relevant)
  priority int DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),

  -- Audit
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique article-route pairing
  CONSTRAINT unique_article_route UNIQUE (article_id, route_pattern)
);

-- Indexes
CREATE INDEX idx_article_contexts_article_id ON article_contexts(article_id);
CREATE INDEX idx_article_contexts_route ON article_contexts(route_pattern);
CREATE INDEX idx_article_contexts_keywords ON article_contexts USING gin(keywords);
CREATE INDEX idx_article_contexts_priority ON article_contexts(priority DESC);

COMMENT ON TABLE article_contexts IS 'Maps app routes to relevant help articles for contextual help system';
COMMENT ON COLUMN article_contexts.route_pattern IS 'App route pattern (exact match or prefix) to show this article';
COMMENT ON COLUMN article_contexts.keywords IS 'Keywords for relevance scoring when matching articles to routes';
COMMENT ON COLUMN article_contexts.priority IS 'Priority weight (0-100) for ranking articles in context';

-- ============================================================================
-- MEDIA ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File information
  filename text NOT NULL,
  url text NOT NULL,  -- Full CDN URL or Supabase Storage path
  mime_type text,
  size_bytes bigint,

  -- Display metadata
  alt_text text,
  caption text,

  -- Optional: Link to article
  article_id uuid REFERENCES articles(id) ON DELETE SET NULL,

  -- Audit
  created_at timestamptz DEFAULT now() NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://.*')
);

-- Indexes
CREATE INDEX idx_media_assets_article_id ON media_assets(article_id);
CREATE INDEX idx_media_assets_mime_type ON media_assets(mime_type);
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at DESC);

COMMENT ON TABLE media_assets IS 'Images, videos, and other media used in documentation';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: ARTICLES
-- ============================================================================

-- Public can read published articles
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

-- Admins have full access
CREATE POLICY "Admins have full access to articles"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: ARTICLE REVISIONS
-- ============================================================================

-- Public cannot read revisions
-- Admins can read all revisions
CREATE POLICY "Admins can read all article revisions"
  ON article_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- Revisions created automatically by trigger, no INSERT policy needed

-- ============================================================================
-- POLICIES: FAQS
-- ============================================================================

-- Public can read all FAQs (plan filtering done in application layer)
CREATE POLICY "Public can read FAQs"
  ON faqs FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to FAQs"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: NAVIGATION
-- ============================================================================

-- Public can read active navigation
CREATE POLICY "Public can read active navigation"
  ON navigation FOR SELECT
  USING (is_active = true);

-- Admins have full access
CREATE POLICY "Admins have full access to navigation"
  ON navigation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: ARTICLE CONTEXTS
-- ============================================================================

-- Public can read contexts (for help system matching)
CREATE POLICY "Public can read article contexts"
  ON article_contexts FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to article contexts"
  ON article_contexts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: MEDIA ASSETS
-- ============================================================================

-- Public can read all media (used in published articles)
CREATE POLICY "Public can read media assets"
  ON media_assets FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to media assets"
  ON media_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Search articles by text query
 * Returns ranked results using PostgreSQL full-text search
 */
CREATE OR REPLACE FUNCTION search_articles(search_query text, limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  content text,
  metadata jsonb,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.title,
    a.content,
    a.metadata,
    ts_rank(to_tsvector('english', a.title || ' ' || a.content), plainto_tsquery('english', search_query)) AS rank
  FROM articles a
  WHERE
    a.status = 'published'
    AND to_tsvector('english', a.title || ' ' || a.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_articles IS 'Full-text search across published articles with ranking';

/**
 * Get articles for a specific route context
 * Returns articles ordered by relevance score
 */
CREATE OR REPLACE FUNCTION get_contextual_articles(route text, limit_count int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  content text,
  metadata jsonb,
  relevance_score int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.slug,
    a.title,
    a.content,
    a.metadata,
    ac.priority AS relevance_score
  FROM articles a
  INNER JOIN article_contexts ac ON ac.article_id = a.id
  WHERE
    a.status = 'published'
    AND (ac.route_pattern = route OR route LIKE ac.route_pattern || '%')
  ORDER BY ac.priority DESC, a.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_contextual_articles IS 'Get most relevant articles for a specific app route';

/**
 * Get full navigation tree
 * Returns hierarchical navigation structure
 */
CREATE OR REPLACE FUNCTION get_navigation_tree()
RETURNS jsonb AS $$
WITH RECURSIVE nav_tree AS (
  -- Base case: top-level items
  SELECT
    id,
    parent_id,
    title,
    href,
    icon_name,
    order_index,
    visibility,
    jsonb_build_object(
      'id', id,
      'title', title,
      'href', href,
      'icon', icon_name,
      'children', '[]'::jsonb
    ) AS node
  FROM navigation
  WHERE parent_id IS NULL AND is_active = true

  UNION ALL

  -- Recursive case: child items
  SELECT
    n.id,
    n.parent_id,
    n.title,
    n.href,
    n.icon_name,
    n.order_index,
    n.visibility,
    jsonb_build_object(
      'id', n.id,
      'title', n.title,
      'href', n.href,
      'icon', n.icon_name,
      'children', '[]'::jsonb
    )
  FROM navigation n
  INNER JOIN nav_tree nt ON n.parent_id = nt.id
  WHERE n.is_active = true
)
SELECT jsonb_agg(node ORDER BY order_index)
FROM nav_tree
WHERE parent_id IS NULL;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_navigation_tree IS 'Get complete navigation tree as nested JSON';

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Note: Sample data commented out for production migration
-- Uncomment for local development seeding

/*
-- Sample article
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_by)
VALUES (
  'getting-started',
  'Getting Started with Prompt Reviews',
  E'# Getting Started\n\nWelcome to Prompt Reviews! This guide will help you...',
  'published',
  '{"description": "Quick start guide", "category": "getting-started", "tags": ["setup", "quickstart"], "category_label": "Quick Start", "category_icon": "BookOpen", "category_color": "green"}',
  now(),
  (SELECT id FROM auth.users LIMIT 1)
);

-- Sample FAQ
INSERT INTO faqs (question, answer, category, plans, order_index)
VALUES (
  'How do I get started?',
  'Simply sign up for an account and follow our quick start guide.',
  'getting-started',
  ARRAY['grower', 'builder', 'maven'],
  1
);
*/
