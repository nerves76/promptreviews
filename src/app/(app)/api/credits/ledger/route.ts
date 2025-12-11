/**
 * GET /api/credits/ledger
 *
 * Get credit transaction history for the authenticated account.
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - featureType: string (optional filter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getLedger } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const featureType = searchParams.get('featureType') || undefined;

    // Get ledger entries
    const { entries, total } = await getLedger(serviceSupabase, accountId, {
      limit,
      offset,
      featureType,
    });

    return NextResponse.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        creditType: entry.creditType,
        transactionType: entry.transactionType,
        featureType: entry.featureType,
        featureMetadata: entry.featureMetadata,
        description: entry.description,
        createdAt: entry.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
      hasMore: offset + entries.length < total,
    });
  } catch (error) {
    console.error('❌ [Credits] Ledger GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
