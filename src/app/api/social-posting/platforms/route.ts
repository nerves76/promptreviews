/**
 * Social Media Platforms API Route
 * Handles platform connections and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { postManager } from '@/features/social-posting';
import { GoogleBusinessProfileAdapter } from '@/features/social-posting/platforms/google-business-profile/adapter';

export async function GET(request: NextRequest) {
  try {
    // Initialize Google Business Profile adapter if not already registered
    if (!postManager.getAdapter('google-business-profile')) {
      const gbpAdapter = new GoogleBusinessProfileAdapter({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      });
      
      postManager.registerAdapter('google-business-profile', gbpAdapter);
    }
    
    const connectedPlatforms = postManager.getConnectedPlatforms();
    const availablePlatforms = postManager.getAvailablePlatforms();
    const adapters = postManager.getAdapters();
    
    const platformsInfo = Array.from(adapters.entries()).map(([id, adapter]) => ({
      id,
      platform: adapter.platform,
      isConnected: adapter.isAuthenticated()
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        connected: connectedPlatforms,
        available: availablePlatforms,
        platforms: platformsInfo
      }
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch platform information' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platformId, action } = await request.json();
    
    const adapter = postManager.getAdapter(platformId);
    if (!adapter) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404 }
      );
    }
    
    let result = false;
    
    switch (action) {
      case 'connect':
        result = await adapter.authenticate();
        break;
      case 'disconnect':
        // TODO: Implement disconnect logic
        break;
      case 'refresh':
        result = await adapter.refreshAuth();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: result,
      data: {
        platformId,
        action,
        isConnected: adapter.isAuthenticated()
      }
    });
  } catch (error) {
    console.error('Error managing platform:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage platform' },
      { status: 500 }
    );
  }
} 