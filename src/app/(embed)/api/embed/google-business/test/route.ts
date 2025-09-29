/**
 * Test endpoint to debug Google Business Profile API access
 * This endpoint directly tests the stored OAuth tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/services/optimizerLeadService';
import { unpackAndDecryptToken } from '@/lib/crypto/googleTokenCipher';

export async function GET(request: NextRequest) {
  try {
    // Get session token from authorization header
    const authHeader = request.headers.get('authorization');
    const sessionHeader = request.headers.get('x-session-token');

    let sessionToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    } else if (sessionHeader) {
      sessionToken = sessionHeader.trim();
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Missing or invalid session token' },
        { status: 401 }
      );
    }

    // Validate session
    let sessionInfo;
    try {
      sessionInfo = await validateSession(sessionToken);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get the session data from database to retrieve Google tokens
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('optimizer_sessions')
      .select('*')
      .eq('id', sessionInfo.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if Google tokens exist
    if (!session.google_access_token_cipher) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    // Decrypt the access token
    let accessToken: string;
    try {
      if (session.google_token_key_version) {
        // Token is encrypted
        accessToken = unpackAndDecryptToken(session.google_access_token_cipher);
      } else {
        // Token is not encrypted (dev mode)
        accessToken = session.google_access_token_cipher;
      }
    } catch (decryptError) {
      console.error('Failed to decrypt access token:', decryptError);
      return NextResponse.json(
        { error: 'Failed to access Google credentials' },
        { status: 500 }
      );
    }

    // Test 1: Get token info from Google
    console.log('🔍 Testing token info...');
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
    );

    let tokenInfo = null;
    if (tokenInfoResponse.ok) {
      tokenInfo = await tokenInfoResponse.json();
      console.log('✅ Token info:', JSON.stringify(tokenInfo, null, 2));
    } else {
      console.log('❌ Failed to get token info:', tokenInfoResponse.status);
    }

    // Test 2: Get user info
    console.log('🔍 Testing user info...');
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    let userInfo = null;
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
      console.log('✅ User info:', JSON.stringify(userInfo, null, 2));
    } else {
      console.log('❌ Failed to get user info:', userInfoResponse.status);
    }

    // Test 3: Fetch ALL accounts with detailed logging
    console.log('🔍 Testing account fetching...');
    // Try both with and without filter parameter
    const accountsUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=50';
    const accountsUrlWithFilter = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=50&filter=role=OWNER';
    console.log('📡 Fetching from:', accountsUrl);

    const accountsResponse = await fetch(accountsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    let accounts = [];
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('✅ Accounts response:', JSON.stringify(accountsData, null, 2));
      accounts = accountsData.accounts || [];
    } else {
      const errorText = await accountsResponse.text();
      console.log('❌ Failed to get accounts:', accountsResponse.status, errorText);
    }

    // Test 4: Try to get locations for each account
    const locationTests = [];
    for (const account of accounts) {
      console.log(`\n🔍 Testing locations for account: ${account.name}`);

      // Try Business Information API v1
      const v1Url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?pageSize=10`;
      console.log('📍 Testing v1 URL:', v1Url);

      const v1Response = await fetch(v1Url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      let v1Result;
      if (v1Response.ok) {
        const data = await v1Response.json();
        v1Result = {
          success: true,
          locationCount: data.locations?.length || 0,
          locations: data.locations?.slice(0, 3) // First 3 for brevity
        };
        console.log('✅ v1 Success:', v1Result.locationCount, 'locations found');
      } else {
        const errorText = await v1Response.text();
        v1Result = {
          success: false,
          status: v1Response.status,
          error: errorText.substring(0, 200)
        };
        console.log('❌ v1 Failed:', v1Response.status);
      }

      // Try legacy v4 API for comparison
      const accountId = account.name.replace('accounts/', '');
      const v4Url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations`;
      console.log('📍 Testing v4 URL:', v4Url);

      const v4Response = await fetch(v4Url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      let v4Result;
      if (v4Response.ok) {
        const data = await v4Response.json();
        v4Result = {
          success: true,
          locationCount: data.locations?.length || 0
        };
        console.log('✅ v4 Success:', v4Result.locationCount, 'locations found');
      } else {
        v4Result = {
          success: false,
          status: v4Response.status
        };
        console.log('❌ v4 Failed:', v4Response.status);
      }

      locationTests.push({
        account: account.name,
        accountName: account.accountName,
        type: account.type,
        role: account.role,
        verificationState: account.verificationState,
        vettedState: account.vettedState,
        v1Result,
        v4Result
      });
    }

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      tests: {
        tokenInfo,
        userInfo,
        accountsFound: accounts.length,
        accounts: accounts,
        locationTests
      },
      summary: {
        tokenValid: !!tokenInfo,
        userEmail: userInfo?.email,
        accountCount: accounts.length,
        verifiedAccounts: accounts.filter((a: any) => a.verificationState === 'VERIFIED').length,
        unverifiedAccounts: accounts.filter((a: any) => a.verificationState !== 'VERIFIED').length
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
