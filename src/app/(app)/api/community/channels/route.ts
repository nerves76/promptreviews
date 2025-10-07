/**
 * Community Channels API
 *
 * GET /api/community/channels - List all active channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../utils/auth';
import { createServiceClient } from '../utils/supabase';

/**
 * GET /api/community/channels
 * Returns list of all active community channels
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    // Fetch active channels
    const supabase = createServiceClient();
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch channels', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: channels || [] });

  } catch (error) {
    console.error('Channels API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
