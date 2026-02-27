/**
 * SOW Prefix API - Get and set the account's SOW prefix
 *
 * GET: Returns { sow_prefix: string | null, locked: boolean }
 * POST: Sets the prefix (only if not already locked)
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

    const { data: account } = await supabase
      .from('accounts')
      .select('sow_prefix')
      .eq('id', accountId)
      .single();

    // Check if any non-template proposals exist (prefix is locked if so)
    const { count } = await supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_template', false)
      .not('sow_number', 'is', null);

    return NextResponse.json({
      sow_prefix: account?.sow_prefix || null,
      locked: (count ?? 0) > 0,
    });
  } catch (error) {
    console.error('[SOW_PREFIX] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const body = await request.json();
    const prefix = body.sow_prefix?.trim();

    // Validate: numbers only, 1-10 digits
    if (!prefix || !/^\d{1,10}$/.test(prefix)) {
      return NextResponse.json(
        { error: 'SOW prefix must be 1-10 digits (numbers only)' },
        { status: 400 }
      );
    }

    // Check if already locked (any non-template proposals with sow_number exist)
    const { count } = await supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_template', false)
      .not('sow_number', 'is', null);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'SOW prefix cannot be changed after contracts have been created' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ sow_prefix: prefix })
      .eq('id', accountId);

    if (updateError) {
      console.error('[SOW_PREFIX] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update SOW prefix' }, { status: 500 });
    }

    return NextResponse.json({ sow_prefix: prefix, locked: false });
  } catch (error) {
    console.error('[SOW_PREFIX] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
