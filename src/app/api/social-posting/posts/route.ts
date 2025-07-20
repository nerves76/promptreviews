/**
 * Social Media Posts API Route
 * Handles post creation and publishing across platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { postManager } from '@/features/social-posting';
import { GoogleBusinessProfileAdapter } from '@/features/social-posting/platforms/google-business-profile/adapter';
import type { UniversalPost } from '@/features/social-posting';

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

    // Demo mode to bypass Google's extreme rate limits during development
    const isDemoMode = process.env.NODE_ENV === 'development';
    
    if (isDemoMode) {
      console.log('🎭 Demo mode: Simulating Google Business Profile post creation');
      
      // Simulate successful post creation
      const demoResults = {
        'google-business-profile': {
          success: true,
          platformPostId: `demo_post_${Date.now()}`,
          message: 'Demo post created successfully! (Demo mode - Google rate limits bypassed)',
          isDemoMode: true
        }
      };
      
      return NextResponse.json({
        success: true,
        data: {
          validationResults: {
            'google-business-profile': {
              isValid: true,
              errors: [],
              warnings: ['Demo mode active - no real post created']
            }
          },
          publishResults: demoResults,
          optimizedContent: {
            'google-business-profile': postData.content
          },
          isDemoMode: true
        }
      });
    }
    
    // Initialize adapters if not already registered
    if (!postManager.getAdapter('google-business-profile')) {
      const gbpAdapter = new GoogleBusinessProfileAdapter({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      });
      
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