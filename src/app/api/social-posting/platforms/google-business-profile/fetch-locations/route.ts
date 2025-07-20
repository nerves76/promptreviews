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

    // Demo mode to bypass Google's extreme rate limits during development
    const isDemoMode = process.env.NODE_ENV === 'development';
    
    if (isDemoMode) {
      console.log('🎭 Demo mode: Simulating Google Business Profile locations');
      
      // Simulate demo locations
      const demoLocations = [
        {
          user_id: user.id,
          location_id: 'accounts/demo-account/locations/demo-location-1',
          location_name: 'Demo Business Location #1',
          address: '123 Main St, Anytown, USA',
          status: 'VERIFIED',
          primary_phone: '+1 (555) 123-4567',
          website_uri: 'https://demo-business.com',
          created_at: new Date().toISOString()
        },
        {
          user_id: user.id,
          location_id: 'accounts/demo-account/locations/demo-location-2', 
          location_name: 'Demo Business Location #2',
          address: '456 Oak Ave, Another City, USA',
          status: 'VERIFIED',
          primary_phone: '+1 (555) 987-6543',
          website_uri: 'https://demo-business-2.com',
          created_at: new Date().toISOString()
        }
      ];
      
      // Store demo locations in database
      for (const locationData of demoLocations) {
        await serviceSupabase
          .from('google_business_locations')
          .upsert(locationData, { 
            onConflict: 'user_id,location_id',
            ignoreDuplicates: false
          });
      }
      
      console.log(`✅ Demo mode: Created ${demoLocations.length} demo locations`);
      
      return NextResponse.json({
        success: true,
        message: `Demo mode: Created ${demoLocations.length} business locations for testing`,
        locations: demoLocations,
        isDemoMode: true
      });
    }

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
      
      const allLocations = [];
      
      // Wait 75 seconds after listAccounts call before making any listLocations calls
      if (accounts.length > 0) {
        console.log('⏳ Waiting 75 seconds for rate limit compliance after listing accounts...');
        await new Promise(resolve => setTimeout(resolve, 75000)); // 75 seconds
      }
      
      // Fetch locations for each account with rate limiting
      // Google Business Profile API allows only 1 request per minute
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        
        // If this isn't the first location fetch, wait 75 seconds between calls
        if (i > 0) {
          console.log(`⏳ Waiting 75 seconds for rate limit compliance before fetching locations for account ${i + 1}/${accounts.length}...`);
          await new Promise(resolve => setTimeout(resolve, 75000)); // 75 seconds
        }
        
        try {
          console.log(`🔍 Fetching locations for account: ${account.name} (${i + 1}/${accounts.length})`);
          
          // Update rate limit timestamp before this API call
          await serviceSupabase
            .from('google_api_rate_limits')
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
              location_name: location.name,
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
            } else {
              allLocations.push(locationData);
            }
          }
        } catch (accountError) {
          console.error(`Error fetching locations for account ${account.name}:`, accountError);
          // Continue with other accounts even if one fails
        }
      }
      
      console.log(`✅ Successfully fetched and stored ${allLocations.length} locations`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully fetched ${allLocations.length} business locations`,
        locations: allLocations
      });
      
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