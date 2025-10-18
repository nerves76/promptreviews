/**
 * Social Platform Connections API
 *
 * Endpoints for managing social platform connections (Bluesky, Twitter, Slack)
 * Google Business connections continue to use existing endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * GET /api/social-posting/connections
 *
 * Get all social platform connections for the current account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the account ID from the request query
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Get all connections for this account
    const { data: connections, error: connectionsError } = await supabase
      .from('social_platform_connections')
      .select('id, platform, status, metadata, connected_at, last_validated_at, error_message')
      .eq('account_id', accountId);

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
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
    console.error('Unexpected error in GET /api/social-posting/connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, platform, identifier, appPassword } = body;

    if (!accountId || !platform || !identifier || !appPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, platform, identifier, appPassword' },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Validate platform
    if (platform !== 'bluesky' && platform !== 'twitter' && platform !== 'slack') {
      return NextResponse.json(
        { error: 'Invalid platform. Supported platforms: bluesky, twitter, slack' },
        { status: 400 }
      );
    }

    // Currently only Bluesky is implemented
    if (platform !== 'bluesky') {
      return NextResponse.json(
        { error: `${platform} integration is not yet available` },
        { status: 400 }
      );
    }

    // Validate credentials with Bluesky
    const { BlueskyAdapter } = await import('@/features/social-posting/platforms/bluesky');

    const adapter = new BlueskyAdapter({
      identifier,
      appPassword
    });

    const authSuccess = await adapter.authenticate();

    if (!authSuccess) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Bluesky. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Get session data and metadata
    const sessionData = adapter.getSessionData();
    const handle = adapter.getHandle();
    const did = adapter.getDID();

    if (!sessionData || !handle || !did) {
      return NextResponse.json(
        { error: 'Failed to retrieve Bluesky session data' },
        { status: 500 }
      );
    }

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
        return NextResponse.json(
          { error: `A ${platform} connection already exists for this account` },
          { status: 409 }
        );
      }

      console.error('Error inserting connection:', insertError);
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      );
    }

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
    console.error('Unexpected error in POST /api/social-posting/connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Delete all connections for this account and platform (Bluesky)
    // This allows users to disconnect and reconnect without unique constraint violations
    const { error: deleteError } = await supabase
      .from('social_platform_connections')
      .delete()
      .eq('account_id', accountId)
      .eq('platform', 'bluesky');

    if (deleteError) {
      console.error('Error deleting connection:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/social-posting/connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
