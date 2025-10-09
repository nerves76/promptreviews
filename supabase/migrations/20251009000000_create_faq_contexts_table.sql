/**
 * FAQ Contexts Migration
 *
 * Creates faq_contexts table to enable contextual routing of FAQs based on the current page,
 * similar to how article_contexts works for articles.
 *
 * This allows FAQs to be shown contextually on specific pages based on route patterns,
 * with relevance scoring via keywords and priority.
 *
 * Migration Date: 2025-10-09
 * Related to: article_contexts table from 20251003000000_create_docs_cms_schema.sql
 */

-- ============================================================================
-- FAQ CONTEXTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS faq_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id uuid NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,

  -- Route pattern matching
  route_pattern text NOT NULL,  -- e.g., '/dashboard/prompt-pages', '/dashboard/widget'

  -- Keywords for relevance scoring
  keywords text[] DEFAULT ARRAY[]::text[],

  -- Priority/weight for this context (0-100, higher = more relevant)
  priority int DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),

  -- Audit
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique FAQ-route pairing
  CONSTRAINT unique_faq_route UNIQUE (faq_id, route_pattern)
);

-- Indexes for performance
CREATE INDEX idx_faq_contexts_faq_id ON faq_contexts(faq_id);
CREATE INDEX idx_faq_contexts_route ON faq_contexts(route_pattern);
CREATE INDEX idx_faq_contexts_keywords ON faq_contexts USING gin(keywords);
CREATE INDEX idx_faq_contexts_priority ON faq_contexts(priority DESC);

-- Comments
COMMENT ON TABLE faq_contexts IS 'Maps app routes to relevant FAQs for contextual help system';
COMMENT ON COLUMN faq_contexts.route_pattern IS 'App route pattern (exact match or prefix) to show this FAQ';
COMMENT ON COLUMN faq_contexts.keywords IS 'Keywords for relevance scoring when matching FAQs to routes';
COMMENT ON COLUMN faq_contexts.priority IS 'Priority weight (0-100) for ranking FAQs in context';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE faq_contexts ENABLE ROW LEVEL SECURITY;

-- Public can read contexts (for help system matching)
CREATE POLICY "Public can read FAQ contexts"
  ON faq_contexts FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to FAQ contexts"
  ON faq_contexts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

/**
 * Get FAQs for a specific route context
 * Returns FAQs ordered by relevance score
 */
CREATE OR REPLACE FUNCTION get_contextual_faqs(route text, limit_count int DEFAULT 3, user_plan text DEFAULT 'grower')
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  category text,
  plans text[],
  order_index int,
  article_id uuid,
  relevance_score int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.plans,
    f.order_index,
    f.article_id,
    fc.priority AS relevance_score
  FROM faqs f
  INNER JOIN faq_contexts fc ON fc.faq_id = f.id
  WHERE
    -- Match route pattern (exact or prefix match)
    (fc.route_pattern = route OR route LIKE fc.route_pattern || '%')
    -- Filter by user's plan
    AND user_plan = ANY(f.plans)
  ORDER BY fc.priority DESC, f.order_index ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_contextual_faqs IS 'Get most relevant FAQs for a specific app route and user plan';
