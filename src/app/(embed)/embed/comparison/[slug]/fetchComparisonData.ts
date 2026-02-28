import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface FeatureValue {
  hasFeature: boolean;
  value: string | number | null;
  isLimited: boolean;
  notes: string | null;
}

interface CompetitorFeature {
  feature_id: string;
  has_feature: boolean;
  value_text: string | null;
  value_number: number | null;
  is_limited: boolean;
  notes: string | null;
  feature: {
    slug: string;
  };
}

export interface FormattedCompetitor {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  pricing: string | null;
  pricing_description: string | null;
  features: Record<string, FeatureValue>;
}

export interface FormattedCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  features: {
    id: string;
    slug: string;
    name: string;
    benefitName: string;
    type: string;
    description: string | null;
  }[];
}

export interface ComparisonData {
  id: string;
  slug: string;
  name: string;
  tableType: string;
  design: Record<string, unknown>;
  categories: FormattedCategory[];
  competitors: FormattedCompetitor[];
  allCompetitors: FormattedCompetitor[];
  promptReviews: {
    features: Record<string, FeatureValue>;
    pricing_description: string;
  };
  pricingNotes: Record<string, unknown>;
}

function formatCompetitorFeatures(features: CompetitorFeature[]): Record<string, FeatureValue> {
  const featureMap: Record<string, FeatureValue> = {};
  (features || []).forEach((cf) => {
    if (cf.feature?.slug) {
      featureMap[cf.feature.slug] = {
        hasFeature: cf.has_feature,
        value: cf.value_text || cf.value_number,
        isLimited: cf.is_limited,
        notes: cf.notes,
      };
    }
  });
  return featureMap;
}

/**
 * Fetch comparison table data by slug.
 * Used by both the SSR embed page and the JSON API route.
 * Returns null if the table is not found or not published.
 */
export async function fetchComparisonData(slug: string): Promise<ComparisonData | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get the published table
  const { data: table, error: tableError } = await supabase
    .from('comparison_tables')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (tableError || !table) {
    return null;
  }

  // Get categories for this table
  const { data: categories } = await supabase
    .from('comparison_categories')
    .select('*')
    .in('id', table.category_ids || [])
    .order('display_order');

  // Get features for these categories (or specific features if overridden)
  let featuresQuery = supabase
    .from('comparison_features')
    .select('*')
    .order('display_order');

  if (table.feature_ids && table.feature_ids.length > 0) {
    featuresQuery = featuresQuery.in('id', table.feature_ids);
  } else if (table.category_ids && table.category_ids.length > 0) {
    featuresQuery = featuresQuery.in('category_id', table.category_ids);
  }

  const { data: features } = await featuresQuery;

  // Get competitors for this table
  const competitorIds: string[] = table.table_type === 'single'
    ? [table.single_competitor_id]
    : table.competitor_ids || [];

  const competitorSelect = `
    *,
    features:competitor_features(
      feature_id,
      has_feature,
      value_text,
      value_number,
      is_limited,
      notes,
      feature:comparison_features(slug)
    )
  `;

  // Fetch ALL active competitors (for swap dropdown) and Prompt Reviews data in parallel
  const [allCompetitorsResult, promptReviewsResult] = await Promise.all([
    supabase
      .from('competitors')
      .select(competitorSelect)
      .eq('status', 'active')
      .or('is_us.is.null,is_us.eq.false')
      .order('display_order'),
    supabase
      .from('competitors')
      .select(competitorSelect)
      .eq('is_us', true)
      .single(),
  ]);

  const allCompetitorsRaw = allCompetitorsResult.data;
  const promptReviewsData = promptReviewsResult.data;

  // Filter to get just the table's configured competitors
  const competitors = (allCompetitorsRaw || []).filter(c =>
    competitorIds.filter(Boolean).includes(c.id)
  );

  // Format categories with their features
  const formattedCategories: FormattedCategory[] = (categories || []).map(cat => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    icon: cat.icon_name,
    features: (features || [])
      .filter(f => f.category_id === cat.id)
      .map(f => ({
        id: f.id,
        slug: f.slug,
        name: f.name,
        benefitName: f.benefit_framing || f.name,
        type: f.feature_type,
        description: f.description,
      })),
  }));

  // Format competitors with feature maps
  const formatCompetitor = (comp: Record<string, unknown>): FormattedCompetitor => ({
    id: comp.id as string,
    slug: comp.slug as string,
    name: comp.name as string,
    description: comp.description as string | null,
    logo: comp.logo_url as string | null,
    website: comp.website_url as string | null,
    pricing: comp.pricing as string | null,
    pricing_description: comp.pricing_description as string | null,
    features: formatCompetitorFeatures(comp.features as CompetitorFeature[]),
  });

  const formattedCompetitors = competitors.map(formatCompetitor);

  // Order competitors according to table configuration
  const orderedCompetitors = competitorIds
    .filter(Boolean)
    .map((id: string) => formattedCompetitors.find(c => c.id === id))
    .filter((c): c is FormattedCompetitor => c !== undefined);

  // Format ALL competitors for swap dropdown
  const formattedAllCompetitors = (allCompetitorsRaw || []).map(formatCompetitor);

  // Build PromptReviews feature values from database
  const promptReviewsFeatures: Record<string, FeatureValue> = {};

  if (promptReviewsData?.features) {
    (promptReviewsData.features as CompetitorFeature[]).forEach((cf) => {
      if (cf.feature?.slug) {
        promptReviewsFeatures[cf.feature.slug] = {
          hasFeature: cf.has_feature,
          value: cf.value_text || cf.value_number,
          isLimited: cf.is_limited,
          notes: cf.notes,
        };
      }
    });
  }

  // Fallback: ensure all features have a value (default to true if not in DB)
  (features || []).forEach(f => {
    if (!promptReviewsFeatures[f.slug]) {
      promptReviewsFeatures[f.slug] = {
        hasFeature: true,
        value: null,
        isLimited: false,
        notes: null,
      };
    }
  });

  return {
    id: table.id,
    slug: table.slug,
    name: table.name,
    tableType: table.table_type,
    design: table.design || {},
    categories: formattedCategories,
    competitors: orderedCompetitors,
    allCompetitors: formattedAllCompetitors,
    promptReviews: {
      features: promptReviewsFeatures,
      pricing_description: promptReviewsData?.pricing_description || 'Pricing tiers start at $20/month. $85/month for multi-location businesses.',
    },
    pricingNotes: table.pricing_notes || {},
  };
}
