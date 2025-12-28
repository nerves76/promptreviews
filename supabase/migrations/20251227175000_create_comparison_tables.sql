/**
 * Competitor Comparison Tables Schema Migration
 *
 * Creates tables for managing competitor comparison feature tables.
 * Supports embeddable comparison widgets for marketing site.
 *
 * Tables:
 * - comparison_categories: Feature groupings (Local SEO, Reviews, etc.)
 * - comparison_features: Individual features to compare
 * - competitors: Competitor profiles
 * - competitor_features: Junction table for competitor feature values
 * - comparison_tables: Embeddable widget configurations
 *
 * Migration Date: 2025-12-27
 */

-- ============================================================================
-- COMPARISON CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comparison_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,

  -- Icon for visual hierarchy (Lucide icon name)
  icon_name text,

  -- Ordering (primacy effect - strongest categories first)
  display_order int DEFAULT 0,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT comparison_categories_valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT comparison_categories_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_comparison_categories_slug ON comparison_categories(slug);
CREATE INDEX idx_comparison_categories_order ON comparison_categories(display_order);

-- Auto-update trigger (reuse existing function if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comparison_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_comparison_categories_updated_at
      BEFORE UPDATE ON comparison_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE comparison_categories IS 'Feature categories for grouping comparison features (e.g., Local SEO, Reviews)';
COMMENT ON COLUMN comparison_categories.display_order IS 'Order for display (lower numbers first, primacy effect)';

-- ============================================================================
-- COMPARISON FEATURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comparison_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,

  -- Benefit-focused alternative name (psychological best practice)
  benefit_framing text,

  -- Description for tooltips
  description text,

  -- Category for grouping
  category_id uuid REFERENCES comparison_categories(id) ON DELETE SET NULL,

  -- Feature type for rendering
  feature_type text DEFAULT 'boolean' CHECK (feature_type IN ('boolean', 'text', 'number', 'limited')),

  -- Ordering within category
  display_order int DEFAULT 0,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT comparison_features_valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT comparison_features_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_comparison_features_slug ON comparison_features(slug);
CREATE INDEX idx_comparison_features_category_id ON comparison_features(category_id);
CREATE INDEX idx_comparison_features_order ON comparison_features(category_id, display_order);

-- Auto-update trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comparison_features_updated_at'
  ) THEN
    CREATE TRIGGER update_comparison_features_updated_at
      BEFORE UPDATE ON comparison_features
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE comparison_features IS 'Individual features to compare across competitors';
COMMENT ON COLUMN comparison_features.benefit_framing IS 'Benefit-focused alternative name (e.g., "Build custom integrations" vs "API Access")';
COMMENT ON COLUMN comparison_features.feature_type IS 'Rendering type: boolean (checkmark), text (custom text), number (numeric value), limited (partial support)';

-- ============================================================================
-- COMPETITORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,

  -- Branding
  logo_url text,
  website_url text,

  -- Pricing information (JSONB for flexibility)
  pricing jsonb DEFAULT '{}'::jsonb,
  -- Example: {"starter": {"price": 29, "period": "month"}, "pro": {"price": 99, "period": "month"}}

  -- Status and ordering
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  display_order int DEFAULT 0,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT competitors_valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT competitors_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_competitors_slug ON competitors(slug);
CREATE INDEX idx_competitors_status ON competitors(status);
CREATE INDEX idx_competitors_order ON competitors(display_order);

-- Auto-update trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_competitors_updated_at'
  ) THEN
    CREATE TRIGGER update_competitors_updated_at
      BEFORE UPDATE ON competitors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE competitors IS 'Competitor profiles for comparison tables';
COMMENT ON COLUMN competitors.pricing IS 'JSONB with pricing tiers: {"tier": {"price": number, "period": "month"|"year"}}';

-- ============================================================================
-- COMPETITOR FEATURES TABLE (Junction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitor_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES comparison_features(id) ON DELETE CASCADE,

  -- Feature value for this competitor
  has_feature boolean DEFAULT false,
  value_text text,      -- For text-type features
  value_number decimal, -- For number-type features
  is_limited boolean DEFAULT false, -- "Limited" indicator

  -- Notes/tooltip content
  notes text,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique competitor-feature pairing
  CONSTRAINT unique_competitor_feature UNIQUE (competitor_id, feature_id)
);

-- Indexes
CREATE INDEX idx_competitor_features_competitor_id ON competitor_features(competitor_id);
CREATE INDEX idx_competitor_features_feature_id ON competitor_features(feature_id);

-- Auto-update trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_competitor_features_updated_at'
  ) THEN
    CREATE TRIGGER update_competitor_features_updated_at
      BEFORE UPDATE ON competitor_features
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE competitor_features IS 'Junction table mapping feature values to competitors';
COMMENT ON COLUMN competitor_features.is_limited IS 'Shows "Limited" badge instead of checkmark (amber color)';

