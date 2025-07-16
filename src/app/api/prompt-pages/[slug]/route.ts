/**
 * Prompt Page by Slug API Route
 * 
 * This endpoint fetches prompt page data and associated business profile
 * in a single request for optimal performance
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from '@/utils/supabaseClient';

// 🔧 CONSOLIDATION: Use centralized service role client
const supabaseAdmin = createServiceRoleClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Fetching prompt page for slug: ${slug}`);

    // First, get the prompt page
    const { data: promptPage, error: promptError } = await supabaseAdmin
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (promptError) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error fetching prompt page:', promptError);
      return NextResponse.json(
        { error: "Failed to fetch prompt page" },
        { status: 500 }
      );
    }

    if (!promptPage) {
      console.log(`[PROMPT-PAGE-BY-SLUG] No prompt page found for slug: ${slug}`);
      return NextResponse.json(
        { error: "Prompt page not found" },
        { status: 404 }
      );
    }

    // Then get the business profile using account_id
    const { data: businessProfile, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select(`
        id,
        name,
        logo_url,
        logo_print_url,
        primary_font,
        secondary_font,
        primary_color,
        secondary_color,
        background_color,
        text_color,
        facebook_url,
        instagram_url,
        bluesky_url,
        tiktok_url,
        youtube_url,
        linkedin_url,
        pinterest_url,
        background_type,
        gradient_start,
        gradient_middle,
        gradient_end,
        business_website,
        default_offer_url,
        card_bg,
        card_text,
        card_inner_shadow,
        card_shadow_color,
        card_shadow_intensity,
        account_id
      `)
      .eq('account_id', promptPage.account_id)
      .maybeSingle();

    if (businessError) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error fetching business profile:', businessError);
      return NextResponse.json(
        { error: "Failed to fetch business profile" },
        { status: 500 }
      );
    }

    // ⚡ PERFORMANCE: Set caching headers for faster subsequent loads
    const response = NextResponse.json({
      promptPage: promptPage,
      businessProfile: businessProfile
    });
    
    // Cache for 5 minutes for dynamic content, 1 hour for CDN
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60');
    
    console.log(`[PROMPT-PAGE-BY-SLUG] Successfully fetched prompt page: ${promptPage.id}`);
    return response;
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Updating prompt page for slug: ${slug}`);

    // 🔧 CONSOLIDATED: Use centralized service role client
    const { data: promptPage, error } = await supabaseAdmin
      .from('prompt_pages')
      .update(body)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error updating prompt page:', error);
      return NextResponse.json(
        { error: "Failed to update prompt page" },
        { status: 500 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Successfully updated prompt page: ${promptPage.id}`);
    return NextResponse.json(promptPage);
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 