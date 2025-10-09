/**
 * Social Media Posts API Route
 * Handles post creation and publishing across platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { postManager } from '@/features/social-posting';
import { GoogleBusinessProfileAdapter } from '@/features/social-posting/platforms/google-business-profile/adapter';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '../utils/getRequestAccountId';
import type { UniversalPost, PlatformId } from '@/features/social-posting';

export async function POST(request: NextRequest) {
  try {
    const postData: UniversalPost = await request.json();
    
    // Validate request
    if (!postData.content || !postData.platforms || postData.platforms.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post content and platforms are required' 
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get user's Google Business Profile tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokens) {
      return NextResponse.json({
        success: false,
        error: 'Platform google-business-profile is not authenticated'
      }, { status: 401 });
    }

    // Initialize adapters if not already registered or if tokens have changed
    const platformId: PlatformId = 'google-business-profile';
    if (!postManager.getAdapter(platformId)) {
      // Create Google Business Profile client with actual user tokens
      const client = new GoogleBusinessProfileClient({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at).getTime()
      });

      // Get the account ID from the tokens or stored data
      // We need to get this to avoid extra API calls in the adapter
      const { data: locationData } = await supabase
        .from('google_business_locations')
        .select('account_name')
        .eq('account_id', accountId)
        .limit(1);

      let accountId = null;
      if (locationData && locationData.length > 0 && locationData[0].account_name) {
        // Extract account ID from the stored account name (accounts/{id})
        accountId = locationData[0].account_name.replace('accounts/', '');
      }

      // If we don't have the account ID from stored data, we'll let the adapter handle it
      if (!accountId) {
      }

      // Create adapter with the authenticated client
      const gbpAdapter = new GoogleBusinessProfileAdapter({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      });

      // Set the client, account ID, and mark as authenticated
      (gbpAdapter as any).client = client;
      (gbpAdapter as any).accountId = accountId; // Pass account ID to avoid API calls
      (gbpAdapter as any).isAuth = true;
      
      postManager.registerAdapter('google-business-profile', gbpAdapter);
    }
    
    // Validate the post across all platforms
    const validationResults = await postManager.validatePost(postData);
    
    // Check if any platform has validation errors
    const hasErrors = Object.values(validationResults).some(result => !result.isValid);
    if (hasErrors) {
      return NextResponse.json({
        success: false,
        error: 'Post validation failed',
        validationResults
      }, { status: 400 });
    }
    
    // Publish the post
    const publishResults = await postManager.publishPost(postData);
    
    // Check if any publication failed
    const hasFailures = Object.values(publishResults).some(result => !result.success);
    
    return NextResponse.json({
      success: !hasFailures,
      data: {
        validationResults,
        publishResults,
        optimizedContent: postManager.optimizePostForPlatforms(postData)
      }
    });
    
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to publish post' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement post history/listing
    return NextResponse.json({
      success: true,
      data: {
        posts: [],
        message: 'Post history not yet implemented'
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts' 
      },
      { status: 500 }
    );
  }
} 
