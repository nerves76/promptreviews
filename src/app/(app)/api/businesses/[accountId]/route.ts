/**
 * Business by Account ID API Route
 * 
 * This endpoint fetches and updates business data for a specific account_id
 * using the service key to bypass RLS policies for public access
 */

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // First, honor Authorization header if provided (Share modal fetches via fetch API)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      return data.user;
    }
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

async function userHasAccountAccess(
  serviceSupabase: SupabaseClient,
  userId: string,
  accountId: string | null,
) {
  if (!accountId) return false;

  const { data } = await serviceSupabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .maybeSingle();

  if (data) {
    return true;
  }

  const { data: accountRecord } = await serviceSupabase
    .from('accounts')
    .select('created_by')
    .eq('id', accountId)
    .maybeSingle();

  return accountRecord?.created_by === userId;
}

async function loadBusinessRecord(
  serviceSupabase: SupabaseClient,
  accountParam: string,
) {
  // First try to find by account_id
  const { data: byAccount, error: byAccountError } = await serviceSupabase
    .from('businesses')
    .select('*')
    .eq('account_id', accountParam)
    .maybeSingle();

  if (byAccount) {
    return byAccount;
  }

  if (byAccountError && byAccountError.code && byAccountError.code !== 'PGRST116') {
    throw byAccountError;
  }

  // Fall back to treating the param as a business ID
  const { data: byId, error: byIdError } = await serviceSupabase
    .from('businesses')
    .select('*')
    .eq('id', accountParam)
    .maybeSingle();

  if (byIdError && byIdError.code && byIdError.code !== 'PGRST116') {
    throw byIdError;
  }

  return byId || null;
}

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

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const serviceSupabase = createServiceRoleClient();
    const business = await loadBusinessRecord(serviceSupabase, accountId);

    const accountIdForAccess = business?.account_id || accountId;
    const hasAccess = await userHasAccountAccess(serviceSupabase, user.id, accountIdForAccess);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this account" },
        { status: 403 }
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

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    const serviceSupabase = createServiceRoleClient();
    const existingBusiness = await loadBusinessRecord(serviceSupabase, accountId);
    const accountIdForAccess = existingBusiness?.account_id || accountId;
    const hasAccess = await userHasAccountAccess(serviceSupabase, user.id, accountIdForAccess);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this account" },
        { status: 403 }
      );
    }

    if (!existingBusiness) {
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
    const { data: updatedBusiness, error } = await serviceSupabase
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
      const { error: accountUpdateError } = await serviceSupabase
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
