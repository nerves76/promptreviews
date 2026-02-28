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

    const { data: reviews, error } = await supabase
      .from('review_submissions')
      .select('id, first_name, last_name, review_content, star_rating, platform, created_at')
      .eq('account_id', accountId)
      .gte('star_rating', 4)
      .not('review_content', 'is', null)
      .neq('review_content', '')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[reviews/list] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err) {
    console.error('[reviews/list] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
