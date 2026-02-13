/**
 * Account-Level Purchase Survey Responses API
 *
 * Deducts credits and adds response capacity to the account pool.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { withCredits } from '@/lib/credits/withCredits';

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

    const { pack_id } = await request.json();

    if (!pack_id) {
      return NextResponse.json({ error: 'pack_id is required' }, { status: 400 });
    }

    // Fetch pack
    const { data: pack, error: packError } = await supabase
      .from('survey_response_packs')
      .select('*')
      .eq('id', pack_id)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    const idempotencyKey = `account-survey-pack-${accountId}-${pack_id}-${Date.now()}`;

    const result = await withCredits({
      supabase,
      accountId,
      userId: user.id,
      featureType: 'survey_responses',
      creditCost: pack.credit_cost,
      idempotencyKey,
      description: `Account survey response pack: ${pack.name} (${pack.response_count} responses)`,
      featureMetadata: { pack_id, pack_name: pack.name },
      operation: async () => {
        // Atomically increment account pool
        const { data: newRemaining, error: rpcError } = await supabase
          .rpc('increment_account_survey_responses', {
            account_uuid: accountId,
            amount: pack.response_count,
          });

        if (rpcError) {
          throw new Error(`Failed to update account pool: ${rpcError.message}`);
        }

        return { new_remaining: newRemaining };
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.errorCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      creditsDebited: result.creditsDebited,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    console.error('[SURVEYS] Account purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
