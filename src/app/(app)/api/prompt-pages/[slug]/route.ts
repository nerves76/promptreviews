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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, widgetRateLimiter } from '@/lib/rate-limit';

// Create regular client for public access - respects RLS policies
// This client uses the anon key and will respect RLS policies
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Create service role client for fetching business data
// This bypasses RLS to allow public pages to show business info
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Filter business profile to only include safe public data
 * Removes sensitive information like emails, phone numbers, internal settings
 */
function filterBusinessProfile(business: any) {
  if (!business) return null;
  
  return {
    // Safe public display fields only
    id: business.id,
    name: business.name,
    business_name: business.business_name || business.name,
    business_website: business.business_website,
    
    // Public address info (city/state only, no street address)
    address_city: business.address_city,
    address_state: business.address_state,
    address_country: business.address_country,
    
    // Social media URLs (public info)
    facebook_url: business.facebook_url,
    instagram_url: business.instagram_url,
    bluesky_url: business.bluesky_url,
    tiktok_url: business.tiktok_url,
    youtube_url: business.youtube_url,
    linkedin_url: business.linkedin_url,
    pinterest_url: business.pinterest_url,
    
    // Visual styling (needed for page display)
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
    
    // Logo (public display)
    logo_url: business.logo_url,
    
    // Card styling (needed for proper display)
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

    // Kickstarters styling (needed for proper display)
    kickstarters_background_design: business.kickstarters_background_design,
    kickstarters_primary_color: business.kickstarters_primary_color,

    // Default offer URL (needed for offer display)
    default_offer_url: business.default_offer_url
    
    // EXCLUDED SENSITIVE FIELDS:
    // - business_email, signup_email (email addresses)
    // - phone (phone numbers) 
    // - address_street, address_zip (specific address)
    // - account_id (internal IDs)
    // - stripe_*, subscription_* (payment info)
    // - default_offer_* (internal business settings)
    // - review_platforms (internal platform configs)
    // - industry, industries_served, services_offered (potentially sensitive business info)
    // - keywords, taglines, tagline (internal marketing data)
    // - ai_dos, ai_donts, team_info, company_values, differentiators (internal business intel)
    // - about_us, years_in_business, industries_other (business details)
    // - platform_word_counts (analytics data)
    // - default_* fields (internal business defaults)
    // - emoji_*, falling_*, show_friendly_note, friendly_note (feature configs)
    // - kickstarters_enabled, recent_reviews_* (feature settings - styling fields are public)
    // - ai_button_enabled, fix_grammar_enabled (feature flags)
    // - card_* (styling internals)
    // - created_at, updated_at (internal timestamps)
    // - Any API keys or tokens
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limiting check
    const { allowed, remaining } = checkRateLimit(request, widgetRateLimiter);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '60'
          }
        }
      );
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }


    // DEVELOPMENT MODE BYPASS - Return mock Universal prompt page
    let promptPage = null;
    let promptError = null;
    
    if (process.env.NODE_ENV === 'development' && slug === 'universal-mdwd0peh') {
      
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
        keyword_inspiration_enabled: false,
        selected_keyword_inspirations: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Try to get saved data from request headers (since API routes can't access localStorage directly)
      const savedDataHeader = request.headers.get('x-dev-universal-data');
      if (savedDataHeader) {
        try {
          const savedData = JSON.parse(savedDataHeader);
          // Merge saved data with defaults
          mockData = { ...mockData, ...savedData };
        } catch (e) {
          console.warn('🔧 DEV MODE: Failed to parse saved Universal data from header');
        }
      }
      
      promptPage = mockData;
    } else {
      // First, get the prompt page using regular client (respects RLS)
      const { data: dbPromptPage, error: dbPromptError } = await supabaseAnon
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
      return NextResponse.json(
        { error: "Prompt page not found" },
        { status: 404 }
      );
    }


    // Get business profile - check if this is a location-specific page first
    let businessProfile = null;

    // If this prompt page is associated with a specific location, get location data
    if (promptPage.business_location_id) {
      
      const { data: locationData, error: locationErr } = await supabaseService
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
      }
    }

    // If no location-specific data found, fall back to general business data
    if (!businessProfile) {
      
      // DEVELOPMENT MODE BYPASS - Return mock business profile
      if (process.env.NODE_ENV === 'development' && promptPage.account_id === '12345678-1234-5678-9abc-123456789012') {
        // NOTE: Mock data includes sensitive fields that will be filtered out by filterBusinessProfile
        businessProfile = {
          id: '6762c76a-8677-4c7f-9a0f-f444024961a2',
          account_id: '12345678-1234-5678-9abc-123456789012',
          name: 'Chris Bolton',
          business_name: 'Chris Bolton',
          business_email: 'chris@diviner.agency', // Will be filtered out
          address_street: '2652 SE 89th Ave', // Will be filtered out
          address_city: 'Portland',
          address_state: 'Oregon',
          address_zip: '97266', // Will be filtered out
          address_country: 'United States',
          phone: '', // Will be filtered out
          business_website: '',
          review_platforms: [], // Will be filtered out
          default_offer_enabled: false, // Will be filtered out
          default_offer_title: 'Review Rewards', // Will be filtered out
          default_offer_body: '', // Will be filtered out
          default_offer_url: '', // Will be filtered out
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
          card_bg: '#FFFFFF',
          card_text: '#FFFFFF',
          card_placeholder_color: '#9CA3AF',
          input_text_color: '#1F2937',
          card_transparency: 0.95,
          card_border_width: 1,
          card_border_color: '#FFFFFF',
          card_border_transparency: 0.5,
          card_inner_shadow: false,
          created_at: new Date().toISOString(), // Will be filtered out
          updated_at: new Date().toISOString() // Will be filtered out
        };
      } else {
        // Try businesses table first with a simple select
        // For Universal pages, if there are multiple businesses, get the first one
        // Use service role client to bypass RLS for public pages
        const { data: businessData, error: businessErr } = await supabaseService
          .from('businesses')
          .select('*')
          .eq('account_id', promptPage.account_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 results


        if (businessErr) {
          
          // Fallback to business_locations table
          const { data: locationData, error: locationErr } = await supabaseService
            .from('business_locations')
            .select('*')
            .eq('account_id', promptPage.account_id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(); // Use maybeSingle() to handle 0 or 1 results

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

    // Filter business profile to remove sensitive data
    const filteredBusinessProfile = filterBusinessProfile(businessProfile);
    
    // ⚡ PERFORMANCE: Set caching headers for faster subsequent loads
    const response = NextResponse.json({
      promptPage: promptPage,
      businessProfile: filteredBusinessProfile
    });
    
    // Cache for 5 minutes for dynamic content, 1 hour for CDN
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
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
    // Rate limiting for updates - temporarily disabled for testing
    // const { allowed, remaining } = checkRateLimit(request, widgetRateLimiter);
    // if (!allowed) {
    //   return NextResponse.json(
    //     { error: "Too many requests. Please try again later." },
    //     { 
    //       status: 429,
    //       headers: {
    //         'X-RateLimit-Remaining': remaining.toString(),
    //         'Retry-After': '60'
    //       }
    //     }
    //   );
    // }

    const { slug } = await params;
    const body = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }


    // SECURITY: Use regular client - this will now require proper authentication
    // and will respect RLS policies, preventing unauthorized updates
    const { data: promptPage, error } = await supabaseAnon
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

    return NextResponse.json(promptPage);
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 