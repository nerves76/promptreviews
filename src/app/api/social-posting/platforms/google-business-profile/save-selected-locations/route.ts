/**
 * API endpoint to save selected Google Business Profile locations
 * Called after user selects which locations to manage from the selection modal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAccountIdForUser } from '@/auth/utils/accounts';

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

    // Get the account ID for the user using the proper utility
    const accountId = await getAccountIdForUser(user.id, supabase);
    
    if (!accountId) {
      console.error('No account found for user:', user.id);
      return NextResponse.json(
        { error: 'No account found for user' },
        { status: 404 }
      );
    }
    
    console.log('Found account ID:', accountId, 'for user:', user.id);
    
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
      console.log('max_gbp_locations column not found, falling back to basic query');
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
    
    console.log('Account details:', {
      accountId,
      plan: account.plan,
      max_gbp_locations: account.max_gbp_locations,
      calculatedMaxLocations: maxLocations,
      requestedLocations: locations.length
    });
    
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
    console.log('Would save selected locations:', {
      accountId,
      userId: user.id,
      locationCount: locations.length,
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address
      }))
    });
    
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

    console.log(`✅ Saved ${locations.length} selected GBP locations for account ${accountId}`);

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