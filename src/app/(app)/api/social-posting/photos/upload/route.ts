/**
 * API endpoint for uploading photos to Google Business Profile locations
 * Handles individual photo uploads with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Create Supabase client and verify user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }


    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const locationId = formData.get('locationId') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }


    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get Google Business Profile tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
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

    // Get account ID from the location ID (need to fetch this)
    // For now, we'll extract it from stored location data or use a default
    const { data: locationData, error: locationError } = await supabase
      .from('google_business_locations')
      .select('account_id, location_id')
      .eq('account_id', accountId)
      .eq('location_id', locationId)
      .single();

    if (locationError || !locationData) {
      console.error('Failed to find location data:', locationError);
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 400 }
      );
    }

    const locationAccountId = locationData.account_id || accountId;

    // Upload the photo to Google Business Profile
    const uploadResult = await gbpClient.uploadMedia(
      locationAccountId,
      locationId,
      file,
      { mediaFormat: 'PHOTO' }
    );

    if (!uploadResult.success) {
      console.error('Failed to upload photo to Google Business Profile:', uploadResult.error);
      return NextResponse.json(
        { 
          success: false, 
          message: uploadResult.error || 'Failed to upload photo to Google Business Profile' 
        },
        { status: 500 }
      );
    }


    // Store upload record in database for tracking (use service role to bypass RLS)
    try {
      const serviceSupabase = createServiceRoleClient();
      const { error: insertError } = await serviceSupabase
        .from('google_business_media_uploads')
        .insert({
          user_id: user.id,
          location_id: locationId,
          account_id: locationAccountId,
          file_name: file.name,
          file_size: file.size,
          category: category || 'general',
          description: description || null,
          google_media_name: uploadResult.mediaItem?.name || null,
          upload_status: 'completed',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Failed to store upload record:', insertError);
        // Don't fail the request if we can't store the record
      } else {
      }
    } catch (dbError) {
      console.warn('Database logging error:', dbError);
      // Don't fail the request if database logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      mediaItem: uploadResult.mediaItem
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 
