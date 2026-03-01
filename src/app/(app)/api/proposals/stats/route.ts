/**
 * Proposals Stats API - Returns counts by status for non-template contracts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
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

    // Fetch counts per status using head: true (no row data)
    const statuses = ['sent', 'viewed', 'accepted', 'declined'] as const;
    const counts: Record<string, number> = {};

    await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', accountId)
          .eq('is_template', false)
          .eq('status', status);
        counts[status] = count ?? 0;
      })
    );

    const sent = counts.sent + counts.viewed + counts.accepted + counts.declined;
    const won = counts.accepted;
    const lost = counts.declined;
    const winRate = sent > 0 ? Math.round((won / sent) * 100) : null;

    return NextResponse.json({ sent, won, lost, winRate });
  } catch (error) {
    console.error('[PROPOSALS] Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
