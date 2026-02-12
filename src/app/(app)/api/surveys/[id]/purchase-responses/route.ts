/**
 * Purchase Survey Responses API
 *
 * Deducts credits and adds response capacity to a survey.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { withCredits } from '@/lib/credits/withCredits';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify survey ownership
    const { data: survey } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
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

    const idempotencyKey = `survey-pack-${accountId}-${id}-${pack_id}-${Date.now()}`;

    const result = await withCredits({
      supabase,
      accountId,
      userId: user.id,
      featureType: 'survey_responses',
      creditCost: pack.credit_cost,
      idempotencyKey,
      description: `Survey response pack: ${pack.name} (${pack.response_count} responses)`,
      featureMetadata: { survey_id: id, pack_id, pack_name: pack.name },
      operation: async () => {
        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
          .from('survey_response_purchases')
          .insert({
            survey_id: id,
            account_id: accountId,
            pack_id,
            responses_purchased: pack.response_count,
            responses_used: 0,
            idempotency_key: idempotencyKey,
          })
          .select()
          .single();

        if (purchaseError) {
          throw new Error(`Failed to create purchase: ${purchaseError.message}`);
        }

        return purchase;
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
      purchase: result.data,
      creditsDebited: result.creditsDebited,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    console.error('[SURVEYS] Purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
