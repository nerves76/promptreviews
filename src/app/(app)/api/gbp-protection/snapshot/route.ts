/**
 * GBP Protection Snapshot API
 *
 * POST: Creates/updates a snapshot for a location
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import crypto from 'crypto';

function createSnapshotHash(data: Record<string, any>): string {
  const sortedJson = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('md5').update(sortedJson).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check if user has eligible tier
    const { data: account } = await supabase
      .from('accounts')
      .select('plan')
      .eq('id', accountId)
      .single();

    if (!account || (account.plan !== 'builder' && account.plan !== 'maven')) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    const body = await request.json();
    const { location_id, location_name } = body;

    if (!location_id) {
      return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
    }

    // Get GBP profile for API access
    const { data: gbpProfile, error: profileError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
      .single();

    if (profileError || !gbpProfile) {
      return NextResponse.json({ error: 'GBP connection not found' }, { status: 404 });
    }

    // Get current location data from Google
    const client = new GoogleBusinessProfileClient({
      accessToken: gbpProfile.access_token,
      refreshToken: gbpProfile.refresh_token || undefined,
      expiresAt: gbpProfile.expires_at ? new Date(gbpProfile.expires_at).getTime() : undefined
    });

    const currentData = await client.getLocationSnapshot(location_id);
    if (!currentData) {
      return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
    }

    const hash = createSnapshotHash(currentData);

    // Upsert snapshot
    const { data: snapshot, error } = await supabase
      .from('gbp_location_snapshots')
      .upsert({
        account_id: accountId,
        location_id: location_id,
        location_name: location_name || null,
        title: currentData.title,
        address: currentData.address,
        phone: currentData.phone,
        website: currentData.website,
        hours: currentData.hours,
        description: currentData.description,
        categories: currentData.categories,
        snapshot_hash: hash,
        snapshot_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'account_id,location_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating snapshot:', error);
      return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot
    });

  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
