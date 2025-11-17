import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Count all Google reviews
  const { count: totalGoogleCount } = await supabase
    .from('review_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'Google Business Profile');

  // Get breakdown
  const { data: allReviews } = await supabase
    .from('review_submissions')
    .select('id, auto_verification_status, verified, business_id, review_text_copy, submitted_at, verification_attempts')
    .eq('platform', 'Google Business Profile')
    .order('submitted_at', { ascending: false })
    .limit(100);

  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

  const stats = {
    total: allReviews?.length || 0,
    autoVerificationStatus: {
      pending: allReviews?.filter(r => r.auto_verification_status === 'pending').length || 0,
      verified: allReviews?.filter(r => r.auto_verification_status === 'verified').length || 0,
      not_found: allReviews?.filter(r => r.auto_verification_status === 'not_found').length || 0,
      failed: allReviews?.filter(r => r.auto_verification_status === 'failed').length || 0,
      null: allReviews?.filter(r => r.auto_verification_status === null).length || 0,
    },
    nullBusinessId: allReviews?.filter(r => !r.business_id).length || 0,
    nullReviewTextCopy: allReviews?.filter(r => !r.review_text_copy).length || 0,
    alreadyVerifiedManually: allReviews?.filter(r => r.verified === true).length || 0,
    withinLast90Days: allReviews?.filter(r => new Date(r.submitted_at).getTime() >= ninetyDaysAgo).length || 0,
    maxVerificationAttempts: allReviews?.filter(r => r.verification_attempts >= 5).length || 0,
  };

  // Sample reviews that should be eligible
  const eligible = allReviews?.filter(r =>
    r.auto_verification_status === 'pending' &&
    r.business_id &&
    r.review_text_copy &&
    r.verification_attempts < 5 &&
    new Date(r.submitted_at).getTime() >= ninetyDaysAgo
  ).slice(0, 5);

  return NextResponse.json({
    totalCount: totalGoogleCount,
    stats,
    sampleEligibleReviews: eligible,
    sampleAllReviews: allReviews?.slice(0, 5),
  });
}
