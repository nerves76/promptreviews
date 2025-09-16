/**
 * Test API endpoint for Google OAuth with rate limit bypass
 * Uses cached responses and mock data to test the integration
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
const MOCK_ACCOUNTS = [
  {
    name: 'accounts/123456789',
    accountName: 'Test Business Account',
    type: 'PERSONAL',
    state: 'VERIFIED',
    profile: {
      accountId: '123456789',
      name: 'Test Business',
      accountName: 'Test Business Account',
      profileImageUri: 'https://example.com/logo.png'
    }
  }
];

const MOCK_LOCATIONS = [
  {
    name: 'accounts/123456789/locations/987654321',
    locationName: 'Test Business Location',
    languageCode: 'en-US',
    storeCode: 'TEST001',
    locationState: {
      name: 'Test Business Location',
      address: {
        addressLines: ['123 Test Street'],
        locality: 'Test City',
        administrativeArea: 'Test State',
        postalCode: '12345',
        regionCode: 'US'
      },
      phone: '+1-555-123-4567',
      websiteUri: 'https://testbusiness.com',
      regularHours: {
        periods: [
          {
            openDay: 'MONDAY',
            openTime: '09:00',
            closeDay: 'MONDAY',
            closeTime: '17:00'
          }
        ]
      }
    },
    profile: {
      locationName: 'Test Business Location',
      websiteUri: 'https://testbusiness.com',
      phone: '+1-555-123-4567'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const mockDelay = searchParams.get('delay') === 'true';

    // Simulate API delay if requested
    if (mockDelay) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    switch (action) {
      case 'accounts':
        return NextResponse.json({
          success: true,
          accounts: MOCK_ACCOUNTS,
          message: 'Mock accounts retrieved successfully'
        });

      case 'locations':
        const accountId = searchParams.get('accountId') || '123456789';
        return NextResponse.json({
          success: true,
          locations: MOCK_LOCATIONS,
          message: `Mock locations for account ${accountId} retrieved successfully`
        });

      case 'test-connection':
        return NextResponse.json({
          success: true,
          connected: true,
          message: 'Mock connection test successful',
          data: {
            accountsCount: MOCK_ACCOUNTS.length,
            locationsCount: MOCK_LOCATIONS.length,
            lastTested: new Date().toISOString()
          }
        });

      case 'environment':
        return NextResponse.json({
          success: true,
          environment: {
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV
          }
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Google OAuth Bypass Test API',
          availableActions: [
            'accounts - Get mock business accounts',
            'locations - Get mock business locations',
            'test-connection - Test mock connection',
            'environment - Check environment variables'
          ],
          usage: 'Add ?action=<action_name> to test specific functionality'
        });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'simulate-oauth':
        return NextResponse.json({
          success: true,
          message: 'Mock OAuth flow completed',
          tokens: {
            access_token: 'mock_access_token_' + Date.now(),
            refresh_token: 'mock_refresh_token_' + Date.now(),
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'https://www.googleapis.com/auth/plus.business.manage openid userinfo.email userinfo.profile'
          },
          user: {
            id: 'mock_user_id',
            email: 'test@example.com',
            name: 'Test User'
          }
        });

      case 'simulate-post':
        return NextResponse.json({
          success: true,
          message: 'Mock post created successfully',
          post: {
            id: 'mock_post_id_' + Date.now(),
            locationId: data?.locationId || 'mock_location_id',
            summary: data?.summary || 'Test post content',
            callToAction: data?.callToAction || 'LEARN_MORE',
            media: data?.media || [],
            createdAt: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          availableActions: ['simulate-oauth', 'simulate-post']
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 