/**
 * Google Business Profile Disconnect API Route
 * Safely removes OAuth tokens and disconnects the platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseClient';
import { getUserOrMock } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔌 Google Business Profile disconnect requested');
    
    // Get current user
    const supabase = createClient();
    const { data: { user }, error: userError } = await getUserOrMock(supabase);
    
    if (userError || !user) {
      console.error('❌ User not authenticated for disconnect:', userError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated for disconnect:', user.id);
    
    // Optional: Revoke tokens with Google first (best practice)
    try {
      console.log('🔄 Getting tokens for revocation...');
      
      // Get the tokens before we delete them
      const { data: tokenData } = await supabase
        .from('google_business_profiles')
        .select('access_token')
        .eq('user_id', user.id)
        .single();
      
      if (tokenData?.access_token) {
        console.log('🔄 Attempting to revoke Google tokens...');
        
        // Revoke the access token with Google
        const revokeResponse = await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        if (revokeResponse.ok) {
          console.log('✅ Successfully revoked Google tokens');
        } else {
          console.warn('⚠️ Failed to revoke Google tokens, proceeding with database cleanup');
        }
      } else {
        console.log('ℹ️ No access token found for revocation');
      }
    } catch (revokeError) {
      console.warn('⚠️ Token revocation failed, proceeding with database cleanup:', revokeError);
      // Don't fail the whole operation if revocation fails
    }
    
    // Remove Google Business Profile tokens from database
    const { error: deleteError } = await supabase
      .from('google_business_profiles')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('❌ Error removing Google Business Profile tokens:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove connection from database' },
        { status: 500 }
      );
    }
    
    console.log('✅ Successfully removed Google Business Profile tokens from database');
    
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