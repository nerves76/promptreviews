/**
 * Review Submissions API Route
 *
 * This endpoint handles review submissions using the service key to bypass RLS policies.
 * SECURITY: Only whitelisted fields are accepted from the client. Sensitive fields like
 * account_id, verified, star_rating are derived server-side or blocked.
 */

import { NextRequest, NextResponse } from "next/server";

// Fields that clients are allowed to submit
const ALLOWED_FIELDS = new Set([
  'prompt_page_id',
  'platform',
  'status',
  'first_name',
  'last_name',
  'reviewer_name',
  'reviewer_role',
  'review_content',
  'review_group_id',
  'user_agent',
  'photo_url',
  'emoji_sentiment_selection',
  'review_type',
  'email',
  'phone',
  'prompt_page_type',
]);

// Fields that should NEVER be set by clients (security-sensitive)
const BLOCKED_FIELDS = new Set([
  'account_id',
  'business_id',
  'verified',
  'verified_at',
  'star_rating',
  'imported_from_google',
  'google_review_id',
  'google_location_id',
  'google_location_name',
  'google_business_location_id',
  'auto_verification_status',
  'auto_verified_at',
  'verification_attempts',
  'verification_match_score',
  'contact_id',
]);

/**
 * Look up prompt page data including account_id and location info
 */
async function getPromptPageData(
  supabase: any,
  promptPageId: string
): Promise<{ accountId: string; locationName: string | null } | null> {
  const { data, error } = await supabase
    .from('prompt_pages')
    .select(`
      account_id,
      business_location_id,
      business_locations (
        address_city,
        address_state,
        address_zip
      )
    `)
    .eq('id', promptPageId)
    .single();

  if (error || !data?.account_id) {
    return null;
  }

  let locationName: string | null = null;
  if (data.business_locations) {
    const loc = data.business_locations;
    if (loc.address_city) {
      const stateZip = [loc.address_state, loc.address_zip].filter(Boolean).join(' ');
      locationName = [loc.address_city, stateZip].filter(Boolean).join(', ');
    }
  }

  return {
    accountId: data.account_id,
    locationName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate required field
    if (!body.prompt_page_id) {
      return NextResponse.json(
        { error: "prompt_page_id is required" },
        { status: 400 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up prompt page to get account_id (NEVER trust client for this)
    const promptPageData = await getPromptPageData(supabase, body.prompt_page_id);
    if (!promptPageData) {
      return NextResponse.json(
        { error: "Invalid prompt_page_id" },
        { status: 400 }
      );
    }

    // Build sanitized insert object with only allowed fields
    const sanitizedData: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (BLOCKED_FIELDS.has(key)) {
        // Silently ignore blocked fields (don't error, just don't include)
        console.warn(`[REVIEW-SUBMISSIONS] Blocked field ignored: ${key}`);
        continue;
      }
      if (ALLOWED_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
      // Unknown fields are also ignored for forward compatibility
    }

    // Set server-derived fields
    sanitizedData.account_id = promptPageData.accountId;
    if (promptPageData.locationName) {
      sanitizedData.location_name = promptPageData.locationName;
    }

    // Copy review_content to review_text_copy for auto-verification matching
    // The cron job uses review_text_copy to match against Google reviews
    if (sanitizedData.review_content) {
      sanitizedData.review_text_copy = sanitizedData.review_content;
    }

    const { data: submission, error } = await supabase
      .from('review_submissions')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error('[REVIEW-SUBMISSIONS] Error creating review submission:', error);
      return NextResponse.json(
        { error: "Failed to create review submission" },
        { status: 500 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('[REVIEW-SUBMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 