/**
 * Google Business Profile Disconnect API Route
 * Safely removes OAuth tokens and disconnects the platform
 * 
 * CRITICAL IMPLEMENTATION NOTES:
 * 
 * 1. MUST use service role client (createClient with SUPABASE_SERVICE_ROLE_KEY) for ALL database operations
 *    - Regular client will fail due to RLS policies on google_business_profiles table
 *    - Service role client bypasses RLS policies
 * 
 * 2. Order of operations:
 *    a. Get user authentication (use regular client)
 *    b. Attempt to revoke tokens with Google (optional, don't fail if it doesn't work)
 *    c. Delete from google_business_profiles table (use service role)
 *    d. Delete from google_business_locations table (use service role)
 *    e. Delete from google_api_rate_limits table (use service role)
 * 
 * 3. Frontend expectations:
 *    - Returns { success: true } on successful disconnect
 *    - Frontend MUST call loadPlatforms() after receiving response
 *    - Frontend MUST clear all local state (isConnected, locations, selectedLocationId)
 * 
 * 4. Common issues and solutions:
 *    - If tokens aren't deleted: Check you're using service role client
 *    - If UI doesn't update: Ensure frontend calls loadPlatforms() after disconnect
 *    - If locations remain: Check all cleanup queries are using service role client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    
    // Create server-side Supabase client for auth
    const cookieStore = await cookies();
    
    // Debug cookies
    const allCookies = cookieStore.getAll();
    
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
    
    // Create service role client for database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get current user with proper error handling
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    
    if (userError || !user) {
      console.error('❌ User not authenticated for disconnect:', userError || 'No user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    
    // Optional: Revoke tokens with Google first (best practice)
    try {
      
      // Get the tokens before we delete them (using service role)
      const { data: tokenData } = await serviceSupabase
        .from('google_business_profiles')
        .select('access_token')
        .eq('user_id', user.id)
        .single();
      
      if (tokenData?.access_token) {
        
        // Revoke the access token with Google
        const revokeResponse = await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        if (revokeResponse.ok) {
        } else {
          console.warn('⚠️ Failed to revoke Google tokens, proceeding with database cleanup');
        }
      } else {
      }
    } catch (revokeError) {
      console.warn('⚠️ Token revocation failed, proceeding with database cleanup:', revokeError);
      // Don't fail the whole operation if revocation fails
    }
    
    // First check if tokens exist before deleting (using service role)
    const { data: existingTokens, error: checkError } = await serviceSupabase
      .from('google_business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    
    // Remove Google Business Profile tokens from database (using service role)
    const { data: deleteData, error: deleteError, count } = await serviceSupabase
      .from('google_business_profiles')
      .delete()
      .eq('user_id', user.id)
      .select();
    
    if (deleteError) {
      console.error('❌ Error removing Google Business Profile tokens:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove connection from database' },
        { status: 500 }
      );
    }
    
    
    // Verify deletion (using service role)
    const { data: verifyTokens, error: verifyError } = await serviceSupabase
      .from('google_business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    
    // Also remove all Google Business locations for this user (using service role)
    const { error: locationsDeleteError } = await serviceSupabase
      .from('google_business_locations')
      .delete()
      .eq('user_id', user.id);
    
    if (locationsDeleteError) {
      console.error('⚠️ Error removing Google Business locations:', locationsDeleteError);
      // Don't fail the whole operation if location cleanup fails
    } else {
    }
    
    // Clean up rate limit records (using service role)
    const { error: rateLimitError } = await serviceSupabase
      .from('google_api_rate_limits')
      .delete()
      .eq('user_id', user.id);
    
    if (rateLimitError) {
      console.error('⚠️ Error removing rate limit records:', rateLimitError);
      // Don't fail the whole operation if rate limit cleanup fails
    } else {
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected Google Business Profile'
    });
    
  } catch (error) {
    console.error('💥 Unexpected error during Google Business Profile disconnect:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during disconnect' },
      { status: 500 }
    );
  }
}