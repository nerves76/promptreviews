/**
 * GET /api/review-import/gbp-status
 *
 * Returns GBP connection status and saved locations for the current account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check GBP connection
    const { data: gbpProfile } = await supabase
      .from('google_business_profiles')
      .select('id, google_email')
      .eq('account_id', accountId)
      .maybeSingle();

    if (!gbpProfile) {
      return NextResponse.json({ connected: false, locations: [] });
    }

    // Get saved locations
    const { data: locations } = await supabase
      .from('google_business_locations')
      .select('location_id, location_name, address')
      .eq('account_id', accountId);

    return NextResponse.json({
      connected: true,
      googleEmail: gbpProfile.google_email,
      locations: (locations || []).map((loc) => ({
        locationId: loc.location_id,
        locationName: loc.location_name,
        address: loc.address,
      })),
    });
  } catch (error) {
    console.error('[review-import/gbp-status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check GBP status' },
      { status: 500 }
    );
  }
}
