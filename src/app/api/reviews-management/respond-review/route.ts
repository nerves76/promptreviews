/**
 * API Route: Respond to Review
 * 
 * Submits a reply to a specific Google Business Profile review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Respond to review API called');
    
    const body = await request.json();
    const { locationId, reviewId, replyText } = body;

    if (!locationId || !reviewId || !replyText) {
      return NextResponse.json(
        { error: 'Location ID, review ID, and reply text are required' },
        { status: 400 }
      );
    }

    if (replyText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reply must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client that handles session cookies
    const cookieStore = cookies();
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

    console.log('✅ User authenticated:', user.id);

    // Get Google Business Profile tokens for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ No Google Business Profile tokens found:', tokenError);
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    console.log('✅ Found Google Business Profile tokens for user:', user.id);

    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    });

    // Submit reply to review
    console.log('🔄 Submitting reply to review:', reviewId);
    const result = await gbpClient.replyToReview(locationId, reviewId, replyText.trim());

    console.log('✅ Successfully submitted reply to review');

    return NextResponse.json({
      success: true,
      message: 'Reply submitted successfully',
      result
    });

  } catch (error) {
    console.error('💥 Error in respond to review API:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Google Business Profile authorization expired. Please reconnect.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json(
          { error: 'Access denied. You may not have permission to reply to reviews for this location.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Review or location not found.' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('400') || error.message.includes('INVALID_ARGUMENT')) {
        return NextResponse.json(
          { error: 'Invalid request. The review may already have a reply or cannot be replied to.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to submit reply. Please try again.' },
      { status: 500 }
    );
  }
} 