import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_RANK_TRACKING_GROUP_NAME } from '@/app/(app)/api/rank-tracking-term-groups/route';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/rank-tracking-terms/bulk-move
 * Move multiple rank tracking terms to a different group.
 *
 * Body:
 * - termIds: string[] (optional) - Array of rank_tracking_term IDs to move
 * - termIdentifiers: Array<{keywordId: string, term: string}> (optional) - Alternative way to identify terms
 * - groupId: string | null (required) - Target group ID, or null to move to ungrouped
 *
 * Either termIds or termIdentifiers must be provided.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { termIds: providedTermIds, termIdentifiers, groupId } = body;

    // Resolve term IDs from either direct IDs or keyword+term pairs
    let termIds: string[] = [];

    if (Array.isArray(providedTermIds) && providedTermIds.length > 0) {
      termIds = providedTermIds;
    } else if (Array.isArray(termIdentifiers) && termIdentifiers.length > 0) {
      // Look up term IDs from (keywordId, term) pairs
      // Build a list of conditions for the query
      const orConditions = termIdentifiers.map((ident: { keywordId: string; term: string }) =>
        `and(keyword_id.eq.${ident.keywordId},term.eq.${ident.term})`
      ).join(',');

      const { data: resolvedTerms, error: resolveError } = await serviceSupabase
        .from('rank_tracking_terms')
        .select('id')
        .eq('account_id', accountId)
        .or(orConditions);

      if (resolveError) {
        console.error('❌ Failed to resolve term identifiers:', resolveError);
        return NextResponse.json(
          { error: 'Failed to resolve term identifiers' },
          { status: 500 }
        );
      }

      termIds = resolvedTerms?.map(t => t.id) || [];
    }

    if (termIds.length === 0) {
      return NextResponse.json(
        { error: 'Either termIds or termIdentifiers array is required' },
        { status: 400 }
      );
    }

    // If groupId is provided and not null, verify it belongs to this account
    if (groupId) {
      const { data: group, error: groupError } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .select('id')
        .eq('id', groupId)
        .eq('account_id', accountId)
        .maybeSingle();

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Target group not found' },
          { status: 404 }
        );
      }
    }

    // Verify all terms belong to this account
    const { data: terms, error: termsError } = await serviceSupabase
      .from('rank_tracking_terms')
      .select('id')
      .in('id', termIds)
      .eq('account_id', accountId);

    if (termsError) {
      console.error('❌ Failed to verify term ownership:', termsError);
      return NextResponse.json(
        { error: 'Failed to verify term ownership' },
        { status: 500 }
      );
    }

    if (!terms || terms.length !== termIds.length) {
      return NextResponse.json(
        { error: 'One or more terms not found or access denied' },
        { status: 404 }
      );
    }

    // Move all terms to the target group
    const { error: updateError } = await serviceSupabase
      .from('rank_tracking_terms')
      .update({ group_id: groupId })
      .in('id', termIds)
      .eq('account_id', accountId);

    if (updateError) {
      console.error('❌ Failed to move terms:', updateError);
      return NextResponse.json(
        { error: 'Failed to move terms' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movedCount: termIds.length,
      targetGroupId: groupId,
    });
  } catch (error: any) {
    console.error('❌ Rank tracking terms bulk move error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to ensure the General group exists for an account
 */
export async function ensureGeneralGroupExists(accountId: string): Promise<string | null> {
  const { data: generalGroup } = await serviceSupabase
    .from('rank_tracking_term_groups')
    .select('id')
    .eq('account_id', accountId)
    .eq('name', DEFAULT_RANK_TRACKING_GROUP_NAME)
    .maybeSingle();

  if (generalGroup) {
    return generalGroup.id;
  }

  // Create General group
  const { data: newGeneral } = await serviceSupabase
    .from('rank_tracking_term_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_RANK_TRACKING_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  return newGeneral?.id || null;
}
