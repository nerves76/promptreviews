/**
 * API endpoint for fetching existing photos from Google Business Profile locations
 * Returns photos with metadata for display and organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(request: NextRequest) {
  try {

    // Create Supabase client and verify user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 401 }
      );
    }


    // Parse the request body
    const { locationId } = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }


    // Get Google Business Profile tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error('Failed to get Google Business Profile tokens:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }


    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(tokenData.expires_at).getTime()
    });

    // Fetch photos for the location
    const photos = await gbpClient.getMedia(locationId);


    // Organize photos by category (if category info is available)
    // Google's media API may not always include category info, so we'll try to infer or use default
    const organizedPhotos = photos.map(photo => ({
      id: photo.name || photo.mediaKey,
      url: photo.googleUrl || photo.sourceUrl,
      thumbnailUrl: photo.thumbnailUrl,
      category: photo.category || 'general', // Default category if not specified
      mediaFormat: photo.mediaFormat || 'PHOTO',
      createTime: photo.createTime,
      dimensions: photo.dimensions,
      attribution: photo.attribution
    }));

    return NextResponse.json({
      success: true,
      photos: organizedPhotos,
      totalCount: photos.length,
      locationId
    });

  } catch (error) {
    console.error('💥 Error in fetch photos API:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { success: false, message: 'Google Business Profile authorization expired. Please reconnect.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json(
          { success: false, message: 'Access denied. Please check your Google Business Profile permissions.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { success: false, message: 'Location not found or no longer accessible.' },
          { status: 404 }
        );
      }

      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, message: 'Google API rate limit exceeded. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch photos. Please try again.' },
      { status: 500 }
    );
  }
}