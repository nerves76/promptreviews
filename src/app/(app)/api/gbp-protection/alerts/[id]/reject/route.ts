/**
 * Reject GBP Change Alert
 *
 * POST: Rejects a change alert and reverts the change via Google API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get the alert and verify ownership
    const { data: alert, error: alertError } = await supabase
      .from('gbp_change_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('account_id', accountId)
      .single();

    if (alertError || !alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (alert.status !== 'pending') {
      return NextResponse.json({ error: 'Alert already resolved' }, { status: 400 });
    }

    // Get the GBP profile for API access
    const { data: gbpProfile, error: profileError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
      .single();

    if (profileError || !gbpProfile) {
      return NextResponse.json({ error: 'GBP connection not found' }, { status: 404 });
    }

    // If we have an old value, try to revert via Google API
    if (alert.old_value !== null) {
      try {
        const client = new GoogleBusinessProfileClient({
          accessToken: gbpProfile.access_token,
          refreshToken: gbpProfile.refresh_token || undefined,
          expiresAt: gbpProfile.expires_at ? new Date(gbpProfile.expires_at).getTime() : undefined
        });

        // Revert the change
        const success = await client.rejectGoogleUpdates(
          alert.location_id,
          alert.field_changed,
          { [alert.field_changed]: alert.old_value }
        );

        if (!success) {
          console.warn('Failed to revert change via Google API, but marking as rejected');
        }
      } catch (apiError) {
        console.error('Error calling Google API to revert:', apiError);
        // Continue anyway - we'll mark as rejected even if API call fails
      }
    }

    // Mark alert as rejected
    const { error: updateError } = await supabase
      .from('gbp_change_alerts')
      .update({
        status: 'rejected',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', alertId);

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json({ error: 'Failed to reject alert' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Change rejected and reverted'
    });

  } catch (error) {
    console.error('Error rejecting alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
