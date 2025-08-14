/**
 * Prompt Page by Slug API Route
 * 
 * This endpoint fetches prompt page data and associated business profile
 * in a single request for optimal performance
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from '@/auth/providers/supabase';

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

    // DEVELOPMENT MODE BYPASS - Return mock Universal prompt page
    let promptPage = null;
    let promptError = null;
    
    if (process.env.NODE_ENV === 'development' && slug === 'universal-mdwd0peh') {
      console.log('🔧 DEV MODE: Returning mock Universal prompt page data');
      
      // Default mock data
      let mockData = {
        id: '0f1ba885-07d6-4698-9e94-a63d990c65e0',
        account_id: '12345678-1234-5678-9abc-123456789012',
        slug: 'universal-mdwd0peh',
        is_universal: true,
        campaign_type: 'public',
        type: 'service',
        status: 'complete',
        offer_enabled: false,
        offer_title: 'Review Rewards',
        offer_body: '',
        offer_url: '',
        emoji_sentiment_enabled: false,
        emoji_sentiment_question: '',
        emoji_feedback_message: '',
        emoji_thank_you_message: '',
        emoji_feedback_popup_header: '',
        emoji_feedback_page_header: '',
        review_platforms: [],
        falling_icon: 'star',
        falling_icon_color: '#fbbf24',
        falling_enabled: false, // Don't auto-fall when emoji sentiment is enabled
        ai_button_enabled: true,
        fix_grammar_enabled: true,
        note_popup_enabled: false,
        show_friendly_note: false,
        friendly_note: '',
        kickstarters_enabled: false,
        selected_kickstarters: [],
        recent_reviews_enabled: true,
        recent_reviews_scope: 'current_page',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Try to get saved data from request headers (since API routes can't access localStorage directly)
      const savedDataHeader = request.headers.get('x-dev-universal-data');
      if (savedDataHeader) {
        try {
          const savedData = JSON.parse(savedDataHeader);
          console.log('🔧 DEV MODE: Using saved Universal page data from header');
          // Merge saved data with defaults
          mockData = { ...mockData, ...savedData };
        } catch (e) {
          console.warn('🔧 DEV MODE: Failed to parse saved Universal data from header');
        }
      }
      
      promptPage = mockData;
    } else {
      // First, get the prompt page
      const { data: dbPromptPage, error: dbPromptError } = await supabaseAdmin
        .from('prompt_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      promptPage = dbPromptPage;
      promptError = dbPromptError;
    }

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

    // Get business profile - check if this is a location-specific page first
    let businessProfile = null;

    // If this prompt page is associated with a specific location, get location data
    if (promptPage.business_location_id) {
      console.log(`[PROMPT-PAGE-BY-SLUG] Fetching location-specific data for location ID: ${promptPage.business_location_id}`);
      
      const { data: locationData, error: locationErr } = await supabaseAdmin
        .from('business_locations')
        .select('*')
        .eq('id', promptPage.business_location_id)
        .eq('is_active', true)
        .single();

      if (locationErr) {
        console.error('[PROMPT-PAGE-BY-SLUG] Error fetching location data:', locationErr);
        // Fall back to general business data
      } else if (locationData) {
        // Map business_locations data to businesses format for location-specific pages
        businessProfile = {
          ...locationData,
          business_name: locationData.name, // Use location name as business name
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
        };
        console.log(`[PROMPT-PAGE-BY-SLUG] Using location-specific data for: ${locationData.name}`);
      }
    }

    // If no location-specific data found, fall back to general business data
    if (!businessProfile) {
      console.log('[PROMPT-PAGE-BY-SLUG] Fetching general business data');
      
      // DEVELOPMENT MODE BYPASS - Return mock business profile
      if (process.env.NODE_ENV === 'development' && promptPage.account_id === '12345678-1234-5678-9abc-123456789012') {
        console.log('🔧 DEV MODE: Returning mock business profile data for public page');
        businessProfile = {
          id: '6762c76a-8677-4c7f-9a0f-f444024961a2',
          account_id: '12345678-1234-5678-9abc-123456789012',
          name: 'Chris Bolton',
          business_name: 'Chris Bolton',
          business_email: 'chris@diviner.agency',
          address_street: '2652 SE 89th Ave',
          address_city: 'Portland',
          address_state: 'Oregon',
          address_zip: '97266',
          address_country: 'United States',
          phone: '',
          business_website: '',
          review_platforms: [],
          default_offer_enabled: false,
          default_offer_title: 'Review Rewards',
          default_offer_body: '',
          default_offer_url: '',
          primary_font: 'Inter',
          secondary_font: 'Inter',
          primary_color: '#4F46E5',
          secondary_color: '#818CF8',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          background_type: 'gradient',
          gradient_start: '#4F46E5',
          gradient_middle: '#818CF8',
          gradient_end: '#C7D2FE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        // Try businesses table first with a simple select
        // For Universal pages, if there are multiple businesses, get the first one
        const { data: businessData, error: businessErr } = await supabaseAdmin
          .from('businesses')
          .select('*')
          .eq('account_id', promptPage.account_id)
          .limit(1)
          .single();

        if (businessErr) {
          console.log('[PROMPT-PAGE-BY-SLUG] Businesses table error, trying business_locations:', businessErr);
          
          // Fallback to business_locations table
          const { data: locationData, error: locationErr } = await supabaseAdmin
            .from('business_locations')
            .select('*')
            .eq('account_id', promptPage.account_id)
            .eq('is_active', true)
            .limit(1)
            .single();

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
      }
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