-- ============================================================================
-- COMPARISON TABLES TABLE (Embeddable Configurations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS comparison_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,

  -- Table type configuration
  table_type text DEFAULT 'multi' CHECK (table_type IN ('single', 'multi')),

  -- For multi-competitor tables: selected competitors (order matters)
  competitor_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- For 1-on-1 tables: single competitor
  single_competitor_id uuid REFERENCES competitors(id) ON DELETE SET NULL,

  -- Selected categories to display (order matters)
  category_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- Override: specific features instead of full categories
  feature_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- PromptReviews feature overrides (per-table nuance)
  -- Default: all features show checkmark. Override specific features here.
  promptreviews_overrides jsonb DEFAULT '{}'::jsonb,
  -- Example: {"feature-slug": {"hasFeature": true, "isLimited": true, "notes": "Coming Q1 2025"}}

  -- Design settings for widget
  design jsonb DEFAULT '{}'::jsonb,
  -- Example: {"accentColor": "#4f46e5", "showPricing": true, "headerStyle": "sticky"}

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,

  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT comparison_tables_valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT comparison_tables_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT comparison_tables_type_check CHECK (
    (table_type = 'single' AND single_competitor_id IS NOT NULL) OR
    (table_type = 'multi' AND array_length(competitor_ids, 1) > 0) OR
    (status = 'draft') -- Allow incomplete drafts
  )
);

-- Indexes
CREATE INDEX idx_comparison_tables_slug ON comparison_tables(slug);
CREATE INDEX idx_comparison_tables_status ON comparison_tables(status);
CREATE INDEX idx_comparison_tables_type ON comparison_tables(table_type);
CREATE INDEX idx_comparison_tables_published_at ON comparison_tables(published_at DESC);

-- Auto-update trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comparison_tables_updated_at'
  ) THEN
    CREATE TRIGGER update_comparison_tables_updated_at
      BEFORE UPDATE ON comparison_tables
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE comparison_tables IS 'Embeddable comparison table configurations';
COMMENT ON COLUMN comparison_tables.table_type IS 'single: 1-on-1 comparison, multi: multiple competitors';
COMMENT ON COLUMN comparison_tables.promptreviews_overrides IS 'Override PromptReviews feature values per table (default: all features = true)';
COMMENT ON COLUMN comparison_tables.design IS 'Widget styling: accentColor, showPricing, headerStyle, etc.';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE comparison_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_tables ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: COMPARISON CATEGORIES
-- ============================================================================

-- Public can read all categories
CREATE POLICY "Public can read comparison categories"
  ON comparison_categories FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to comparison categories"
  ON comparison_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: COMPARISON FEATURES
-- ============================================================================

-- Public can read all features
CREATE POLICY "Public can read comparison features"
  ON comparison_features FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to comparison features"
  ON comparison_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: COMPETITORS
-- ============================================================================

-- Public can read active competitors
CREATE POLICY "Public can read active competitors"
  ON competitors FOR SELECT
  USING (status = 'active');

-- Admins have full access
CREATE POLICY "Admins have full access to competitors"
  ON competitors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: COMPETITOR FEATURES
-- ============================================================================

-- Public can read all competitor features
CREATE POLICY "Public can read competitor features"
  ON competitor_features FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to competitor features"
  ON competitor_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: COMPARISON TABLES
-- ============================================================================

-- Public can read published comparison tables
CREATE POLICY "Public can read published comparison tables"
  ON comparison_tables FOR SELECT
  USING (status = 'published');

-- Admins have full access
CREATE POLICY "Admins have full access to comparison tables"
  ON comparison_tables FOR ALL
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
 * Get full comparison table data for embedding
 * Returns all data needed to render a comparison widget
 */
CREATE OR REPLACE FUNCTION get_comparison_table_data(table_slug text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  table_record comparison_tables%ROWTYPE;
BEGIN
  -- Get the table configuration
  SELECT * INTO table_record
  FROM comparison_tables
  WHERE slug = table_slug AND status = 'published';

  IF table_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build the response
  SELECT jsonb_build_object(
    'id', table_record.id,
    'slug', table_record.slug,
    'name', table_record.name,
    'tableType', table_record.table_type,
    'design', table_record.design,
    'promptreviewsOverrides', table_record.promptreviews_overrides,
    'categories', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'name', c.name,
          'icon', c.icon_name,
          'features', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', f.id,
                'slug', f.slug,
                'name', f.name,
                'benefitName', COALESCE(f.benefit_framing, f.name),
                'type', f.feature_type,
                'description', f.description
              ) ORDER BY f.display_order
            )
            FROM comparison_features f
            WHERE f.category_id = c.id
            AND (
              array_length(table_record.feature_ids, 1) IS NULL
              OR f.id = ANY(table_record.feature_ids)
            )
          )
        ) ORDER BY c.display_order
      )
      FROM comparison_categories c
      WHERE c.id = ANY(table_record.category_ids)
    ),
    'competitors', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', comp.id,
          'slug', comp.slug,
          'name', comp.name,
          'logo', comp.logo_url,
          'website', comp.website_url,
          'pricing', comp.pricing,
          'features', (
            SELECT jsonb_object_agg(
              f.slug,
              jsonb_build_object(
                'hasFeature', cf.has_feature,
                'value', COALESCE(cf.value_text, cf.value_number::text),
                'isLimited', cf.is_limited,
                'notes', cf.notes
              )
            )
            FROM competitor_features cf
            JOIN comparison_features f ON f.id = cf.feature_id
            WHERE cf.competitor_id = comp.id
          )
        ) ORDER BY array_position(table_record.competitor_ids, comp.id)
      )
      FROM competitors comp
      WHERE comp.id = ANY(table_record.competitor_ids)
      AND comp.status = 'active'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_comparison_table_data IS 'Get all data needed to render a comparison widget by slug';
