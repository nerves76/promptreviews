// -----------------------------------------------------------------------------
// Business Locations API - List and Create
// This API handles listing all locations for an account and creating new ones.
// Enforces tier-based location limits for Maven plan (10 locations).
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { canCreateLocation, getTierLocationLimit, generateLocationPromptPageSlug, createLocationPromptPageData, generateUniqueLocationSlug } from '@/utils/locationUtils';

// 🔧 CONSOLIDATION: Shared Supabase client creation for API routes
// This eliminates duplicate client creation patterns
async function createAuthenticatedSupabaseClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, // No-op for API route
        remove: () => {}, // No-op for API route
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // 🔧 CONSOLIDATED: Use shared client creation function
    const supabase = await createAuthenticatedSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    // Get account info for limits (use service role client to bypass RLS)
    const serviceRoleClient = createServiceRoleClient();
    const { data: account, error: accountError } = await serviceRoleClient
      .from('accounts')
      .select('plan, location_count, max_locations')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json({ error: 'Failed to fetch account info' }, { status: 500 });
    }

    // Fetch all locations for the account
    const { data: locations, error: locationsError } = await supabase
      .from('business_locations')
      .select(`
        *,
        prompt_pages!business_location_id(
          id,
          slug,
          status
        )
      `)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }

    // Transform the data to include prompt page info
    const locationsWithPromptPages = (locations || []).map(location => ({
      ...location,
      prompt_page_id: location.prompt_pages?.[0]?.id,
      prompt_page_slug: location.prompt_pages?.[0]?.slug,
      prompt_page_status: location.prompt_pages?.[0]?.status,
    }));

    return NextResponse.json({
      locations: locationsWithPromptPages,
      count: locations?.length || 0,
      limit: account.max_locations,
      can_create_more: canCreateLocation(account),
    });
  } catch (error) {
    console.error('GET /api/business-locations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔧 CONSOLIDATED: Use shared client creation function
    const supabase = await createAuthenticatedSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('🔍 API: Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 API: User authenticated:', user.id);

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.log('🔍 API: No account found for user:', user.id);
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    console.log('🔍 API: Account ID found:', accountId);

    // Check if user can create more locations (use service role client to bypass RLS)
    const serviceRoleClient = createServiceRoleClient();
    const { data: account, error: accountError } = await serviceRoleClient
      .from('accounts')
      .select('plan, location_count, max_locations')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json({ error: 'Failed to fetch account info' }, { status: 500 });
    }

    console.log('🔍 API: Account info:', account);

    if (!canCreateLocation(account)) {
      console.log('🔍 API: Location limit reached');
      return NextResponse.json(
        { 
          error: 'Location limit reached', 
          message: `Your ${account.plan} plan allows up to ${account.max_locations} locations.`,
          current_count: account.location_count,
          max_locations: account.max_locations
        }, 
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('🔍 API: Received request body:', JSON.stringify(body, null, 2));
    
    const {
      name,
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country,
      business_description,
      unique_aspects,
      phone,
      email,
      website_url,
      ai_dos,
      ai_donts,
      hours,
      manager_name,
      manager_email,
      parking_info,
      accessibility_info,
      logo_url,
      primary_color,
      secondary_color,
      review_platforms,
      // Emoji sentiment fields
      emoji_sentiment_enabled,
      emoji_sentiment_question,
      emoji_feedback_message,
      emoji_thank_you_message,
      emoji_labels,
      // Other module fields
      falling_enabled,
      falling_icon,
      falling_icon_color,
      offer_enabled,
      offer_title,
      offer_body,
      offer_url,
      ai_review_enabled,
      // Personalized note fields
      show_friendly_note,
      friendly_note,
      // Photo fields (optional)
      location_photo_url,
    } = body;

    console.log('🔍 API: Extracted name:', name);
    console.log('🔍 API: Extracted review_platforms:', review_platforms);

    // Validate required fields
    if (!name) {
      console.log('🔍 API: Validation failed - name is required');
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Validation passed - proceeding with location creation');

    // Check if the location name already exists for this account
    const { data: existingLocation } = await supabase
      .from('business_locations')
      .select('id')
      .eq('name', name)
      .eq('account_id', accountId)
      .single();

    if (existingLocation) {
      console.log('🔍 API: Location name already exists for this account');
      return NextResponse.json(
        { error: 'Location name already exists. Please choose a different name.' },
        { status: 400 }
      );
    }

    // Create the location (use service role client to bypass RLS)
    const { data: location, error: createError } = await serviceRoleClient
      .from('business_locations')
      .insert({
        account_id: accountId,
        name,
        address_street,
        address_city,
        address_state,
        address_zip,
        address_country,
        business_description,
        unique_aspects,
        phone,
        email,
        website_url,
        ai_dos,
        ai_donts,
        hours,
        manager_name,
        manager_email,
        parking_info,
        accessibility_info,
        logo_url,
        primary_color,
        secondary_color,
        review_platforms,
        // Emoji sentiment fields
        emoji_sentiment_enabled,
        emoji_sentiment_question,
        emoji_feedback_message,
        emoji_thank_you_message,
        emoji_labels,
        // Other module fields
        falling_enabled,
        falling_icon,
        falling_icon_color,
        offer_enabled,
        offer_title,
        offer_body,
        offer_url,
        ai_review_enabled,
        show_friendly_note,
        friendly_note,
        // Photo fields
        location_photo_url,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating location:', createError);
      return NextResponse.json(
        { error: 'Failed to create location', details: createError.message },
        { status: 500 }
      );
    }

    // Auto-create a location-specific prompt page with unique slug
    const promptPageData = createLocationPromptPageData({
      ...location,
      review_platforms,
      // Pass through all module fields
      emoji_sentiment_enabled,
      emoji_sentiment_question,
      emoji_feedback_message,
      emoji_thank_you_message,
      emoji_labels,
      falling_enabled,
      falling_icon,
      offer_enabled,
      offer_title,
      offer_body,
      offer_url,
      ai_review_enabled,
      show_friendly_note,
      friendly_note,
    });
    
    // Generate unique slug to handle duplicate location names
    const uniqueSlug = await generateUniqueLocationSlug(
      location.name, 
      accountId, 
      serviceRoleClient
    );
    
    // Override the slug with the unique one
    promptPageData.slug = uniqueSlug;
    
    const { data: promptPage, error: promptPageError } = await serviceRoleClient
      .from('prompt_pages')
      .insert(promptPageData)
      .select()
      .single();

    if (promptPageError) {
      console.error('Error creating location prompt page:', promptPageError);
      // Don't fail the whole operation, but log the error
    }

    return NextResponse.json({
      location: {
        ...location,
        prompt_page_id: promptPage?.id,
        prompt_page_slug: promptPage?.slug,
      },
      message: 'Location created successfully',
    });
  } catch (error) {
    console.error('POST /api/business-locations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 