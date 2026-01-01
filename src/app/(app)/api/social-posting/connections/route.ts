/**
 * Social Platform Connections API
 *
 * Endpoints for managing social platform connections (Bluesky, Twitter, Slack)
 * Google Business connections continue to use existing endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/social-posting/connections
 *
 * Get all social platform connections for the current account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('🔒 [Social Connections GET] Authentication failed:', {
        error: userError?.message || 'No user session found',
        hasAuthCookie: !!request.cookies.get('sb-access-token')
      });
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: 'You must be logged in to view social platform connections'
        },
        { status: 401 }
      );
    }

    // Get account ID from header (set by apiClient for account isolation)
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.warn('[Social Connections GET] No valid account found for user:', user.id);
      return NextResponse.json(
        {
          error: 'Account not found',
          details: 'No valid account found for this user'
        },
        { status: 403 }
      );
    }

    // Get all connections for this account
    const { data: connections, error: connectionsError } = await supabase
      .from('social_platform_connections')
      .select('id, platform, status, metadata, connected_at, last_validated_at, error_message')
      .eq('account_id', accountId);

    if (connectionsError) {
      console.error('❌ [Social Connections GET] Database error fetching connections:', {
        accountId,
        error: connectionsError.message,
        code: connectionsError.code
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch social platform connections',
          details: connectionsError.message
        },
        { status: 500 }
      );
    }

    // Format response (never return credentials)
    const formattedConnections = (connections || []).map(conn => ({
      id: conn.id,
      platform: conn.platform,
      status: conn.status,
      handle: conn.metadata?.handle || conn.metadata?.username || null,
      displayName: conn.metadata?.displayName || conn.metadata?.teamName || null,
      connectedAt: conn.connected_at,
      lastValidatedAt: conn.last_validated_at,
      error: conn.status === 'error' ? conn.error_message : null
    }));

    return NextResponse.json({
      connections: formattedConnections
    });
  } catch (error) {
    console.error('❌ [Social Connections GET] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social-posting/connections
 *
 * Create a new social platform connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('🔒 [Social Connections POST] Authentication failed:', {
        error: userError?.message || 'No user session found',
        hasAuthCookie: !!request.cookies.get('sb-access-token')
      });
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: 'You must be logged in to connect social platforms'
        },
        { status: 401 }
      );
    }

    // Get account ID from header (set by apiClient for account isolation)
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.warn('[Social Connections POST] No valid account found for user:', user.id);
      return NextResponse.json(
        {
          error: 'Account not found',
          details: 'No valid account found for this user'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { platform, identifier, appPassword } = body;

    if (!platform || !identifier || !appPassword) {
      console.warn('[Social Connections POST] Missing required fields:', {
        hasPlatform: !!platform,
        hasIdentifier: !!identifier,
        hasAppPassword: !!appPassword
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'platform, identifier, and appPassword are all required'
        },
        { status: 400 }
      );
    }

    // Validate platform
    if (platform !== 'bluesky' && platform !== 'twitter' && platform !== 'slack') {
      console.warn('[Social Connections POST] Invalid platform requested:', platform);
      return NextResponse.json(
        {
          error: 'Invalid platform',
          details: `Platform '${platform}' is not supported. Supported platforms: bluesky, twitter, slack`
        },
        { status: 400 }
      );
    }

    // Currently only Bluesky is implemented
    if (platform !== 'bluesky') {
      console.warn('[Social Connections POST] Platform not yet available:', platform);
      return NextResponse.json(
        {
          error: 'Platform not available',
          details: `${platform} integration is coming soon. Currently only Bluesky is supported.`
        },
        { status: 400 }
      );
    }

    // Validate credentials with Bluesky
    console.log(`[Social Connections POST] Attempting to authenticate with Bluesky for identifier: ${identifier}`);
    const { BlueskyAdapter } = await import('@/features/social-posting/platforms/bluesky');

    const adapter = new BlueskyAdapter({
      identifier,
      appPassword
    });

    const authSuccess = await adapter.authenticate();

    if (!authSuccess) {
      console.warn('[Social Connections POST] Bluesky authentication failed:', {
        identifier,
        accountId
      });
      return NextResponse.json(
        {
          error: 'Bluesky authentication failed',
          details: 'Unable to authenticate with Bluesky. Please verify your username/email and app password are correct.'
        },
        { status: 401 }
      );
    }

    // Get session data and metadata
    const sessionData = adapter.getSessionData();
    const handle = adapter.getHandle();
    const did = adapter.getDID();

    if (!sessionData || !handle || !did) {
      console.error('[Social Connections POST] Failed to retrieve Bluesky session data:', {
        hasSessionData: !!sessionData,
        hasHandle: !!handle,
        hasDID: !!did
      });
      return NextResponse.json(
        {
          error: 'Bluesky session error',
          details: 'Successfully authenticated but failed to retrieve account information. Please try again.'
        },
        { status: 500 }
      );
    }

    console.log(`✅ [Social Connections POST] Bluesky authenticated successfully as @${handle}`);

    // Store the connection in the database
    // Note: credentials should be encrypted in production
    const { data: connection, error: insertError } = await supabase
      .from('social_platform_connections')
      .insert({
        account_id: accountId,
        user_id: user.id,
        platform,
        credentials: {
          identifier,
          appPassword, // TODO: Encrypt this in production
          did
        },
        metadata: {
          handle,
          displayName: handle,
          did
        },
        status: 'active',
        last_validated_at: new Date().toISOString()
      })
      .select('id, platform, status, metadata, connected_at')
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        console.warn('[Social Connections POST] Duplicate connection attempt:', {
          accountId,
          platform,
          handle
        });
        return NextResponse.json(
          {
            error: 'Connection already exists',
            details: `A ${platform} connection already exists for this account. Please disconnect the existing connection first.`
          },
          { status: 409 }
        );
      }

      console.error('❌ [Social Connections POST] Database error inserting connection:', {
        accountId,
        platform,
        error: insertError.message,
        code: insertError.code
      });
      return NextResponse.json(
        {
          error: 'Failed to save connection',
          details: insertError.message
        },
        { status: 500 }
      );
    }

    console.log(`✅ [Social Connections POST] Connection saved successfully:`, {
      connectionId: connection.id,
      platform,
      handle
    });

    return NextResponse.json({
      connection: {
        id: connection.id,
        platform: connection.platform,
        status: connection.status,
        handle: connection.metadata?.handle,
        connectedAt: connection.connected_at
      }
    });
  } catch (error) {
    console.error('❌ [Social Connections POST] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social-posting/connections
 *
 * Delete a social platform connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('🔒 [Social Connections DELETE] Authentication failed:', {
        error: userError?.message || 'No user session found',
        hasAuthCookie: !!request.cookies.get('sb-access-token')
      });
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: 'You must be logged in to disconnect social platforms'
        },
        { status: 401 }
      );
    }

    // Get account ID from header (set by apiClient for account isolation)
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.warn('[Social Connections DELETE] No valid account found for user:', user.id);
      return NextResponse.json(
        {
          error: 'Account not found',
          details: 'No valid account found for this user'
        },
        { status: 403 }
      );
    }

    // Delete all connections for this account and platform (Bluesky)
    // This allows users to disconnect and reconnect without unique constraint violations
    console.log('[Social Connections DELETE] Deleting Bluesky connection for account:', accountId);
    const { error: deleteError } = await supabase
      .from('social_platform_connections')
      .delete()
      .eq('account_id', accountId)
      .eq('platform', 'bluesky');

    if (deleteError) {
      console.error('❌ [Social Connections DELETE] Database error deleting connection:', {
        accountId,
        error: deleteError.message,
        code: deleteError.code
      });
      return NextResponse.json(
        {
          error: 'Failed to delete connection',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ [Social Connections DELETE] Connection deleted successfully for account:', accountId);

    return NextResponse.json({
      success: true,
      message: 'Bluesky connection disconnected successfully'
    });
  } catch (error) {
    console.error('❌ [Social Connections DELETE] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
