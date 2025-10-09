/**
 * API Route: POST /api/social-posting/platforms/google-business-profile/fetch-locations
 * Fetches Google Business Profile locations from the API and stores them in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { getRequestAccountId } from '../../../utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
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
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }


    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // First check if we already have locations in the database
    const { data: existingLocations, error: checkError } = await serviceSupabase
      .from('google_business_locations')
      .select('*')
      .eq('account_id', accountId);
    
    if (!checkError && existingLocations && existingLocations.length > 0) {
      
      // Check if any location needs updating (status is UNKNOWN or updated_at is old)
      const needsUpdate = existingLocations.some(loc => 
        loc.status === 'UNKNOWN' || 
        !loc.updated_at ||
        (new Date().getTime() - new Date(loc.updated_at).getTime()) > 24 * 60 * 60 * 1000 // More than 24 hours old
      );
      
      if (!needsUpdate) {
        return NextResponse.json({
          success: true,
          message: `Found ${existingLocations.length} business locations`,
          locations: existingLocations.map(loc => ({
            user_id: loc.user_id,
            location_id: loc.location_id,
            location_name: loc.location_name,
            account_name: loc.account_name,
            address: loc.address,
            status: loc.status,
            primary_phone: loc.primary_phone,
            website_uri: loc.website_uri
          }))
        });
      } else {
        // Delete old locations with UNKNOWN status to force fresh fetch
        const { error: deleteError } = await serviceSupabase
          .from('google_business_locations')
          .delete()
          .eq('account_id', accountId)
          .eq('status', 'UNKNOWN');
        
        if (deleteError) {
        } else {
        }
      }
    }

    // Production mode: Use real Google API calls

    // Check global rate limit status before making any API calls
    // Google Business Profile API allows only 1 request per minute per project
    const { data: rateLimitData, error: rateLimitError } = await serviceSupabase
      .from('google_api_rate_limits')
      .select('last_api_call_at')
      .eq('project_id', 'google-business-profile')
      .eq('account_id', accountId)
      .maybeSingle();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') { // PGRST116 = no rows found
    }

    const now = Date.now();
    const lastApiCall = rateLimitData?.last_api_call_at ? new Date(rateLimitData.last_api_call_at).getTime() : 0;
    const timeSinceLastCall = now - lastApiCall;
    const requiredWait = 120000; // 2 minutes to be conservative with quota exhaustion


    if (timeSinceLastCall < requiredWait) {
      const remainingWait = Math.ceil((requiredWait - timeSinceLastCall) / 1000);
      
      return NextResponse.json({
        success: false,
        error: 'Google Business Profile API rate limit active',
        message: `Please wait ${remainingWait} more seconds before making another API request. Google has strict quota limits - consider requesting higher limits in Cloud Console.`,
        retryAfter: remainingWait,
        isRateLimit: true
      }, { status: 429 });
    }


    // Get user's Google Business Profile tokens using service role
    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokens) {
      return NextResponse.json({ 
        error: 'Google Business Profile not connected',
        success: false
      });
    }


    // Create Google Business Profile client
    const client = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at).getTime()
    });

    try {
      // Fetch accounts from Google Business Profile API
      
      // Update rate limit timestamp right before making the API call
      await serviceSupabase
        .from('google_api_rate_limits')
        .upsert({
          project_id: 'google-business-profile',
          account_id: accountId,
          last_api_call_at: new Date().toISOString(),
          user_id: user.id
        }, { onConflict: 'project_id,account_id' });
      
      const accounts = await client.listAccounts();
      

      let allLocations: any[] = [];
      let hasErrors = false;
      let errorMessages: string[] = [];

      // Process each account to fetch locations
      for (const account of accounts) {
        try {
          
          const locations = await client.listLocations(account.name);
          
          // Store locations in database
          for (const location of locations) {
            // Log the location fields for debugging
            
            // Extract address properly
            let address = '';
            if (location.storefrontAddress) {
              const addr = location.storefrontAddress;
              const parts = [];
              if (addr.addressLines?.length > 0) {
                parts.push(...addr.addressLines);
              }
              if (addr.locality) parts.push(addr.locality);
              if (addr.administrativeArea) parts.push(addr.administrativeArea);
              if (addr.postalCode) parts.push(addr.postalCode);
              address = parts.join(', ');
            }
            
            // Extract phone number properly
            const primaryPhone = location.phoneNumbers?.primaryPhone || 
                               location.primaryPhone || 
                               '';
            
            // Determine status - if we have a location from Google, it's active
            // The locationState field can be: "LOCATION_STATE_UNSPECIFIED", "DISABLED", etc.
            let status = 'ACTIVE';
            if (location.locationState === 'DISABLED') {
              status = 'DISABLED';
            } else if (location.verificationState === 'UNVERIFIED') {
              status = 'UNVERIFIED';
            }
            
            const locationData = {
              user_id: user.id,
              account_id: accountId,
              location_id: location.name,
              location_name: location.title || location.locationName || location.name, // Use title (business name) first
              account_name: account.name, // Store the full account name (accounts/{id})
              address: address,
              status: status,
              primary_phone: primaryPhone,
              website_uri: location.websiteUri || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            
            // Upsert location to avoid duplicates using service role
            const { error: insertError } = await serviceSupabase
              .from('google_business_locations')
              .upsert(locationData, { 
                onConflict: 'account_id,location_id',
                ignoreDuplicates: false
              });
            
            if (insertError) {
              console.error('Error storing location:', insertError);
              hasErrors = true;
              errorMessages.push(`Failed to store location ${location.name}`);
            } else {
              allLocations.push(locationData);
            }
          }
        } catch (accountError) {
          console.error(`Error fetching locations for account ${account.name}:`, accountError);
          hasErrors = true;
          const errorMsg = accountError instanceof Error ? accountError.message : 'Unknown error';
          errorMessages.push(`Failed to fetch locations for account ${account.name}: ${errorMsg}`);
          // Continue with other accounts even if one fails
        }
      }
      
      // Provide accurate status reporting
      if (hasErrors && allLocations.length === 0) {
        return NextResponse.json({
          success: false,
          message: `Failed to fetch business locations: ${errorMessages.join(', ')}`,
          locations: [],
          errors: errorMessages
        });
      } else if (hasErrors && allLocations.length > 0) {
        return NextResponse.json({
          success: true,
          message: `Fetched ${allLocations.length} business locations with some errors`,
          locations: allLocations,
          warnings: errorMessages
        });
      } else {
        return NextResponse.json({
          success: true,
          message: allLocations.length > 0 
            ? `Successfully fetched ${allLocations.length} business locations`
            : 'No business locations found in your Google Business Profile account',
          locations: allLocations
        });
      }
      
         } catch (apiError) {
       console.error('Error fetching locations from Google API:', apiError);
       
       // Enhanced error handling with specific messages
       let errorResponse: any = {
         success: false,
         error: 'Failed to fetch locations from Google Business Profile API',
         message: 'Unable to fetch business locations at this time.',
         details: {}
       };
       
       // Check for different error types
       if (apiError instanceof Error) {
         const errorMessage = apiError.message.toLowerCase();
         
         // Rate limit error
         if (errorMessage.includes('429') || 
             errorMessage.includes('rate limit') ||
             errorMessage.includes('quota exceeded') ||
             errorMessage.includes('rate limit exceeded')) {
           return NextResponse.json({
             success: false,
             error: 'RATE_LIMIT_ERROR',
             message: 'Google Business Profile API rate limit reached. The API allows only 1 request every 2 minutes.',
             suggestion: 'Please wait 2 minutes before trying again. Consider requesting higher API quotas from Google Cloud Console.',
             retryAfter: 120,
             isRateLimit: true,
             details: {
               errorType: 'rate_limit',
               waitTime: '2 minutes',
               reason: 'Google Business Profile API has strict quota limits'
             }
           }, { status: 429 });
         }
         
         // Authentication/token errors
         if (errorMessage.includes('401') || 
             errorMessage.includes('unauthorized') ||
             errorMessage.includes('invalid credentials') ||
             errorMessage.includes('token expired')) {
           
           // Try to refresh the token
           if (tokens.refresh_token) {
             try {
               const newTokens = await client.refreshAccessToken();
               if (newTokens && newTokens.access_token) {
                 // Update tokens in database
                await serviceSupabase
                  .from('google_business_profiles')
                  .update({
                    access_token: newTokens.access_token,
                    expires_at: new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('account_id', accountId);
                 
                 return NextResponse.json({
                   success: false,
                   error: 'TOKEN_REFRESHED',
                   message: 'Your Google authentication was refreshed. Please try again.',
                   shouldRetry: true
                 }, { status: 401 });
               }
             } catch (refreshError) {
               console.error('❌ Token refresh failed:', refreshError);
             }
           }
           
           return NextResponse.json({
             success: false,
             error: 'AUTH_ERROR',
             message: 'Your Google Business Profile connection has expired or is invalid.',
             suggestion: 'Please disconnect and reconnect your Google Business Profile account.',
             details: {
               errorType: 'authentication',
               action: 'reconnect_required'
             }
           }, { status: 401 });
         }
         
         // Permission errors
         if (errorMessage.includes('403') || 
             errorMessage.includes('forbidden') ||
             errorMessage.includes('permission denied') ||
             errorMessage.includes('access denied')) {
           return NextResponse.json({
             success: false,
             error: 'PERMISSION_ERROR',
             message: 'You don\'t have permission to access these Google Business Profile locations.',
             suggestion: 'Ensure you have admin or manager access to the Google Business Profile account.',
             details: {
               errorType: 'permissions',
               requiredRole: 'Admin or Manager',
               action: 'check_google_permissions'
             }
           }, { status: 403 });
         }
         
         // Network/timeout errors
         if (errorMessage.includes('timeout') || 
             errorMessage.includes('econnrefused') ||
             errorMessage.includes('network')) {
           return NextResponse.json({
             success: false,
             error: 'NETWORK_ERROR',
             message: 'Unable to connect to Google Business Profile API.',
             suggestion: 'Check your internet connection and try again.',
             details: {
               errorType: 'network',
               action: 'retry'
             }
           }, { status: 503 });
         }
         
         // Google API specific errors
         if (errorMessage.includes('google') || errorMessage.includes('gmbapi')) {
           errorResponse.details = {
             googleError: apiError.message,
             suggestion: 'The Google Business Profile API returned an error. This might be temporary.'
           };
         }
       }
       
       // Log the full error for debugging
       console.error('❌ Unhandled API error:', {
         name: (apiError as any)?.name,
         message: (apiError as any)?.message,
         stack: (apiError as any)?.stack
       });
       
       return NextResponse.json(errorResponse, { status: 500 });
     }

  } catch (error) {
    console.error('Error in fetch-locations API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false
    }, { status: 500 });
  }
} 
