/**
 * Community User Search API
 *
 * GET /api/community/users/search - Search usernames for @mentions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../utils/auth';
import { createServiceClient } from '../../utils/supabase';

/**
 * GET /api/community/users/search
 * Searches community profiles for @mention autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        data: [],
        message: 'Query must be at least 2 characters'
      });
    }

    const supabase = createServiceClient();

    // Search usernames (fuzzy search using ILIKE)
    const { data: profiles, error } = await supabase
      .from('community_profiles')
      .select('user_id, username, display_name_override')
      .ilike('username', `%${query.toLowerCase()}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    // Get display identity for each user using RPC function
    const enrichedProfiles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: displayIdentity } = await supabase
          .rpc('get_user_display_identity', { p_user_id: profile.user_id });

        return {
          user_id: profile.user_id,
          username: profile.username,
          display_name_override: profile.display_name_override,
          full_display: displayIdentity || profile.username
        };
      })
    );

    return NextResponse.json({ data: enrichedProfiles });

  } catch (error) {
    console.error('User search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
