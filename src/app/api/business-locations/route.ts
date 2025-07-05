// -----------------------------------------------------------------------------
// Business Locations API - List and Create
// This API handles listing all locations for an account and creating new ones.
// Enforces tier-based location limits for Maven plan (10 locations).
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { canCreateLocation, getTierLocationLimit, generateLocationPromptPageSlug, createLocationPromptPageData } from '@/utils/locationUtils';

export async function GET(request: NextRequest) {
  try {
    // Use session-based client for authentication
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID
    const accountId = await getAccountIdForUser(user.id, supabase);
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
    // Use session-based client for authentication
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

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

    if (!canCreateLocation(account)) {
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
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Location name is required' },
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

    // Auto-create a location-specific universal prompt page
    const promptPageData = createLocationPromptPageData({
      ...location,
      review_platforms,
    });
    
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