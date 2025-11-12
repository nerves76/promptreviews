/**
 * Temporary Debug Endpoint
 *
 * Helps diagnose why sentiment analyzer shows 0 reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 400 });
    }

    // Count all reviews
    const { count: allReviews } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Count reviews with content
    const { count: reviewsWithContent } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .not('review_content', 'is', null)
      .neq('review_content', '');

    // Count imported Google reviews
    const { count: importedReviews } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('imported_from_google', true);

    // Fetch sample reviews to inspect
    const { data: sampleReviews } = await supabase
      .from('review_submissions')
      .select('id, account_id, review_content, imported_from_google, created_at')
      .eq('account_id', accountId)
      .limit(5);

    return NextResponse.json({
      accountId,
      counts: {
        allReviews: allReviews || 0,
        reviewsWithContent: reviewsWithContent || 0,
        importedGoogleReviews: importedReviews || 0
      },
      sampleReviews: (sampleReviews || []).map(r => ({
        id: r.id,
        hasAccountId: !!r.account_id,
        hasContent: !!r.review_content,
        contentLength: r.review_content?.length || 0,
        isImported: r.imported_from_google,
        createdAt: r.created_at
      }))
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
