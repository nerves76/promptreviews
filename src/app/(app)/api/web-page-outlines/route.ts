/**
 * GET /api/web-page-outlines
 * List outlines for the current account (paginated, newest first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data, error, count } = await supabase
      .from('web_page_outlines')
      .select('id, keyword_phrase, tone, business_name, page_title, credit_cost, created_at', {
        count: 'exact',
      })
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[web-page-outlines] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch outlines' }, { status: 500 });
    }

    return NextResponse.json({
      outlines: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('[web-page-outlines] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
