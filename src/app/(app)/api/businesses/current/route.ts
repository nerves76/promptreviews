/**
 * Get Business for Current Account API Route
 *
 * GET - Returns the business for the currently selected account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Get the business for this account
    const { data: business, error: businessError } = await serviceSupabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('[BUSINESSES/CURRENT] Error fetching business:', businessError);
      return NextResponse.json(
        { error: 'Failed to fetch business' },
        { status: 500 }
      );
    }

    return NextResponse.json({ business: business || null });
  } catch (error) {
    console.error('[BUSINESSES/CURRENT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
