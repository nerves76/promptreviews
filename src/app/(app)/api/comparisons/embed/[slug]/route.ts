import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface FeatureValue {
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

/**
 * GET /api/comparisons/embed/[slug]
 * Public endpoint to fetch comparison table data for embedding
 * No authentication required
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the published table
    const { data: table, error: tableError } = await supabase
      .from('comparison_tables')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (tableError || !table) {
      const response = NextResponse.json(
        { error: 'Comparison table not found' },
        { status: 404 }
      );
      setCorsHeaders(response);
      return response;
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
    const competitorIds = table.table_type === 'single'
      ? [table.single_competitor_id]
      : table.competitor_ids || [];

    // Fetch ALL active competitors (for swap dropdown) and table's competitors
    const { data: allCompetitorsRaw } = await supabase
      .from('competitors')
      .select(`
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
      `)
      .eq('status', 'active')
      .order('display_order');

    // Filter to get just the table's configured competitors
    const competitors = (allCompetitorsRaw || []).filter(c =>
      competitorIds.filter(Boolean).includes(c.id)
    );

    // Build the response in embed-friendly format
    const formattedCategories = (categories || []).map(cat => ({
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

    // Format competitors with their feature values as a map
    const formattedCompetitors = (competitors || []).map(comp => {
      const featureMap: Record<string, FeatureValue> = {};

      (comp.features as CompetitorFeature[] || []).forEach((cf) => {
        if (cf.feature?.slug) {
          featureMap[cf.feature.slug] = {
            hasFeature: cf.has_feature,
            value: cf.value_text || cf.value_number,
            isLimited: cf.is_limited,
            notes: cf.notes,
          };
        }
      });

      return {
        id: comp.id,
        slug: comp.slug,
        name: comp.name,
        description: comp.description,
        logo: comp.logo_url,
        website: comp.website_url,
        pricing: comp.pricing,
        pricing_description: comp.pricing_description,
        features: featureMap,
      };
    });

    // Order competitors according to table configuration
    const orderedCompetitors = competitorIds
      .filter(Boolean)
      .map((id: string) => formattedCompetitors.find(c => c.id === id))
      .filter(Boolean);

    // Format ALL competitors for swap dropdown
    const formattedAllCompetitors = (allCompetitorsRaw || []).map(comp => {
      const featureMap: Record<string, FeatureValue> = {};

      (comp.features as CompetitorFeature[] || []).forEach((cf) => {
        if (cf.feature?.slug) {
          featureMap[cf.feature.slug] = {
            hasFeature: cf.has_feature,
            value: cf.value_text || cf.value_number,
            isLimited: cf.is_limited,
            notes: cf.notes,
          };
        }
      });

      return {
        id: comp.id,
        slug: comp.slug,
        name: comp.name,
        description: comp.description,
        logo: comp.logo_url,
        website: comp.website_url,
        pricing: comp.pricing,
        pricing_description: comp.pricing_description,
        features: featureMap,
      };
    });

    // Build PromptReviews feature values (default to all true, with overrides)
    const promptReviewsFeatures: Record<string, FeatureValue> = {};
    const overrides = (table.promptreviews_overrides || {}) as Record<string, Partial<FeatureValue>>;

    (features || []).forEach(f => {
      const override = overrides[f.slug];
      promptReviewsFeatures[f.slug] = {
        hasFeature: override?.hasFeature ?? true,
        value: override?.value ?? null,
        isLimited: override?.isLimited ?? false,
        notes: override?.notes ?? null,
      };
    });

    const responseData = {
      id: table.id,
      slug: table.slug,
      name: table.name,
      tableType: table.table_type,
      design: table.design || {},
      categories: formattedCategories,
      competitors: orderedCompetitors,
      allCompetitors: formattedAllCompetitors, // All competitors for swap dropdown
      promptReviews: {
        features: promptReviewsFeatures,
      },
      pricingNotes: table.pricing_notes || {},
    };

    const response = NextResponse.json(responseData);
    setCorsHeaders(response);
    // Cache for 5 minutes on edge
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    return response;
  } catch (error) {
    console.error('Error in GET /api/comparisons/embed/[slug]:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    setCorsHeaders(response);
    return response;
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  setCorsHeaders(response);
  return response;
}

/**
 * Set CORS headers for cross-origin embed requests
 */
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
}
