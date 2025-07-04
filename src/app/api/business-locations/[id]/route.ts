/**
 * Individual Business Location API Route
 * 
 * This endpoint handles individual business location operations (GET, PUT, DELETE)
 * for Maven tier accounts with proper authorization and tier enforcement
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
 * GET /api/business-locations/[id]
 * Fetches a single business location by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[BUSINESS-LOCATION] GET request for location: ${id}`);

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
      console.error('[BUSINESS-LOCATION] Auth error:', authError);
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

    // Fetch the business location
    const { data: location, error: locationError } = await supabase
      .from('business_locations')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId) // Ensure user owns this location
      .single();

    if (locationError) {
      console.error('[BUSINESS-LOCATION] Error fetching location:', locationError);
      if (locationError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Business location not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch business location' },
        { status: 500 }
      );
    }

    console.log(`[BUSINESS-LOCATION] Successfully fetched location: ${location.id}`);
    return NextResponse.json(location);

  } catch (error) {
    console.error('[BUSINESS-LOCATION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/business-locations/[id]
 * Updates a business location
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[BUSINESS-LOCATION] PUT request for location: ${id}`);

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
      console.error('[BUSINESS-LOCATION] Auth error:', authError);
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
      secondary_color,
      is_active
    } = body;

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Location name cannot be empty' },
        { status: 400 }
      );
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (business_name !== undefined) updateData.business_name = business_name?.trim() || null;
    if (address_street !== undefined) updateData.address_street = address_street?.trim() || null;
    if (address_city !== undefined) updateData.address_city = address_city?.trim() || null;
    if (address_state !== undefined) updateData.address_state = address_state?.trim() || null;
    if (address_zip !== undefined) updateData.address_zip = address_zip?.trim() || null;
    if (address_country !== undefined) updateData.address_country = address_country?.trim() || null;
    if (business_description !== undefined) updateData.business_description = business_description?.trim() || null;
    if (unique_aspects !== undefined) updateData.unique_aspects = unique_aspects?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null;
    if (ai_dos !== undefined) updateData.ai_dos = ai_dos?.trim() || null;
    if (ai_donts !== undefined) updateData.ai_donts = ai_donts?.trim() || null;
    if (review_platforms !== undefined) updateData.review_platforms = review_platforms;
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null;
    if (primary_color !== undefined) updateData.primary_color = primary_color?.trim() || null;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update the business location
    const { data: location, error: locationError } = await supabase
      .from('business_locations')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', accountId) // Ensure user owns this location
      .select()
      .single();

    if (locationError) {
      console.error('[BUSINESS-LOCATION] Error updating location:', locationError);
      
      if (locationError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Business location not found' },
          { status: 404 }
        );
      }
      
      // Handle specific errors
      if (locationError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A location with this name already exists in your account' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update business location' },
        { status: 500 }
      );
    }

    console.log(`[BUSINESS-LOCATION] Successfully updated location: ${location.id}`);
    
    return NextResponse.json({
      success: true,
      location: location,
      message: 'Business location updated successfully'
    });

  } catch (error) {
    console.error('[BUSINESS-LOCATION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business-locations/[id]
 * Deletes a business location and its associated prompt pages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[BUSINESS-LOCATION] DELETE request for location: ${id}`);

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
      console.error('[BUSINESS-LOCATION] Auth error:', authError);
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

    // First, verify the location exists and belongs to the user
    const { data: location, error: checkError } = await supabase
      .from('business_locations')
      .select('id, name')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (checkError) {
      console.error('[BUSINESS-LOCATION] Error checking location:', checkError);
      if (checkError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Business location not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify business location' },
        { status: 500 }
      );
    }

    // Delete the business location (this will cascade delete associated prompt pages)
    const { error: deleteError } = await supabase
      .from('business_locations')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId); // Double-check ownership

    if (deleteError) {
      console.error('[BUSINESS-LOCATION] Error deleting location:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete business location' },
        { status: 500 }
      );
    }

    console.log(`[BUSINESS-LOCATION] Successfully deleted location: ${id} (${location.name})`);
    
    return NextResponse.json({
      success: true,
      message: `Business location "${location.name}" deleted successfully`
    });

  } catch (error) {
    console.error('[BUSINESS-LOCATION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}