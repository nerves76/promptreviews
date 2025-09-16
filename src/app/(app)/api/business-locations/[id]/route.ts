// -----------------------------------------------------------------------------
// Business Location API - Individual Operations
// This API handles fetching, updating, and deleting individual business locations.
// Includes cascade deletion of associated prompt pages.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const locationId = (await params).id;
    
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

    // Fetch the location with prompt page info
    const { data: location, error: locationError } = await supabase
      .from('business_locations')
      .select(`
        *,
        prompt_pages!business_location_id(
          id,
          slug,
          status,
          client_name,
          review_type
        )
      `)
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (locationError || !location) {
      console.error('Error fetching location:', locationError);
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Transform to include prompt page info
    const locationWithPromptPage = {
      ...location,
      prompt_page_id: location.prompt_pages?.[0]?.id,
      prompt_page_slug: location.prompt_pages?.[0]?.slug,
      prompt_page_status: location.prompt_pages?.[0]?.status,
      prompt_page_title: location.prompt_pages?.[0]?.client_name || `Leave a Review for ${location.name}`,
      prompt_page_type: location.prompt_pages?.[0]?.review_type,
    };

    return NextResponse.json({ location: locationWithPromptPage });
  } catch (error) {
    console.error('GET /api/business-locations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const locationId = (await params).id;
    
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

    // Verify location belongs to account
    const { data: existingLocation, error: checkError } = await supabase
      .from('business_locations')
      .select('id, account_id')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (checkError || !existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const updateData: any = {};

    // Only include fields that are provided in the request
    const allowedFields = [
      'name',
      'address_street',
      'address_city',
      'address_state',
      'address_zip',
      'address_country',
      'business_description',
      'unique_aspects',
      'phone',
      'email',
      'website_url',
      'ai_dos',
      'ai_donts',
      'hours',
      'manager_name',
      'manager_email',
      'parking_info',
      'accessibility_info',
      'logo_url',
      'primary_color',
      'secondary_color',
      'custom_css',
      'review_platforms',
      'is_active'
    ];

    allowedFields.forEach(field => {
      if (body.hasOwnProperty(field)) {
        updateData[field] = body[field];
      }
    });

    // Update the location
    const { data: updatedLocation, error: updateError } = await supabase
      .from('business_locations')
      .update(updateData)
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating location:', updateError);
      return NextResponse.json(
        { error: 'Failed to update location', details: updateError.message },
        { status: 500 }
      );
    }

    // If location name changed, update associated prompt page
    if (body.name) {
      const { error: promptPageError } = await supabase
        .from('prompt_pages')
        .update({
          client_name: `Leave a Review for ${updatedLocation.name}`,
        })
        .eq('business_location_id', locationId);

      if (promptPageError) {
        console.error('Error updating prompt page title:', promptPageError);
      }
    }

    return NextResponse.json({
      location: updatedLocation,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/business-locations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  // CSRF Protection - Check origin for delete operations
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;
  
  try {
    const supabase = await createServerSupabaseClient();
    const locationId = (await params).id;
    
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

    // Verify location belongs to account
    const { data: existingLocation, error: checkError } = await supabase
      .from('business_locations')
      .select('id, account_id, name')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (checkError || !existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Delete the location (cascade will delete associated prompt pages)
    const { error: deleteError } = await supabase
      .from('business_locations')
      .delete()
      .eq('id', locationId);

    if (deleteError) {
      console.error('Error deleting location:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete location', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Location "${existingLocation.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('DELETE /api/business-locations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 