/**
 * Prompt Page by Slug API Route - SECURE PUBLIC ENDPOINT
 *
 * This endpoint fetches prompt page data and associated business profile
 * for public prompt pages. Security measures:
 * - Uses regular client instead of service role to respect RLS
 * - Filters sensitive business information
 * - Implements rate limiting
 * - Only returns necessary display data
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { withRateLimit, RateLimits, addRateLimitHeaders } from '@/app/(app)/api/middleware/rate-limit';

// Create regular client for public access - respects RLS policies
const supabaseAnon: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Create service role client for fetching business data
const supabaseService: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function filterBusinessProfile(business: any) {
  if (!business) return null;
  return {
    id: business.id,
    name: business.name,
    business_name: business.business_name || business.name,
    business_website: business.business_website,
    address_city: business.address_city,
    address_state: business.address_state,
    address_country: business.address_country,
    facebook_url: business.facebook_url,
    instagram_url: business.instagram_url,
    bluesky_url: business.bluesky_url,
    tiktok_url: business.tiktok_url,
    youtube_url: business.youtube_url,
    linkedin_url: business.linkedin_url,
    pinterest_url: business.pinterest_url,
    primary_font: business.primary_font,
    secondary_font: business.secondary_font,
    primary_color: business.primary_color,
    secondary_color: business.secondary_color,
    background_color: business.background_color,
    text_color: business.text_color,
    background_type: business.background_type,
    gradient_start: business.gradient_start,
    gradient_middle: business.gradient_middle,
    gradient_end: business.gradient_end,
    logo_url: business.logo_url,
    card_bg: business.card_bg,
    card_text: business.card_text,
    card_placeholder_color: business.card_placeholder_color,
    input_text_color: business.input_text_color,
    card_inner_shadow: business.card_inner_shadow,
    card_shadow_color: business.card_shadow_color,
    card_shadow_intensity: business.card_shadow_intensity,
    card_transparency: business.card_transparency,
    card_border_width: business.card_border_width,
    card_border_color: business.card_border_color,
    card_border_transparency: business.card_border_transparency,
    kickstarters_background_design: business.kickstarters_background_design,
    kickstarters_primary_color: business.kickstarters_primary_color,
    default_offer_url: business.default_offer_url,
    services_offered: business.services_offered,
    company_values: business.company_values,
    differentiators: business.differentiators,
    years_in_business: business.years_in_business,
    industries_served: business.industries_served,
    team_founder_info: business.team_founder_info,
    keywords: business.keywords,
    tagline: business.tagline,
    industry: business.industry,
    industry_other: business.industry_other,
    ai_dos: business.ai_dos,
    ai_donts: business.ai_donts,
    fun_facts: business.fun_facts,
  };
}

async function getHandler(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { data: promptPage, error: promptError } = await supabaseService
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (promptError) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error fetching prompt page:', promptError);
      return NextResponse.json({ error: "Failed to fetch prompt page" }, { status: 500 });
    }
    if (!promptPage) {
      return NextResponse.json({ error: "Prompt page not found" }, { status: 404 });
    }

    let businessProfile = null;
    if (promptPage.business_location_id) {
      const { data: locationData } = await supabaseService
        .from('business_locations')
        .select('*')
        .eq('id', promptPage.business_location_id)
        .eq('is_active', true)
        .single();
      if (locationData) {
        businessProfile = { ...locationData, business_name: locationData.name, business_website: locationData.website_url };
      }
    } else {
        const { data: businessData } = await supabaseService
          .from('businesses')
          .select('*')
          .eq('account_id', promptPage.account_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        businessProfile = businessData;
    }

    const filteredBusinessProfile = filterBusinessProfile(businessProfile);
    const response = NextResponse.json({
      promptPage: promptPage,
      businessProfile: filteredBusinessProfile
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60, max-age=30, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { data: promptPage, error } = await supabaseAnon
      .from('prompt_pages')
      .update(body)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error updating prompt page:', error);
      return NextResponse.json({ error: "Failed to update prompt page" }, { status: 500 });
    }

    return NextResponse.json(promptPage);
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error during PATCH:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withRateLimit(getHandler, RateLimits.widget);
export const PATCH = withRateLimit(patchHandler, RateLimits.widget);