/**
 * API Route: POST /api/business-information/update-location
 * Updates business location information via Google Business Profile API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { hasValue } from '@/utils/dataFiltering';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Update location API called');

    // Create server-side Supabase client that handles session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const { locationId, updates } = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    if (!updates) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      );
    }

    console.log('📍 Updating location:', locationId);
    console.log('📝 Updates:', updates);

    // Get Google Business Profile tokens for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ No Google Business Profile tokens found:', tokenError?.message);
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    console.log('✅ Found Google Business Profile tokens for user:', user.id);

    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : Date.now() + 3600000
    });

    try {
      // Get the account ID first
      const accounts = await gbpClient.listAccounts();
      if (accounts.length === 0) {
        return NextResponse.json(
          { error: 'No Google Business Profile accounts found' },
          { status: 404 }
        );
      }

      const accountId = accounts[0].name.replace('accounts/', '');
      console.log('📋 Using account ID:', accountId);

      // Clean the location ID
      const cleanLocationId = locationId.replace('locations/', '');
      
      // First, verify the location exists by listing all locations
      console.log('🔍 Verifying location exists before update...');
      const locations = await gbpClient.listLocations(accounts[0].name);
      const targetLocation = locations.find(loc => 
        loc.name === locationId || 
        loc.name === `locations/${cleanLocationId}` || 
        loc.name.endsWith(`/${cleanLocationId}`)
      );
      
      if (!targetLocation) {
        console.error('❌ Location not found in account. Available locations:', 
          locations.map(loc => ({ name: loc.name, title: loc.title })));
        return NextResponse.json({
          error: 'Location not found',
          message: `The location "${locationId}" was not found in your Google Business Profile account.`,
          availableLocations: locations.map(loc => ({ id: loc.name, name: loc.title }))
        }, { status: 404 });
      }
      
      console.log('✅ Location found:', { name: targetLocation.name, title: targetLocation.title });
      
      // Extract just the numeric location ID from the full name
      // targetLocation.name could be 'locations/12345' or 'accounts/123/locations/12345'
      const exactLocationId = targetLocation.name.split('/').pop() || targetLocation.name;
      console.log('📍 Using exact location ID for update:', exactLocationId);
      console.log('🔧 Full location name from Google:', targetLocation.name);

      // Convert our update format to Google Business Profile API format
      // Only include fields that have meaningful values (not empty or whitespace-only)
      const locationUpdate: any = {};

      // Business name update - only if not empty
      if (hasValue(updates.locationName)) {
        locationUpdate.title = updates.locationName.trim();
      }

      // Business description update - only if not empty
      if (hasValue(updates.description)) {
        locationUpdate.profile = {
          description: updates.description.trim()
        };
      }

      // Business hours update
      if (updates.regularHours) {
        const periods: any[] = [];
        
        Object.entries(updates.regularHours).forEach(([day, hours]: [string, any]) => {
          if (!hours.closed && hours.open && hours.close) {
            periods.push({
              openDay: day,
              openTime: hours.open,
              closeDay: day,
              closeTime: hours.close
            });
          }
        });

        if (periods.length > 0) {
          locationUpdate.regularHours = {
            periods: periods
          };
        }
      }

      // Service items update - only if we have meaningful service items
      if (updates.serviceItems && Array.isArray(updates.serviceItems)) {
        const meaningfulServices = updates.serviceItems
          .filter((item: any) => item.name && hasValue(item.name))
          .map((item: any) => ({
            freeFormServiceItem: {
              categoryId: 'other', // Default category for free-form services
              label: {
                displayName: item.name.trim(),
                description: hasValue(item.description) ? item.description.trim() : '',
                languageCode: 'en-US'
              }
            }
          }));

        // Only include service items if we have at least one meaningful service
        if (meaningfulServices.length > 0) {
          locationUpdate.serviceItems = meaningfulServices;
        }
      }

      // Log what fields are being updated vs skipped
      console.log('📝 Processing updates:', {
        locationName: updates.locationName ? 'UPDATING' : 'SKIPPING (empty)',
        description: hasValue(updates.description) ? 'UPDATING' : 'SKIPPING (empty)',
        regularHours: updates.regularHours ? 'PROCESSING' : 'SKIPPING',
        serviceItems: updates.serviceItems ? `PROCESSING (${updates.serviceItems.length} items)` : 'SKIPPING'
      });

      console.log('🔄 Final update payload being sent to Google:', locationUpdate);

      // Only proceed if we have something meaningful to update
      if (Object.keys(locationUpdate).length === 0) {
        console.log('⚠️ No meaningful updates to send - all fields were empty');
        return NextResponse.json({
          success: true,
          message: 'No updates needed - all provided fields were empty',
          skipped: true
        });
      }

      // Update the location via Google Business Profile API
      const result = await gbpClient.updateLocation(accountId, exactLocationId, locationUpdate);

      console.log('✅ Location updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Business information updated successfully',
        data: result
      });

    } catch (gbpError) {
      console.error('❌ Google Business Profile API error:', gbpError);
      
      // Handle specific API errors
      if (gbpError instanceof Error) {
        const errorMessage = gbpError.message.toLowerCase();
        
        if (errorMessage.includes('permission denied')) {
          return NextResponse.json(
            { error: 'Permission denied. Please ensure your account has edit permissions for this location.' },
            { status: 403 }
          );
        }
        
        if (errorMessage.includes('not found')) {
          return NextResponse.json(
            { error: 'Location not found or has been removed.' },
            { status: 404 }
          );
        }
        
        if (errorMessage.includes('rate limit')) {
          return NextResponse.json(
            { error: 'API rate limit exceeded. Please try again in a few minutes.' },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to update business information. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error in update location API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 