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

    console.log(`[PROMPT-PAGE-BY-SLUG] Successfully fetched prompt page: ${promptPage.id}`);

    // Get business profile - try businesses table first, fallback to business_locations
    let businessProfile = null;

    // Try businesses table first with a simple select
    const { data: businessData, error: businessErr } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('account_id', promptPage.account_id)
      .maybeSingle();

    if (businessErr) {
      console.log('[PROMPT-PAGE-BY-SLUG] Businesses table error, trying business_locations:', businessErr);
      
      // Fallback to business_locations table
      const { data: locationData, error: locationErr } = await supabaseAdmin
        .from('business_locations')
        .select('*')
        .eq('account_id', promptPage.account_id)
        .eq('is_active', true)
        .maybeSingle();

      if (locationErr) {
        console.error('[PROMPT-PAGE-BY-SLUG] Error fetching business data from both tables:', { businessErr, locationErr });
        // Continue without business profile - the prompt page can still work
        businessProfile = null;
      } else {
        // Map business_locations data to businesses format
        businessProfile = locationData ? {
          ...locationData,
          business_website: locationData.website_url,
          // Set defaults for missing styling fields
          primary_font: 'Inter',
          secondary_font: 'Inter',
          primary_color: '#4F46E5',
          secondary_color: '#818CF8',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          background_type: 'gradient',
          gradient_start: '#4F46E5',
          gradient_middle: '#818CF8',
          gradient_end: '#C7D2FE'
        } : null;
      }
    } else {
      businessProfile = businessData;
    }

    // ⚡ PERFORMANCE: Set caching headers for faster subsequent loads
    const response = NextResponse.json({
      promptPage: promptPage,
      businessProfile: businessProfile
    });
    
    // Cache for 5 minutes for dynamic content, 1 hour for CDN
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60');
    
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