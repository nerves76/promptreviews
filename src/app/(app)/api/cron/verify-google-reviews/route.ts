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

    console.log('🔍 Starting Google review verification job (v3 - with 79 pending reviews)...');

    // Debug: Count all Google reviews
    const { count: totalGoogleCount } = await supabase
      .from('review_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'Google Business Profile');

    console.log(`📊 Total Google Business Profile reviews: ${totalGoogleCount}`);

    // Debug: Count by verification status
    const { data: statusBreakdown } = await supabase
      .from('review_submissions')
      .select('auto_verification_status, verified, business_id')
      .eq('platform', 'Google Business Profile');

    // DEBUG: Show unique status values
    const uniqueStatuses = [...new Set(statusBreakdown?.map(r => r.auto_verification_status))];
    console.log(`🔍 Unique auto_verification_status values:`, uniqueStatuses);
    console.log(`🔍 Sample status values (first 5):`, statusBreakdown?.slice(0, 5).map(r => ({
      id: r.auto_verification_status,
      type: typeof r.auto_verification_status,
      stringified: JSON.stringify(r.auto_verification_status)
    })));

    const stats = {
      total: statusBreakdown?.length || 0,
      pending: statusBreakdown?.filter(r => r.auto_verification_status === 'pending').length || 0,
      verified: statusBreakdown?.filter(r => r.auto_verification_status === 'verified').length || 0,
      nullBusinessId: statusBreakdown?.filter(r => !r.business_id).length || 0,
      alreadyVerified: statusBreakdown?.filter(r => r.verified === true).length || 0,
      uniqueStatuses
    };

    console.log(`📊 Breakdown: ${JSON.stringify(stats)}`);

    // DEBUG: Sample some pending reviews to see their data
    const { data: samplePending } = await supabase
      .from('review_submissions')
      .select('id, platform, auto_verification_status, business_id, review_text_copy, first_name, last_name')
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .limit(3);

    console.log(`🔍 Sample pending reviews:`, JSON.stringify(samplePending, null, 2));

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
        verified
      `)
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .limit(50); // pull extra rows, filter in code

    const eligibleSubmissions = pendingSubmissions?.filter(submission => {
      const hasBusiness = !!submission.business_id;
      const hasText = typeof submission.review_text_copy === 'string'
        ? submission.review_text_copy.trim().length > 0
        : !!submission.review_text_copy;
      const attempts = submission.verification_attempts ?? 0;
      return hasBusiness && hasText && attempts < 5;
    }) || [];

    console.log(`📋 Query returned ${pendingSubmissions?.length || 0} rows, ${eligibleSubmissions.length} eligible after filtering`);
    console.log(`📋 Sample eligible IDs: ${eligibleSubmissions.slice(0, 3).map(s => s.id).join(', ')}`);

    if (fetchError) {
      console.error('❌ Error fetching pending submissions:', fetchError);
      Sentry.captureException(fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!eligibleSubmissions || eligibleSubmissions.length === 0) {
      console.log('✅ No eligible pending submissions to verify');
      console.log('Fetch error:', fetchError);
      console.log('Pending submissions data:', pendingSubmissions);
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No pending reviews to verify',
        debug: {
          fetchError: fetchError?.message || null,
          dataLength: pendingSubmissions?.length || 0,
          eligibleLength: eligibleSubmissions.length,
          samplePendingCount: samplePending?.length || 0,
          samplePendingIds: samplePending?.map(r => r.id).slice(0, 3) || [],
          totalGoogleCount,
          stats
        }
      });
    }

    console.log(`📊 Found ${eligibleSubmissions.length} pending submissions to verify`);

    // Group submissions by account (business_id is actually account_id)
    const submissionsByAccount = new Map<string, typeof eligibleSubmissions>();

    for (const submission of eligibleSubmissions) {
      const accountId = submission.business_id;
      if (!accountId) continue;

      if (!submissionsByAccount.has(accountId)) {
        submissionsByAccount.set(accountId, []);
      }
      submissionsByAccount.get(accountId)!.push(submission);
    }

    console.log(`🏢 Grouped into ${submissionsByAccount.size} accounts`);

    let totalVerified = 0;
    let totalNotFound = 0;
    let totalErrors = 0;
    let skippedNoLocations = 0;
    let skippedNoTokens = 0;

    // Process each account
    for (const [accountId, submissions] of submissionsByAccount.entries()) {
      try {
        console.log(`🔄 Processing account ${accountId} with ${submissions.length} submissions`);

        // Fetch Google locations for this account
        const { data: googleLocations, error: locationsError } = await supabase
          .from('google_business_locations')
          .select('id, location_id, location_name')
          .eq('user_id', accountId); // google_business_locations uses user_id to link

        if (locationsError || !googleLocations || googleLocations.length === 0) {
          console.log(`⚠️ Account ${accountId} has no Google locations, leaving submissions pending`);
          for (const submission of submissions) {
            await incrementVerificationAttempt(submission.id);
          }
          skippedNoLocations += submissions.length;
          continue;
        }

        console.log(`📍 Found ${googleLocations.length} Google location(s) for account ${accountId}`);

        // Fetch Google OAuth tokens for this account
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('google_access_token, google_refresh_token, google_token_expires_at')
          .eq('id', accountId)
          .single();

        if (accountError || !accountData?.google_access_token) {
          console.log(`⚠️ No Google OAuth tokens for account ${accountId}, leaving submissions pending`);
          for (const submission of submissions) {
            await incrementVerificationAttempt(submission.id);
          }
          skippedNoTokens += submissions.length;
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

        // Fetch reviews from all Google locations for this account
        let allGoogleReviews: any[] = [];
        for (const location of googleLocations) {
          try {
            const locationReviews = await gbpClient.getReviews(location.location_id);
            console.log(`📥 Fetched ${locationReviews.length} reviews for location ${location.location_name}`);
            allGoogleReviews = allGoogleReviews.concat(locationReviews);
          } catch (reviewError: any) {
            console.error(`❌ Error fetching reviews for location ${location.location_name}:`, reviewError);
            Sentry.captureException(reviewError, {
              tags: { endpoint: 'verify-google-reviews', account_id: accountId, location_id: location.location_id }
            });
            // Continue to next location instead of failing all submissions
          }
        }

        if (allGoogleReviews.length === 0) {
          console.log(`⚠️ No reviews fetched for account ${accountId}, marking submissions as failed`);
          for (const submission of submissions) {
            await updateVerificationStatus(submission.id, 'failed', null, 0);
          }
          totalErrors += submissions.length;
          continue;
        }

        console.log(`📊 Total ${allGoogleReviews.length} reviews across all locations for account ${accountId}`);

        // Match each submission against all Google reviews from all locations
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
              allGoogleReviews
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
      } catch (accountError: any) {
        console.error(`❌ Error processing account ${accountId}:`, accountError);
        Sentry.captureException(accountError, {
          tags: { endpoint: 'verify-google-reviews', account_id: accountId }
        });
        totalErrors += submissions.length;
      }
    }

    console.log(`✅ Verification job complete: ${totalVerified} verified, ${totalNotFound} not found, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      verified: totalVerified,
      notFound: totalNotFound,
      errors: totalErrors,
      skippedNoLocations,
      skippedNoTokens,
      totalProcessed: totalVerified + totalNotFound + totalErrors,
      timestamp: new Date().toISOString(),
      version: 'v4-2025-01-17'
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
  const { data, error: fetchError } = await supabase
    .from('review_submissions')
    .select('verification_attempts')
    .eq('id', submissionId)
    .single();

  if (fetchError) {
    console.error(`❌ Error fetching attempt count for ${submissionId}:`, fetchError);
    return;
  }

  const attempts = (data?.verification_attempts ?? 0) + 1;

  const { error } = await supabase
    .from('review_submissions')
    .update({
      verification_attempts: attempts,
      last_verification_attempt_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error(`❌ Error incrementing attempt for ${submissionId}:`, error);
  }
}
