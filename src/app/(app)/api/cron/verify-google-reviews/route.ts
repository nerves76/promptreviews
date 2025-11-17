/**
 * Cron job to automatically verify Google Business Profile reviews
 *
 * This job:
 * 1. Finds pending review submissions (status='pending', attempts < 5, age < 14 days)
 * 2. Groups by business and fetches latest Google reviews
 * 3. Uses fuzzy matching to find corresponding reviews
 * 4. Updates verification status based on match confidence
 *
 * Runs daily via Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { findBestMatch } from '@/utils/reviewVerification';
import * as Sentry from '@sentry/nextjs';

// Service role client for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting Google review verification job...');

    // Find pending review submissions that need verification
    const { data: pendingSubmissions, error: fetchError } = await supabase
      .from('review_submissions')
      .select(`
        id,
        first_name,
        last_name,
        review_text_copy,
        submitted_at,
        platform,
        platform_url,
        business_id,
        verification_attempts,
        businesses (
          id,
          account_id,
          google_location_id
        )
      `)
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .lt('verification_attempts', 5) // Max 5 attempts
      .gte('submitted_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
      .not('business_id', 'is', null)
      .not('review_text_copy', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching pending submissions:', fetchError);
      Sentry.captureException(fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      console.log('✅ No pending submissions to verify');
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No pending reviews to verify'
      });
    }

    console.log(`📊 Found ${pendingSubmissions.length} pending submissions to verify`);

    // Group submissions by business to batch API calls
    const submissionsByBusiness = new Map<string, typeof pendingSubmissions>();

    for (const submission of pendingSubmissions) {
      const businessId = (submission.businesses as any)?.id;
      if (!businessId) continue;

      if (!submissionsByBusiness.has(businessId)) {
        submissionsByBusiness.set(businessId, []);
      }
      submissionsByBusiness.get(businessId)!.push(submission);
    }

    console.log(`🏢 Grouped into ${submissionsByBusiness.size} businesses`);

    let totalVerified = 0;
    let totalNotFound = 0;
    let totalErrors = 0;

    // Process each business
    for (const [businessId, submissions] of submissionsByBusiness.entries()) {
      try {
        const business = (submissions[0].businesses as any);
        const accountId = business.account_id;
        const locationId = business.google_location_id;

        if (!locationId) {
          console.log(`⚠️ Business ${businessId} has no Google location ID, skipping`);
          continue;
        }

        console.log(`🔄 Processing business ${businessId} with ${submissions.length} submissions`);

        // Fetch Google OAuth tokens for this account
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('google_access_token, google_refresh_token, google_token_expires_at')
          .eq('id', accountId)
          .single();

        if (accountError || !accountData?.google_access_token) {
          console.log(`⚠️ No Google OAuth tokens for account ${accountId}, skipping`);
          // Mark submissions as failed
          for (const submission of submissions) {
            await updateVerificationStatus(submission.id, 'failed', null, 0);
          }
          continue;
        }

        // Initialize Google Business Profile client
        const gbpClient = new GoogleBusinessProfileClient({
          accessToken: accountData.google_access_token,
          refreshToken: accountData.google_refresh_token,
          expiresAt: accountData.google_token_expires_at
            ? new Date(accountData.google_token_expires_at).getTime()
            : undefined
        });

        // Fetch reviews from Google
        let googleReviews;
        try {
          googleReviews = await gbpClient.getReviews(locationId);
          console.log(`📥 Fetched ${googleReviews.length} Google reviews for location ${locationId}`);
        } catch (reviewError: any) {
          console.error(`❌ Error fetching Google reviews for location ${locationId}:`, reviewError);
          Sentry.captureException(reviewError, {
            tags: { endpoint: 'verify-google-reviews', business_id: businessId }
          });
          // Mark submissions as failed
          for (const submission of submissions) {
            await updateVerificationStatus(submission.id, 'failed', null, 0);
          }
          totalErrors += submissions.length;
          continue;
        }

        // Match each submission against Google reviews
        for (const submission of submissions) {
          try {
            const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();

            if (!reviewerName || !submission.review_text_copy) {
              console.log(`⚠️ Submission ${submission.id} missing name or text, skipping`);
              await updateVerificationStatus(submission.id, 'failed', null, 0);
              totalErrors++;
              continue;
            }

            // Find best match
            const matchResult = findBestMatch(
              {
                reviewerName,
                reviewText: submission.review_text_copy,
                submittedDate: new Date(submission.submitted_at),
              },
              googleReviews
            );

            if (matchResult && matchResult.isMatch) {
              console.log(`✅ Found match for submission ${submission.id}: ${matchResult.confidence} confidence (score: ${matchResult.score})`);

              await updateVerificationStatus(
                submission.id,
                'verified',
                matchResult.googleReviewId,
                matchResult.score
              );

              totalVerified++;
            } else {
              console.log(`❌ No match found for submission ${submission.id}`);

              // If we've tried 5 times and still no match, mark as not_found
              if (submission.verification_attempts >= 4) {
                await updateVerificationStatus(submission.id, 'not_found', null, 0);
                totalNotFound++;
              } else {
                // Increment attempt count, keep as pending
                await incrementVerificationAttempt(submission.id);
              }
            }
          } catch (matchError: any) {
            console.error(`❌ Error matching submission ${submission.id}:`, matchError);
            Sentry.captureException(matchError);
            await updateVerificationStatus(submission.id, 'failed', null, 0);
            totalErrors++;
          }
        }
      } catch (businessError: any) {
        console.error(`❌ Error processing business ${businessId}:`, businessError);
        Sentry.captureException(businessError);
        totalErrors += submissions.length;
      }
    }

    console.log(`✅ Verification job complete: ${totalVerified} verified, ${totalNotFound} not found, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      verified: totalVerified,
      notFound: totalNotFound,
      errors: totalErrors,
      totalProcessed: totalVerified + totalNotFound + totalErrors
    });

  } catch (error: any) {
    console.error('❌ Fatal error in verification job:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Update verification status for a submission
 */
async function updateVerificationStatus(
  submissionId: string,
  status: 'verified' | 'not_found' | 'failed',
  googleReviewId: string | undefined | null,
  matchScore: number
) {
  const updates: any = {
    auto_verification_status: status,
    last_verification_attempt_at: new Date().toISOString(),
  };

  if (status === 'verified') {
    updates.auto_verified_at = new Date().toISOString();
    updates.verified = true; // Also set manual verified field
    updates.verified_at = new Date().toISOString();
    updates.google_review_id = googleReviewId;
    updates.verification_match_score = matchScore;
  }

  const { error } = await supabase
    .from('review_submissions')
    .update(updates)
    .eq('id', submissionId);

  if (error) {
    console.error(`❌ Error updating submission ${submissionId}:`, error);
    Sentry.captureException(error);
  }
}

/**
 * Increment verification attempt count
 */
async function incrementVerificationAttempt(submissionId: string) {
  const { error } = await supabase
    .from('review_submissions')
    .update({
      verification_attempts: supabase.rpc('increment'),
      last_verification_attempt_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error(`❌ Error incrementing attempt for ${submissionId}:`, error);
  }
}
