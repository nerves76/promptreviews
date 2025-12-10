/**
 * Cron job for Google review verification (LIGHTWEIGHT FALLBACK)
 *
 * PRIMARY verification happens at import time in reviewSyncService.ts
 * This cron is a fallback that matches against already-imported reviews.
 * No Google API calls - just database queries.
 *
 * Runs daily via Vercel Cron
 */

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findBestMatch } from '@/utils/reviewVerification';
import { sendNotificationToAccountOwner } from '@/utils/notifications';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting lightweight verification (database only)...');

    // Find pending Prompt Page submissions
    const { data: pendingSubmissions, error: fetchError } = await supabase
      .from('review_submissions')
      .select('id, account_id, first_name, last_name, review_text_copy, submitted_at, verification_attempts')
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .eq('imported_from_google', false)
      .not('review_text_copy', 'is', null)
      .lt('verification_attempts', 5)
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      Sentry.captureException(fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No pending submissions',
        duration: Date.now() - startTime
      });
    }

    // Group by account
    const byAccount = new Map<string, typeof pendingSubmissions>();
    for (const sub of pendingSubmissions) {
      if (!sub.account_id) continue;
      if (!byAccount.has(sub.account_id)) {
        byAccount.set(sub.account_id, []);
      }
      byAccount.get(sub.account_id)!.push(sub);
    }

    let verified = 0;
    let checked = 0;

    // Process each account
    for (const [accountId, submissions] of byAccount.entries()) {
      // Get imported Google reviews for this account (from database, not API)
      const { data: importedReviews } = await supabase
        .from('review_submissions')
        .select('google_review_id, first_name, last_name, review_content, submitted_at, star_rating')
        .eq('account_id', accountId)
        .eq('imported_from_google', true)
        .not('google_review_id', 'is', null);

      if (!importedReviews || importedReviews.length === 0) {
        // Increment attempts for submissions with no imported reviews to match against
        for (const sub of submissions) {
          await supabase
            .from('review_submissions')
            .update({
              verification_attempts: (sub.verification_attempts ?? 0) + 1,
              last_verification_attempt_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
        }
        continue;
      }

      // Convert to format expected by findBestMatch
      const googleReviews = importedReviews.map(r => ({
        reviewId: r.google_review_id,
        reviewer: { displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim() },
        comment: r.review_content,
        createTime: r.submitted_at,
        starRating: r.star_rating ? ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][r.star_rating - 1] : undefined
      }));

      for (const submission of submissions) {
        checked++;
        const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();

        if (!reviewerName || !submission.review_text_copy) continue;

        const match = findBestMatch(
          {
            reviewerName,
            reviewText: submission.review_text_copy,
            submittedDate: new Date(submission.submitted_at),
          },
          googleReviews
        );

        if (match?.isMatch) {
          await supabase
            .from('review_submissions')
            .update({
              auto_verification_status: 'verified',
              auto_verified_at: new Date().toISOString(),
              verified: true,
              verified_at: new Date().toISOString(),
              google_review_id: match.googleReviewId,
              verification_match_score: match.score,
              star_rating: match.starRating,
              last_verification_attempt_at: new Date().toISOString(),
            })
            .eq('id', submission.id);
          verified++;

          // Send notification to account owner
          try {
            const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();
            await sendNotificationToAccountOwner(accountId, 'review_auto_verified', {
              reviewerName: reviewerName || 'A customer',
              reviewContent: submission.review_text_copy || '',
              starRating: match.starRating || 5,
              submissionId: submission.id,
            });
          } catch (notifError) {
            console.error('Failed to send auto-verified notification:', notifError);
            // Don't fail verification if notification fails
          }
        } else {
          // Increment attempt counter
          const attempts = (submission.verification_attempts ?? 0) + 1;
          await supabase
            .from('review_submissions')
            .update({
              verification_attempts: attempts,
              last_verification_attempt_at: new Date().toISOString(),
              ...(attempts >= 5 ? { auto_verification_status: 'not_found' } : {}),
            })
            .eq('id', submission.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      checked,
      accounts: byAccount.size,
      duration: Date.now() - startTime,
      version: 'v6-database-only'
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
