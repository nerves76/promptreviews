/**
 * API Route: POST /api/business-information/update-location
 * Updates Google Business Profile location information using Business Information API v1
 * 
 * Updated for 2024/2025 API structure:
 * - Uses Business Information API v1 endpoints
 * - Direct location ID access (not account-based paths)
 * - Proper PATCH method with updateMask
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { hasValue } from '@/utils/dataFiltering';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Business information update API called');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) => cookieStore.delete(name, options),
        },
      }
    );

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const { locationIds, updates } = await request.json();

    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return NextResponse.json(
        { error: 'Location IDs are required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving business info for locations:', locationIds);
    console.log('📝 Updates to apply:', updates);

    // Get Google Business Profile tokens
    const { data: tokens } = await supabase
      .from('google_business_profile_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    // Create client
    const client = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at).getTime(),
    });

    // Process each location
    const results = [];
    
    for (const locationId of locationIds) {
      try {
        console.log(`\n🔄 Processing location: ${locationId}`);

        // Convert our update format to Google Business Profile API v1 format
        // Only include fields that have meaningful values (not empty or whitespace-only)
        const locationUpdate: any = {};

        // Business name update - only if not empty
        if (hasValue(updates.locationName)) {
          locationUpdate.title = updates.locationName.trim();
          console.log('📝 Including title update:', locationUpdate.title);
        }

        // Business description update - only if not empty
        if (hasValue(updates.description)) {
          locationUpdate.profile = {
            description: updates.description.trim()
          };
          console.log('📝 Including description update');
        }

        // Business hours update - only if provided and has meaningful data
        if (hasValue(updates.regularHours) && Array.isArray(updates.regularHours)) {
          const validHours = updates.regularHours.filter(hour => 
            hasValue(hour) && 
            hasValue(hour.day) && 
            hasValue(hour.openTime) && 
            hasValue(hour.closeTime)
          );
          
          if (validHours.length > 0) {
            locationUpdate.regularHours = {
              periods: validHours.map(hour => ({
                openDay: hour.day,
                openTime: hour.openTime,
                closeDay: hour.day,
                closeTime: hour.closeTime
              }))
            };
            console.log('📝 Including hours update:', validHours.length, 'periods');
          }
        }

        // Service items update - only if provided and has meaningful data
        if (hasValue(updates.serviceItems) && Array.isArray(updates.serviceItems)) {
          const validServices = updates.serviceItems.filter(service => 
            hasValue(service) && hasValue(service.serviceTypeId)
          );
          
          if (validServices.length > 0) {
            locationUpdate.serviceItems = validServices;
            console.log('📝 Including service items update:', validServices.length, 'services');
          }
        }

        // Categories update
        if (hasValue(updates.primaryCategory)) {
          locationUpdate.primaryCategory = updates.primaryCategory;
          console.log('📝 Including primary category update');
        }

        if (hasValue(updates.additionalCategories) && Array.isArray(updates.additionalCategories)) {
          const validCategories = updates.additionalCategories.filter(cat => hasValue(cat));
          if (validCategories.length > 0) {
            locationUpdate.additionalCategories = validCategories;
            console.log('📝 Including additional categories update:', validCategories.length, 'categories');
          }
        }

        // Only proceed if we have something meaningful to update
        if (Object.keys(locationUpdate).length === 0) {
          console.log('⚠️ No meaningful updates to send - all fields were empty');
          results.push({
            locationId,
            success: true,
            message: 'No updates needed - all provided fields were empty',
            skipped: true
          });
          continue;
        }

        console.log('📤 Final update payload:', JSON.stringify(locationUpdate, null, 2));

        // Call the Google Business Profile API with the Business Information API v1
        // Note: We don't need accountId for the new API structure
        const result = await client.updateLocation('', locationId, locationUpdate);

        console.log('✅ Location updated successfully:', locationId);
        results.push({
          locationId,
          success: true,
          data: result
        });

      } catch (locationError: any) {
        console.error(`❌ Failed to update location ${locationId}:`, locationError);
        
        // Handle specific Google API errors
        let errorMessage = locationError.message || 'Unknown error occurred';
        
        if (errorMessage.includes('GOOGLE_REAUTH_REQUIRED')) {
          return NextResponse.json(
            { 
              error: 'Google Business Profile connection expired. Please reconnect your account.',
              requiresReauth: true 
            },
            { status: 401 }
          );
        }

        if (errorMessage.includes('Resource not found')) {
          errorMessage = `Location ${locationId} not found. Please verify the location exists and you have access to it.`;
        }

        if (errorMessage.includes('Access forbidden')) {
          errorMessage = 'Access denied. Please check your Google Business Profile permissions.';
        }

        results.push({
          locationId,
          success: false,
          error: errorMessage
        });
      }
    }

    // Check if any updates were successful
    const successfulUpdates = results.filter(r => r.success && !r.skipped);
    const failedUpdates = results.filter(r => !r.success);
    const skippedUpdates = results.filter(r => r.skipped);

    console.log('📊 Update summary:', {
      total: results.length,
      successful: successfulUpdates.length,
      failed: failedUpdates.length,
      skipped: skippedUpdates.length
    });

    if (failedUpdates.length === results.length) {
      // All updates failed
      const firstError = failedUpdates[0]?.error || 'All location updates failed';
      return NextResponse.json(
        { 
          error: `Failed to update business information for any locations. ${firstError}`,
          results
        },
        { status: 400 }
      );
    }

    // Return success with details
    const message = 
      successfulUpdates.length === results.length 
        ? `Successfully updated ${successfulUpdates.length} location(s)`
        : `Updated ${successfulUpdates.length} of ${results.length} location(s). ${failedUpdates.length} failed.`;

    return NextResponse.json({
      success: true,
      message,
      results,
      summary: {
        successful: successfulUpdates.length,
        failed: failedUpdates.length,
        skipped: skippedUpdates.length,
        total: results.length
      }
    });

  } catch (error: any) {
    console.error('❌ Google Business Profile API error:', error);
    
    // Handle authentication errors
    if (error.message?.includes('GOOGLE_REAUTH_REQUIRED') || 
        error.message?.includes('Authentication failed')) {
      return NextResponse.json(
        { 
          error: 'Google Business Profile connection expired. Please reconnect your account.',
          requiresReauth: true 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update business information',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 