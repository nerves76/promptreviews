/**
 * API Route: POST /api/social-posting/platforms/google-business-profile/fetch-locations
 * Fetches Google Business Profile locations from the API and stores them in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

    // Parse request body 
    const body = await request.json();
    
    console.log('🔍 Fetch-locations API called - Real API mode only');

    // Always use real Google API calls - no demo mode

    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
      const accounts = await client.listAccounts();
      console.log('✅ Found Google Business Profile accounts:', accounts.length);
      
      const allLocations = [];
      
      // Fetch locations for each account
      for (const account of accounts) {
        try {
          console.log(`🔍 Fetching locations for account: ${account.name}`);
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