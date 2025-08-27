/**
 * Google Business Profile Revoke API Route
 * Completely revokes app permissions from Google's side
 * This forces Google to forget cached permissions and re-prompt on next connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Google Business Profile revoke requested');
    
    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated for revoke:', userError || 'No user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated for revoke:', user.id);
    
    // Get the tokens to revoke
    const { data: tokenData } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single();
    
    let revokeSuccess = false;
    let revokeMessage = '';
    
    if (tokenData?.access_token || tokenData?.refresh_token) {
      // Try to revoke both tokens if available
      const tokenToRevoke = tokenData.refresh_token || tokenData.access_token;
      
      console.log('🔄 Revoking Google tokens completely...');
      
      try {
        // Use Google's revoke endpoint to completely clear permissions
        const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${tokenToRevoke}`,
        });
        
        const responseText = await revokeResponse.text();
        
        if (revokeResponse.ok) {
          console.log('✅ Successfully revoked Google tokens - permissions cleared from Google');
          revokeSuccess = true;
          revokeMessage = 'Google permissions completely revoked. You can now reconnect with fresh permissions.';
        } else if (revokeResponse.status === 400 && responseText.includes('Token expired or revoked')) {
          console.log('ℹ️ Tokens already revoked or expired');
          revokeSuccess = true;
          revokeMessage = 'Google permissions already cleared. You can now reconnect.';
        } else {
          console.warn('⚠️ Failed to revoke Google tokens:', revokeResponse.status, responseText);
          revokeMessage = 'Could not revoke Google permissions, but you can still try reconnecting.';
        }
      } catch (revokeError) {
        console.error('❌ Error revoking tokens:', revokeError);
        revokeMessage = 'Error revoking permissions, but you can still try reconnecting.';
      }
    } else {
      console.log('ℹ️ No tokens found to revoke');
      revokeSuccess = true;
      revokeMessage = 'No existing Google permissions found. You can connect fresh.';
    }
    
    // Clear tokens from database regardless of revoke success
    const { error: deleteError } = await supabase
      .from('google_business_profiles')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('❌ Error removing tokens from database:', deleteError);
    } else {
      console.log('✅ Cleared tokens from database');
    }
    
    // Also clear locations and rate limits
    await supabase
      .from('google_business_locations')
      .delete()
      .eq('user_id', user.id);
    
    await supabase
      .from('google_api_rate_limits')
      .delete()
      .eq('user_id', user.id);
    
    return NextResponse.json({
      success: true,
      revoked: revokeSuccess,
      message: revokeMessage
    });
    
  } catch (error) {
    console.error('💥 Unexpected error during Google Business Profile revoke:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during revoke' },
      { status: 500 }
    );
  }
}