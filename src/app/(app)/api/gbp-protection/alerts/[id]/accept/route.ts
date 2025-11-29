/**
 * Accept GBP Change Alert
 *
 * POST: Accepts a change alert (acknowledges the new value)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

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

    // Update the snapshot with the new (accepted) value
    const { error: snapshotError } = await supabase
      .from('gbp_location_snapshots')
      .update({
        [alert.field_changed]: alert.new_value,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId)
      .eq('location_id', alert.location_id);

    if (snapshotError) {
      console.error('Error updating snapshot:', snapshotError);
    }

    // Mark alert as accepted
    const { error: updateError } = await supabase
      .from('gbp_change_alerts')
      .update({
        status: 'accepted',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', alertId);

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return NextResponse.json({ error: 'Failed to accept alert' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Change accepted'
    });

  } catch (error) {
    console.error('Error accepting alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
