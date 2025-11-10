/**
 * Business by Account ID API Route
 * 
 * This endpoint fetches and updates business data for a specific account_id
 * using the service key to bypass RLS policies for public access
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }


    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error('[BUSINESS-BY-ACCOUNT] Error fetching business:', error);
      return NextResponse.json(
        { error: "Failed to fetch business" },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('[BUSINESS-BY-ACCOUNT] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Log the incoming request for debugging
    console.log('[BUSINESS-BY-ACCOUNT] PUT request received:', {
      accountId,
      bodyKeys: Object.keys(body),
      hasAiDonts: 'ai_donts' in body,
      aiDontsValue: body.ai_donts,
      aiDontsType: typeof body.ai_donts
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, try to find business by account_id
    let { data: existingBusiness, error: fetchError } = await supabase
      .from('businesses')
      .select('id, account_id, name')
      .eq('account_id', accountId)
      .single();

    // If not found by account_id, try by business id (for backwards compatibility)
    if (fetchError?.code === 'PGRST116' || !existingBusiness) {
      const result = await supabase
        .from('businesses')
        .select('id, account_id, name')
        .eq('id', accountId)
        .single();
      
      existingBusiness = result.data;
      fetchError = result.error;
    }

    if (fetchError || !existingBusiness) {
      console.error('[BUSINESS-BY-ACCOUNT] Fetch error:', fetchError);
      return NextResponse.json(
        { error: `No business found for account/id ${accountId}` },
        { status: 404 }
      );
    }


    // Update the business record
    // Filter body to only include valid business table columns
    // This prevents errors from fields that belong to prompt_pages or other tables
    const validBusinessFields = [
      'name', 'facebook_url', 'instagram_url', 'bluesky_url', 'tiktok_url',
      'youtube_url', 'linkedin_url', 'pinterest_url', 'primary_font', 'secondary_font',
      'primary_color', 'secondary_color', 'background_color', 'text_color',
      'address_street', 'address_city', 'address_state', 'address_zip', 'address_country',
      'offer_url', 'background_type', 'gradient_start', 'gradient_middle', 'gradient_end',
      'offer_learn_more_url', 'default_offer_enabled', 'default_offer_title', 'default_offer_body',
      'default_offer_url', 'default_offer_timelock', 'card_inner_shadow', 'card_shadow_color',
      'card_shadow_intensity', 'card_transparency', 'logo_print_url', 'about_us',
      'kickstarters_enabled', 'selected_kickstarters', 'kickstarters_background_design',
      'custom_kickstarters', 'ai_dos', 'ai_donts', 'taglines', 'team_info',
      'review_platforms', 'platform_word_counts', 'logo_url', 'keywords', 'tagline',
      'company_values', 'services_offered', 'differentiators', 'years_in_business',
      'industries_served', 'industry', 'industries_other',
      'business_website', 'business_email', 'phone', 'referral_source', 'referral_source_other',
      // Default settings for new prompt pages
      'ai_button_enabled', 'fix_grammar_enabled', 'emoji_sentiment_enabled',
      'emoji_sentiment_question', 'emoji_feedback_message', 'emoji_thank_you_message',
      'emoji_feedback_popup_header', 'emoji_feedback_page_header',
      'falling_enabled', 'falling_icon', 'falling_icon_color',
      'show_friendly_note', 'friendly_note', 'recent_reviews_enabled', 'recent_reviews_scope'
    ];

    const filteredBody: any = {};
    for (const key of validBusinessFields) {
      if (key in body) {
        filteredBody[key] = body[key];
      }
    }

    console.log('[BUSINESS-BY-ACCOUNT] Filtered body for update:', {
      originalKeys: Object.keys(body),
      filteredKeys: Object.keys(filteredBody),
      removedKeys: Object.keys(body).filter(k => !(k in filteredBody))
    });

    // Use the business id for the update
    const { data: updatedBusiness, error } = await supabase
      .from('businesses')
      .update(filteredBody)
      .eq('id', existingBusiness.id)
      .select()
      .single();

    if (error) {
      console.error('[BUSINESS-BY-ACCOUNT] Error updating business:', error);
      console.error('[BUSINESS-BY-ACCOUNT] Error details:', JSON.stringify(error, null, 2));
      console.error('[BUSINESS-BY-ACCOUNT] Error code:', error.code);
      console.error('[BUSINESS-BY-ACCOUNT] Error hint:', error.hint);
      return NextResponse.json(
        { 
          error: error.message || "Failed to update business", 
          details: error,
          code: error.code,
          hint: error.hint 
        },
        { status: 500 }
      );
    }

    
    // Also update the business_name in the accounts table if it was changed
    // This ensures the account switcher shows the updated name
    if (body.name && existingBusiness.account_id) {
      const { error: accountUpdateError } = await supabase
        .from('accounts')
        .update({ business_name: body.name })
        .eq('id', existingBusiness.account_id);
      
      if (accountUpdateError) {
        console.error('[BUSINESS-BY-ACCOUNT] Failed to update business_name in accounts table:', accountUpdateError);
        // Don't fail the whole request if this update fails
      }
    }
    
    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error('[BUSINESS-BY-ACCOUNT] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 