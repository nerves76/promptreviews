/**
 * API Route: POST /api/social-posting/platforms/google-business-profile/fetch-locations
 * Fetches Google Business Profile locations from the API and stores them in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

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
      console.log('Authentication error in fetch-locations API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Fetch-locations API called');

    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Production mode: Use real Google API calls

    // Check global rate limit status before making any API calls
    // Google Business Profile API allows only 1 request per minute per project
    const { data: rateLimitData, error: rateLimitError } = await serviceSupabase
      .from('google_api_rate_limits')
      .select('last_api_call_at')
      .eq('project_id', 'google-business-profile')
      .maybeSingle();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.log('⚠️ Error checking rate limit status:', rateLimitError);
    }

    const now = Date.now();
    const lastApiCall = rateLimitData?.last_api_call_at ? new Date(rateLimitData.last_api_call_at).getTime() : 0;
    const timeSinceLastCall = now - lastApiCall;
    const requiredWait = 120000; // 2 minutes to be conservative with quota exhaustion

    console.log(`🕐 Rate limit check: Last API call was ${Math.ceil(timeSinceLastCall / 1000)}s ago (required: ${Math.ceil(requiredWait / 1000)}s)`);

    if (timeSinceLastCall < requiredWait) {
      const remainingWait = Math.ceil((requiredWait - timeSinceLastCall) / 1000);
      console.log(`⏳ Global rate limit active. Last API call was ${Math.ceil(timeSinceLastCall / 1000)}s ago. Need to wait ${remainingWait}s more.`);
      
      return NextResponse.json({
        success: false,
        error: 'Google Business Profile API rate limit active',
        message: `Please wait ${remainingWait} more seconds before making another API request. Google has strict quota limits - consider requesting higher limits in Cloud Console.`,
        retryAfter: remainingWait,
        isRateLimit: true
      }, { status: 429 });
    }

    console.log('✅ Rate limit check passed, proceeding with API calls');

    // Get user's Google Business Profile tokens using service role
    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokens) {
      console.log('Google Business Profile tokens not found for user:', user.id, tokenError);
      return NextResponse.json({ 
        error: 'Google Business Profile not connected',
        success: false
      });
    }

    console.log('✅ Found Google Business Profile tokens for user:', user.id);

    // Create Google Business Profile client
    const client = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at).getTime()
    });

    try {
      // Fetch accounts from Google Business Profile API
      console.log('🔍 Fetching Google Business Profile accounts...');
      
      // Update rate limit timestamp right before making the API call
      await serviceSupabase
        .from('google_api_rate_limits')
        .upsert({
          project_id: 'google-business-profile',
          last_api_call_at: new Date().toISOString(),
          user_id: user.id
        });
      
      const accounts = await client.listAccounts();
      console.log('✅ Found Google Business Profile accounts:', accounts.length);
      
      let allLocations: any[] = [];
      let hasErrors = false;
      let errorMessages: string[] = [];
      
      // Store rate limit tracking in database using service role
      await serviceSupabase
        .from('google_business_api_rate_limits')
        .upsert({
          project_id: 'google-business-profile',
          last_api_call_at: new Date().toISOString(),
          user_id: user.id
        });

      // Process each account to fetch locations
      for (const account of accounts) {
        try {
          console.log(`🔍 Fetching locations for account: ${account.name} (${accounts.indexOf(account) + 1}/${accounts.length})`);
          
          // Store rate limit tracking in database using service role
          await serviceSupabase
            .from('google_business_api_rate_limits')
            .upsert({
              project_id: 'google-business-profile',
              last_api_call_at: new Date().toISOString(),
              user_id: user.id
            });
          
          const locations = await client.listLocations(account.name);
          console.log(`✅ Found ${locations.length} locations for account ${account.name}`);
          
          // Store locations in database
          for (const location of locations) {
            const locationData = {
              user_id: user.id,
              location_id: location.name,
              location_name: location.title || location.name, // Use title for display name, fallback to ID
              account_name: account.name, // Store the full account name (accounts/{id})
              address: location.address?.addressLines?.join(', ') || '',
              status: 'UNKNOWN',
              primary_phone: location.primaryPhone || '',
              website_uri: location.websiteUri || '',
              created_at: new Date().toISOString()
            };
            
            // Upsert location to avoid duplicates using service role
            const { error: insertError } = await serviceSupabase
              .from('google_business_locations')
              .upsert(locationData, { 
                onConflict: 'user_id,location_id',
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
        console.log(`❌ Failed to fetch locations due to errors: ${errorMessages.join(', ')}`);
        return NextResponse.json({
          success: false,
          message: `Failed to fetch business locations: ${errorMessages.join(', ')}`,
          locations: [],
          errors: errorMessages
        });
      } else if (hasErrors && allLocations.length > 0) {
        console.log(`⚠️ Partially successful: fetched ${allLocations.length} locations with some errors`);
        return NextResponse.json({
          success: true,
          message: `Fetched ${allLocations.length} business locations with some errors`,
          locations: allLocations,
          warnings: errorMessages
        });
      } else {
        console.log(`✅ Successfully fetched and stored ${allLocations.length} locations`);
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
       
       // Check if it's a rate limit error
       if (apiError instanceof Error && 
           (apiError.message.includes('429') || 
            apiError.message.includes('rate limit') ||
            apiError.message.includes('Quota exceeded') ||
            apiError.message.includes('Rate limit exceeded'))) {
         return NextResponse.json({
           success: false,
           error: 'Rate limit exceeded. Please try again in a few minutes.',
           message: 'Google Business Profile API rate limit reached. Please wait 1-2 minutes and try again.',
           retryAfter: 60, // Suggest waiting 60 seconds
           isRateLimit: true
         }, { status: 429 });
       }
       
       return NextResponse.json({
         success: false,
         error: 'Failed to fetch locations from Google Business Profile API',
         message: 'Unable to fetch business locations at this time.'
       }, { status: 500 });
     }

  } catch (error) {
    console.error('Error in fetch-locations API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false
    }, { status: 500 });
  }
} 