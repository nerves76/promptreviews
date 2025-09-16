/**
 * API Route: Update Review Reply
 * 
 * Updates an existing reply to a specific Google Business Profile review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function PUT(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { locationId, reviewId, updatedReplyText } = body;

    if (!locationId || !reviewId || !updatedReplyText) {
      return NextResponse.json(
        { error: 'Location ID, review ID, and updated reply text are required' },
        { status: 400 }
      );
    }

    if (updatedReplyText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reply must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client that handles session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }


    // Get Google Business Profile tokens for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ No Google Business Profile tokens found:', tokenError);
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }


    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : Date.now() + 3600000
    });

    // Update reply to review
    const result = await gbpClient.updateReviewReply(locationId, reviewId, updatedReplyText.trim());


    return NextResponse.json({
      success: true,
      message: 'Reply updated successfully',
      result
    });

  } catch (error) {
    console.error('💥 Error in update review reply API:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Review or reply not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Not authorized to update this reply' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update review reply. Please try again.' },
      { status: 500 }
    );
  }
}