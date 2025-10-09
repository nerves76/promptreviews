/**
 * Google Business Profile Overview API Route
 *
 * Aggregates data from multiple Google Business Profile APIs to provide
 * comprehensive overview metrics for the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { buildOverviewData } from '@/lib/googleBusiness/overviewAggregator';
import { generateMockOverviewData } from '@/utils/googleBusinessProfile/overviewDataHelpers';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const useMockData = searchParams.get('mock') === 'true';

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'Location ID is required' }, { status: 400 });
    }

    if (useMockData) {
      const mockData = generateMockOverviewData();
      return NextResponse.json({ success: true, data: mockData, isMockData: true });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ GMB Overview API: Authentication failed:', authError);
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokens || !tokens.access_token) {
      console.error('❌ GMB Overview API: No Google Business Profile tokens found:', tokenError);
      return NextResponse.json({ success: false, error: 'Google Business Profile not connected' }, { status: 404 });
    }

    try {
      const overviewData = await buildOverviewData({
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
        },
        locationId,
      });

      return NextResponse.json({
        success: true,
        data: overviewData,
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (fetchError: any) {
      console.error('❌ GMB Overview API: Error fetching overview data:', fetchError);

      if (fetchError.message?.includes('quota') || fetchError.message?.includes('rate limit')) {
        const mockData = generateMockOverviewData();
        return NextResponse.json({
          success: true,
          data: mockData,
          isMockData: true,
          warning: 'Using demo data due to Google API rate limits',
          fetchedAt: new Date().toISOString(),
        });
      }

      if (fetchError.message?.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Location not found',
          message: fetchError.message,
        }, { status: 404 });
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error('❌ GMB Overview API: Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch overview data', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
