/**
 * Cron job for Google review verification
 *
 * Fetches reviews directly from Google API for accounts with connected GBP.
 * Does NOT require reviews to be imported first.
 *
 * Runs daily via Vercel Cron
 */

export const maxDuration = 55; // Leave buffer before Vercel timeout
export const dynamic = 'force-dynamic';

const MAX_ACCOUNTS_PER_RUN = 1; // Process one account at a time - Google API is slow
const MAX_SUBMISSIONS_PER_ACCOUNT = 5;
const MAX_LOCATIONS_PER_ACCOUNT = 3;

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { findBestMatch } from '@/utils/reviewVerification';
import { sendNotificationToAccount } from '@/utils/notifications';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('verify-google-reviews', async () => {

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
      .limit(50);

    if (fetchError) {
      Sentry.captureException(fetchError);
      throw new Error('Database error fetching pending submissions');
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return {
        success: true,
        summary: { verified: 0, message: 'No pending submissions' },
      };
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
    let accountsWithGbp = 0;
    let accountsWithoutGbp = 0;
    let accountsProcessed = 0;
    let accountsSkipped = 0;
    const errors: string[] = [];

    // Process each account (limited to avoid timeout)
    for (const [accountId, submissions] of byAccount.entries()) {
      // Limit accounts per run to avoid timeout
      if (accountsProcessed >= MAX_ACCOUNTS_PER_RUN) {
        accountsSkipped++;
        continue;
      }
      // Check if account has connected GBP
      const { data: gbpProfile } = await supabase
        .from('google_business_profiles')
        .select('access_token, refresh_token, expires_at')
        .eq('account_id', accountId)
        .maybeSingle();

      if (!gbpProfile) {
        // No GBP connected - increment attempts
        accountsWithoutGbp++;
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

      accountsWithGbp++;
      accountsProcessed++;

      // Get selected locations for this account
      const { data: locations } = await supabase
        .from('google_business_locations')
        .select('location_id, location_name')
        .eq('account_id', accountId);

      if (!locations || locations.length === 0) {
        // No locations selected - increment attempts
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

      // Create GBP client
      let client: GoogleBusinessProfileClient;
      try {
        client = new GoogleBusinessProfileClient({
          accessToken: gbpProfile.access_token,
          refreshToken: gbpProfile.refresh_token ?? '',
          expiresAt: gbpProfile.expires_at ? new Date(gbpProfile.expires_at).getTime() : undefined,
        });
      } catch (clientError) {
        console.error(`Failed to create GBP client for account ${accountId}:`, clientError);
        errors.push(`Account ${accountId}: Failed to create GBP client`);
        continue;
      }

      // Fetch reviews from locations (limited to avoid timeout)
      const allGoogleReviews: any[] = [];
      const locationsToCheck = locations.slice(0, MAX_LOCATIONS_PER_ACCOUNT);
      for (const location of locationsToCheck) {
        try {
          const reviews = await client.getReviews(location.location_id);
          if (reviews && reviews.length > 0) {
            allGoogleReviews.push(...reviews);
          }
        } catch (reviewError) {
          console.error(`Failed to fetch reviews for location ${location.location_id}:`, reviewError);
          // Continue with other locations
        }
      }

      if (allGoogleReviews.length === 0) {
        // No reviews found in Google - increment attempts
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

      // Find google_review_ids already claimed by verified submissions for this account
      const { data: alreadyVerified } = await supabase
        .from('review_submissions')
        .select('google_review_id')
        .eq('account_id', accountId)
        .eq('auto_verification_status', 'verified')
        .not('google_review_id', 'is', null);

      const claimedGoogleReviewIds = new Set(
        (alreadyVerified || []).map(r => r.google_review_id).filter(Boolean)
      );

      // Match submissions against Google reviews (limited per account)
      const submissionsToProcess = submissions.slice(0, MAX_SUBMISSIONS_PER_ACCOUNT);
      for (const submission of submissionsToProcess) {
        checked++;
        const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();

        if (!submission.review_text_copy) continue;

        const match = findBestMatch(
          {
            reviewerName: reviewerName || 'Anonymous',
            reviewText: submission.review_text_copy,
            submittedDate: new Date(submission.submitted_at),
          },
          allGoogleReviews
        );

        if (match?.isMatch && !claimedGoogleReviewIds.has(match.googleReviewId)) {
          // Only update if still pending (prevents duplicate notifications on concurrent runs)
          const { data: updated } = await supabase
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
            .eq('id', submission.id)
            .eq('auto_verification_status', 'pending')
            .select('id');

          if (updated && updated.length > 0) {
            verified++;
            claimedGoogleReviewIds.add(match.googleReviewId);

            // Send notification to all account users
            try {
              await sendNotificationToAccount(accountId, 'review_auto_verified', {
                reviewerName: reviewerName || 'A customer',
                reviewContent: submission.review_text_copy || '',
                starRating: match.starRating || 5,
                submissionId: submission.id,
              });
            } catch (notifError) {
              console.error('Failed to send auto-verified notification:', notifError);
              // Don't fail verification if notification fails
            }
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

    return {
      success: true,
      summary: {
        verified,
        checked,
        accounts: byAccount.size,
        accountsProcessed,
        accountsSkipped,
        accountsWithGbp,
        accountsWithoutGbp,
        errors: errors.length > 0 ? errors : undefined,
        version: 'v8-live-api-throttled',
      },
    };
  });
}
