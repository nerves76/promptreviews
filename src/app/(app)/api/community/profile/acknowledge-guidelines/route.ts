/**
 * Community Guidelines Acknowledgment API
 *
 * POST /api/community/profile/acknowledge-guidelines - Mark guidelines as acknowledged
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../utils/auth';
import { createServiceClient } from '../../utils/supabase';

/**
 * POST /api/community/profile/acknowledge-guidelines
 * Records that the user has acknowledged community guidelines
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Update profile with acknowledgment timestamp
    const supabase = createServiceClient();
    const { data: profile, error } = await supabase
      .from('community_profiles')
      .update({
        guidelines_accepted_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error acknowledging guidelines:', error);
      return NextResponse.json(
        { error: 'Failed to acknowledge guidelines', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile });

  } catch (error) {
    console.error('Guidelines acknowledgment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
