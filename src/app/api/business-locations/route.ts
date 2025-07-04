/**
 * Business Locations API Route
 * 
 * This endpoint handles business location CRUD operations for Maven tier accounts
 * Includes tier enforcement and automatic location count management
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAccountIdForUser } from "@/utils/accountUtils";

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/business-locations
 * Lists all business locations for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[BUSINESS-LOCATIONS] GET request received');

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[BUSINESS-LOCATIONS] Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID for user
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log(`[BUSINESS-LOCATIONS] Fetching locations for account: ${accountId}`);

    // Get account details with location info
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('plan, location_count, max_locations')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('[BUSINESS-LOCATIONS] Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account information' },
        { status: 500 }
      );
    }

    // Fetch all active business locations for the account
    const { data: locations, error: locationsError } = await supabase
      .from('business_locations')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (locationsError) {
      console.error('[BUSINESS-LOCATIONS] Error fetching locations:', locationsError);
      return NextResponse.json(
        { error: 'Failed to fetch business locations' },
        { status: 500 }
      );
    }

    console.log(`[BUSINESS-LOCATIONS] Successfully fetched ${locations?.length || 0} locations`);

    return NextResponse.json({
      locations: locations || [],
      account: {
        plan: account.plan,
        location_count: account.location_count || 0,
        max_locations: account.max_locations || 0,
        can_create_location: (account.location_count || 0) < (account.max_locations || 0)
      }
    });

  } catch (error) {
    console.error('[BUSINESS-LOCATIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business-locations
 * Creates a new business location for the authenticated user's account
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[BUSINESS-LOCATIONS] POST request received');

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[BUSINESS-LOCATIONS] Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID for user
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      business_name,
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
      review_platforms,
      logo_url,
      primary_color,
      secondary_color
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    console.log(`[BUSINESS-LOCATIONS] Creating location "${name}" for account: ${accountId}`);

    // Check account tier and limits (this will be enforced by database trigger, but good to check here too)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('plan, location_count, max_locations')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('[BUSINESS-LOCATIONS] Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account information' },
        { status: 500 }
      );
    }

    // Check tier permissions
    if (account.plan !== 'maven') {
      return NextResponse.json(
        { error: 'Business locations are only available for Maven tier accounts. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    // Check location limits
    if ((account.location_count || 0) >= (account.max_locations || 0)) {
      return NextResponse.json(
        { error: `Location limit reached (${account.max_locations}). Please contact support to increase your limit.` },
        { status: 403 }
      );
    }

    // Create the business location
    const locationData = {
      account_id: accountId,
      name: name.trim(),
      business_name: business_name?.trim() || null,
      address_street: address_street?.trim() || null,
      address_city: address_city?.trim() || null,
      address_state: address_state?.trim() || null,
      address_zip: address_zip?.trim() || null,
      address_country: address_country?.trim() || null,
      business_description: business_description?.trim() || null,
      unique_aspects: unique_aspects?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      website_url: website_url?.trim() || null,
      ai_dos: ai_dos?.trim() || null,
      ai_donts: ai_donts?.trim() || null,
      review_platforms: review_platforms || null,
      logo_url: logo_url?.trim() || null,
      primary_color: primary_color?.trim() || null,
      secondary_color: secondary_color?.trim() || null,
      is_active: true
    };

    const { data: location, error: locationError } = await supabase
      .from('business_locations')
      .insert(locationData)
      .select()
      .single();

    if (locationError) {
      console.error('[BUSINESS-LOCATIONS] Error creating location:', locationError);
      
      // Handle specific errors
      if (locationError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A location with this name already exists in your account' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create business location' },
        { status: 500 }
      );
    }

    console.log(`[BUSINESS-LOCATIONS] Successfully created location: ${location.id}`);

    // TODO: Auto-create location-specific universal prompt page
    // This will be implemented in the next phase
    
    return NextResponse.json({
      success: true,
      location: location,
      message: 'Business location created successfully'
    });

  } catch (error) {
    console.error('[BUSINESS-LOCATIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}