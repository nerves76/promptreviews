/**
 * Survey Responses API - List responses (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    const { data: responses, error, count } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact' })
      .eq('survey_id', id)
      .eq('account_id', accountId)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('[SURVEYS] Responses list error:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    return NextResponse.json({
      responses: responses || [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[SURVEYS] Responses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
