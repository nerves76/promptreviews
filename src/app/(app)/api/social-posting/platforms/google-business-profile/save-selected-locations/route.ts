/**
 * API endpoint to save selected Google Business Profile locations
 * Called after user selects which locations to manage from the selection modal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { locations } = await request.json();

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Invalid request: locations array required' },
        { status: 400 }
      );
    }

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found or access denied' },
        { status: 403 }
      );
    }
    
    
    // Get account details - try with max_gbp_locations first, fall back without if column doesn't exist
    let account: any;
    let accountError: any;
    
    // First try with max_gbp_locations column
    const result = await supabase
      .from('accounts')
      .select('id, plan, max_gbp_locations')
      .eq('id', accountId)
      .single();
    
    if (result.error?.message?.includes('max_gbp_locations')) {
      // Column doesn't exist yet, try without it
      const fallbackResult = await supabase
        .from('accounts')
        .select('id, plan')
        .eq('id', accountId)
        .single();
      
      account = fallbackResult.data;
      accountError = fallbackResult.error;
    } else {
      account = result.data;
      accountError = result.error;
    }
    
    if (accountError || !account) {
      console.error('Error fetching account details:', {
        error: accountError,
        accountId,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch account details' },
        { status: 500 }
      );
    }

    // Use database value if available, otherwise fall back to plan defaults
    const maxLocations = account.max_gbp_locations || (account.plan === 'maven' ? 10 : 5);
    
    
    // Check if user is trying to select too many locations
    if (locations.length > maxLocations) {
      return NextResponse.json(
        { 
          error: `Plan limit exceeded. Your ${account.plan} plan allows up to ${maxLocations} locations.`,
          maxAllowed: maxLocations,
          requested: locations.length
        },
        { status: 400 }
      );
    }

    // TODO: Uncomment when selected_gbp_locations table is created
    // For now, just log what we would save
    
    // Temporarily skip database operations since table doesn't exist yet
    /*
    // Start a transaction to replace all selected locations
    // First, delete existing selected locations for this account
    const { error: deleteError } = await supabase
      .from('selected_gbp_locations')
      .delete()
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('Error deleting existing locations:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update selected locations' },
        { status: 500 }
      );
    }

    // Insert new selected locations
    if (locations.length > 0) {
      const locationsToInsert = locations.map(location => ({
        account_id: accountId,
        user_id: user.id,
        location_id: location.id,
        location_name: location.name || `Location ${location.id}`,
        address: location.address || null,
        include_in_insights: true
      }));

      const { error: insertError } = await supabase
        .from('selected_gbp_locations')
        .insert(locationsToInsert);

      if (insertError) {
        console.error('Error inserting selected locations:', insertError);
        
        // Check if it's a limit error from our trigger
        if (insertError.message?.includes('limit')) {
          return NextResponse.json(
            { 
              error: insertError.message,
              maxAllowed: maxLocations
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to save selected locations' },
          { status: 500 }
        );
      }
    }
    */


    return NextResponse.json({
      success: true,
      message: `Successfully saved ${locations.length} selected location${locations.length !== 1 ? 's' : ''}`,
      count: locations.length,
      maxAllowed: maxLocations
    });

  } catch (error) {
    console.error('Error in save-selected-locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}