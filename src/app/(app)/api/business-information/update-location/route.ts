/**
 * API Route: POST /api/business-information/update-location
 * Updates Google Business Profile location information using Business Information API v1
 * 
 * Updated for 2024/2025 API structure:
 * - Uses Business Information API v1 endpoints
 * - Direct location ID access (not account-based paths)
 * - Proper PATCH method with updateMask
 */

/**
 * Clean string to meet Google Business Profile API requirements
 * - Removes leading/trailing whitespace
 * - Replaces multiple consecutive spaces with single space
 * - Ensures no contiguous whitespace
 */
function cleanStringForGoogle(str: string | undefined): string | undefined {
  if (!str) return undefined;
  // Trim and replace multiple spaces with single space
  return str.trim().replace(/\s+/g, ' ');
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { hasValue } from '@/utils/dataFiltering';
import { getRequestAccountId } from '../../utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {

    // Parse request body with detailed logging
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { locationIds, updates } = body;


    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return NextResponse.json(
        { error: 'Location IDs are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }


    // Create Supabase client and authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            return cookieStore.get(name)?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }


    // Get Google Business Profile tokens
    const { data: tokens } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
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

    // Fetch location names from Google for better success messages
    const locationDetails = new Map();
    try {
      const accounts = await client.listAccounts();
      if (accounts.length > 0) {
        const accountId = accounts[0].name.replace('accounts/', '');
        const locations = await client.listLocations(accountId);
        for (const location of locations) {
          // Store using the full location ID as key to match what we use for retrieval
          locationDetails.set(location.name, location.title || location.name);
        }
      }
    } catch (error) {
    }

    // Process each location
    const results = [];
    
    for (const locationId of locationIds) {
      try {

        // First, fetch current location data to preserve required fields
        let currentLocationData: any = null;
        try {
          currentLocationData = await client.getLocation('', locationId);
        } catch (fetchError) {
        }

        // Convert our update format to Google Business Profile API v1 format
        // Only include fields that have meaningful values (not empty or whitespace-only)
        const locationUpdate: any = {};

        // Business name update - only if not empty
        if (hasValue(updates.locationName)) {
          locationUpdate.title = cleanStringForGoogle(updates.locationName);
        }

        // Business description update - only if not empty
        if (hasValue(updates.description)) {
          locationUpdate.profile = {
            description: cleanStringForGoogle(updates.description)
          };
        }

        // Address update - handle carefully for service area businesses
        // Only include address if we have one (either new or existing)
        if (updates.storefrontAddress || currentLocationData?.storefrontAddress) {
          const address = updates.storefrontAddress || currentLocationData.storefrontAddress;
          
          // Only include if address has actual content
          if (address && (address.addressLines?.length > 0 || address.locality || address.postalCode)) {
            locationUpdate.storefrontAddress = {
              addressLines: address.addressLines?.map((line: string) => cleanStringForGoogle(line)).filter(Boolean) || [],
              locality: cleanStringForGoogle(address.locality),
              administrativeArea: cleanStringForGoogle(address.administrativeArea),
              postalCode: cleanStringForGoogle(address.postalCode),
              regionCode: address.regionCode || 'US'
            };
          } else {
          }
        } else {
        }

        // Phone numbers update
        if (updates.phoneNumbers) {
          locationUpdate.phoneNumbers = {
            primaryPhone: cleanStringForGoogle(updates.phoneNumbers.primaryPhone),
            additionalPhones: updates.phoneNumbers.additionalPhones?.map((phone: string) => cleanStringForGoogle(phone)).filter(Boolean) || []
          };
        }

        // Website update
        if (hasValue(updates.websiteUri)) {
          locationUpdate.websiteUri = cleanStringForGoogle(updates.websiteUri);
        }

        // Coordinates update (usually not editable by users but preserve if exists)
        if (updates.latlng || currentLocationData?.latlng) {
          const coords = updates.latlng || currentLocationData.latlng;
          locationUpdate.latlng = {
            latitude: coords.latitude,
            longitude: coords.longitude
          };
        }

        // Business hours update - only if provided and has meaningful data
        if (hasValue(updates.regularHours) && typeof updates.regularHours === 'object') {
          
          // Convert HH:MM format to Google's time object format
          const parseTime = (timeStr: string) => {
            const [hoursPart, minutesPart] = timeStr.split(':').map(Number);
            return {
              hours: hoursPart || 0,
              minutes: minutesPart || 0
            };
          };
          
          // Convert our frontend format {MONDAY: {open: '09:00', close: '17:00', closed: false}} 
          // to Google's periods array format
          const periods = [];
          
          for (const [dayName, hours] of Object.entries(updates.regularHours)) {
            // Type assertion for hours object to fix TypeScript errors
            const typedHours = hours as { closed?: boolean; open?: string; close?: string };
            
            if (typedHours && typeof typedHours === 'object' && !typedHours.closed && typedHours.open && typedHours.close) {
              
              // Convert day name to Google's format
              const googleDay = dayName.toUpperCase();
              
              periods.push({
                openDay: googleDay,
                openTime: parseTime(typedHours.open),
                closeDay: googleDay, 
                closeTime: parseTime(typedHours.close)
              });
            }
          }
          
          if (periods.length > 0) {
            locationUpdate.regularHours = { periods };
          }
        }

        // Extract available categories for service item mapping
        const availableCategories: string[] = [];
        if (hasValue(updates.primaryCategory?.categoryId)) {
          availableCategories.push(updates.primaryCategory.categoryId);
        }
        if (hasValue(updates.additionalCategories) && Array.isArray(updates.additionalCategories)) {
          updates.additionalCategories.forEach((cat: any) => {
            if (hasValue(cat?.categoryId)) {
              availableCategories.push(cat.categoryId);
            }
          });
        }

        /**
         * Map service name to most appropriate business category
         */
        function mapServiceToCategory(serviceName: string, availableCategories: string[]): string {
          const serviceNameLower = serviceName.toLowerCase();
          
          // SEO & Marketing services
          if (serviceNameLower.includes('seo') || serviceNameLower.includes('search engine') || 
              serviceNameLower.includes('marketing') || serviceNameLower.includes('ads') ||
              serviceNameLower.includes('generative engine') || serviceNameLower.includes('optimization')) {
            const marketingCategories = ['gcid:internet_marketing_service', 'gcid:marketing_consultant', 'gcid:marketing_agency'];
            for (const cat of marketingCategories) {
              if (availableCategories.includes(cat)) return cat;
            }
          }
          
          // Design & Website services
          if (serviceNameLower.includes('design') || serviceNameLower.includes('website') || 
              serviceNameLower.includes('web') || serviceNameLower.includes('ui') || 
              serviceNameLower.includes('ux')) {
            const designCategories = ['gcid:website_designer', 'gcid:design_agency'];
            for (const cat of designCategories) {
              if (availableCategories.includes(cat)) return cat;
            }
          }
          
          // Branding services
          if (serviceNameLower.includes('brand') || serviceNameLower.includes('logo') || 
              serviceNameLower.includes('identity')) {
            const brandingCategories = ['gcid:branding_agency', 'gcid:design_agency'];
            for (const cat of brandingCategories) {
              if (availableCategories.includes(cat)) return cat;
            }
          }
          
          // Consulting & Strategy services
          if (serviceNameLower.includes('consult') || serviceNameLower.includes('strategy') || 
              serviceNameLower.includes('management') || serviceNameLower.includes('analytics') ||
              serviceNameLower.includes('reporting')) {
            const consultingCategories = ['gcid:business_management_consultant', 'gcid:marketing_consultant', 'gcid:business_development_service'];
            for (const cat of consultingCategories) {
              if (availableCategories.includes(cat)) return cat;
            }
          }
          
          // AI & Automation services
          if (serviceNameLower.includes('ai') || serviceNameLower.includes('automation') || 
              serviceNameLower.includes('artificial intelligence')) {
            const techCategories = ['gcid:business_development_service', 'gcid:marketing_consultant'];
            for (const cat of techCategories) {
              if (availableCategories.includes(cat)) return cat;
            }
          }
          
          // Business services fallback
          const businessCategories = ['gcid:business_to_business_service', 'gcid:business_development_service'];
          for (const cat of businessCategories) {
            if (availableCategories.includes(cat)) return cat;
          }
          
          // Ultimate fallback - use first available category
          return availableCategories.length > 0 ? availableCategories[0] : '';
        }

        // Service items update - only if provided and has meaningful data
        if (hasValue(updates.serviceItems) && Array.isArray(updates.serviceItems)) {
          
          const validServices = updates.serviceItems.filter((service: any) => 
            hasValue(service) && hasValue(service.name)
          ).map((service: any) => {
            const categoryId = mapServiceToCategory(service.name.trim(), availableCategories);
            
            return {
              // Use freeFormServiceItem for custom services - Google now supports this
              freeFormServiceItem: {
                category: categoryId, // CRITICAL: Include category ID to match business categories
                label: {
                  displayName: cleanStringForGoogle(service.name),
                  description: service.description ? cleanStringForGoogle(service.description)?.substring(0, 300) : undefined,
                  languageCode: 'en'
                }
              }
            };
          });
          
          
          // Validate that all service items have valid categories
          const servicesWithValidCategories = validServices.filter((service: any) => 
            service.freeFormServiceItem.category && service.freeFormServiceItem.category.trim() !== ''
          );
          
          if (servicesWithValidCategories.length > 0) {
            locationUpdate.serviceItems = servicesWithValidCategories;
            
            if (servicesWithValidCategories.length < validServices.length) {
            }
          } else {
            if (availableCategories.length === 0) {
            }
          }
        }

        // Categories update - Google expects them nested under "categories" and using "name" not "categoryId"
        // Also uses snake_case field names: primary_category, additional_categories
        // Only include if we have valid category data to avoid sending empty objects
        
        // Check if primary category is actually changing
        const currentPrimaryCategory = currentLocationData?.categories?.primaryCategory?.name || 
                                       currentLocationData?.categories?.primary_category?.name;
        const isPrimaryCategoryChanging = updates.primaryCategory?.categoryId && 
                                          updates.primaryCategory.categoryId !== currentPrimaryCategory;
        
        const hasValidPrimaryCategory = hasValue(updates.primaryCategory) && 
          hasValue(updates.primaryCategory.categoryId) && 
          hasValue(updates.primaryCategory.displayName) &&
          isPrimaryCategoryChanging; // Only update if actually changing
        
        const hasValidAdditionalCategories = hasValue(updates.additionalCategories) && 
          Array.isArray(updates.additionalCategories) &&
          updates.additionalCategories.some((cat: any) => 
            hasValue(cat) && hasValue(cat.categoryId) && hasValue(cat.displayName)
          );

        if (hasValidPrimaryCategory || hasValidAdditionalCategories) {
          locationUpdate.categories = {};
          
          if (hasValidPrimaryCategory) {
            // Convert our frontend format {categoryId, displayName} to Google's format {name, displayName}
            locationUpdate.categories.primary_category = {
              name: updates.primaryCategory.categoryId, // Google expects "name" field with categoryId value
              displayName: updates.primaryCategory.displayName
            };
          }
          
          if (hasValidAdditionalCategories) {
            // Filter and convert valid additional categories
            const validCategories = updates.additionalCategories.filter((cat: any) => 
              hasValue(cat) && hasValue(cat.categoryId) && hasValue(cat.displayName)
            );
            
            if (validCategories.length > 0) {
              // Convert our format to Google's format (categoryId -> name)
              locationUpdate.categories.additional_categories = validCategories.map((cat: any) => ({
                name: cat.categoryId, // Google expects "name" field with categoryId value
                displayName: cat.displayName
              }));
            }
          }
        } else {
        }

        // Only proceed if we have something meaningful to update
        if (Object.keys(locationUpdate).length === 0) {
          results.push({
            locationId,
            success: true,
            message: 'No updates needed - all provided fields were empty',
            skipped: true
          });
          continue;
        }


        // Call the Google Business Profile API with the Business Information API v1
        const result = await client.updateLocation('', locationId, locationUpdate);
        
        // Create detailed success message
        const updatedFields = [];
        if (locationUpdate.profile?.description) updatedFields.push('description');
        if (locationUpdate.regularHours) updatedFields.push('business hours');
        if (locationUpdate.serviceItems) updatedFields.push(`${locationUpdate.serviceItems.length} service items`);
        if (locationUpdate.categories?.primary_category) updatedFields.push('primary category');
        if (locationUpdate.categories?.additional_categories) updatedFields.push(`${locationUpdate.categories.additional_categories.length} additional categories`);
        
        const locationName = locationDetails.get(locationId) || locationId;

        results.push({
          locationId,
          locationName,
          success: true,
          updatedFields,
          message: `Updated ${updatedFields.join(', ')} for ${locationName}`
        });

      } catch (locationError: any) {
        console.error(`❌ Failed to update location ${locationId}:`, locationError);
        
        // Handle specific Google API errors
        let errorMessage = locationError.message || 'Unknown error occurred';
        
        if (errorMessage.includes('GOOGLE_REAUTH_REQUIRED')) {
          return NextResponse.json(
            { 
              error: 'Google Business Profile connection expired. Please reconnect your account.',
              requiresReauth: true,
              details: 'Your Google Business Profile tokens have expired. Please disconnect and reconnect your Google account.'
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
    let message;
    if (successfulUpdates.length === results.length) {
      // All successful - create detailed message
      if (successfulUpdates.length === 1) {
        const update = successfulUpdates[0];
        message = `Successfully updated ${update.updatedFields?.join(', ') || 'business information'} for ${update.locationName}`;
      } else {
        // Multiple locations - show summary
        const allUpdatedFields = [...new Set(successfulUpdates.flatMap(u => u.updatedFields))];
        const locationNames = successfulUpdates.map(u => u.locationName).join(', ');
        message = `Successfully updated ${allUpdatedFields.join(', ')} for ${successfulUpdates.length} locations: ${locationNames}`;
      }
    } else {
      // Mixed results
      message = `Updated ${successfulUpdates.length} of ${results.length} location(s). ${failedUpdates.length} failed.`;
    }

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
          requiresReauth: true,
          details: 'Your Google Business Profile tokens have expired. Please disconnect and reconnect your Google account.'
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
