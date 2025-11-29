/**
 * Cron job to automatically verify Google Business Profile reviews
 *
 * OPTIMIZED VERSION:
 * - Processes only ONE account per run to fit within timeout
 * - Fetches Google reviews directly (skips full sync)
 * - Uses fuzzy matching to verify submissions
 *
 * Runs daily via Vercel Cron
 */

// Route segment config for Vercel - set max duration to 60 seconds
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting optimized Google review verification...');

    // Find ONE account with pending reviews to process
    // This ensures we stay within timeout limits
    const { data: pendingSubmissions, error: fetchError } = await supabase
      .from('review_submissions')
      .select(`
        id,
        account_id,
        first_name,
        last_name,
        review_text_copy,
        submitted_at,
        verification_attempts
      `)
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .not('review_text_copy', 'is', null)
      .lt('verification_attempts', 5)
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('❌ Error fetching pending submissions:', fetchError);
      Sentry.captureException(fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No pending reviews to verify',
        duration: Date.now() - startTime
      });
    }

    // Get the first account ID to process
    const firstAccountId = pendingSubmissions.find(s => s.account_id)?.account_id;
    if (!firstAccountId) {
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No reviews with account_id found',
        duration: Date.now() - startTime
      });
    }

    // Filter to just this account's submissions
    const accountSubmissions = pendingSubmissions.filter(s => s.account_id === firstAccountId);
    console.log(`📋 Processing ${accountSubmissions.length} reviews for account ${firstAccountId}`);

    // Get Google locations for this account
    const { data: googleLocations, error: locationsError } = await supabase
      .from('google_business_locations')
      .select('id, location_id, location_name')
      .eq('account_id', firstAccountId);

    if (locationsError || !googleLocations || googleLocations.length === 0) {
      console.log(`⚠️ Account ${firstAccountId} has no Google locations`);
      // Increment attempts for these submissions
      for (const submission of accountSubmissions) {
        await incrementVerificationAttempt(submission.id);
      }
      return NextResponse.json({
        success: true,
        verified: 0,
        skippedNoLocations: accountSubmissions.length,
        message: 'Account has no Google locations',
        duration: Date.now() - startTime
      });
    }

    // Get OAuth tokens
    const { data: profileTokens, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', firstAccountId)
      .maybeSingle();

    if (tokenError || !profileTokens?.access_token) {
      console.log(`⚠️ No Google OAuth tokens for account ${firstAccountId}`);
      for (const submission of accountSubmissions) {
        await incrementVerificationAttempt(submission.id);
      }
      return NextResponse.json({
        success: true,
        verified: 0,
        skippedNoTokens: accountSubmissions.length,
        message: 'Account has no Google OAuth tokens',
        duration: Date.now() - startTime
      });
    }

    // Initialize Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: profileTokens.access_token,
      refreshToken: profileTokens.refresh_token || undefined,
      expiresAt: profileTokens.expires_at ? new Date(profileTokens.expires_at).getTime() : undefined
    });

    // First try: Use already-imported Google reviews from our database
    // This is MUCH faster than fetching from Google API
    const { data: importedReviews, error: importedError } = await supabase
      .from('review_submissions')
      .select('id, first_name, last_name, review_content, google_review_id, submitted_at, star_rating')
      .eq('account_id', firstAccountId)
      .eq('imported_from_google', true)
      .not('google_review_id', 'is', null);

    let allGoogleReviews: any[] = [];

    if (importedReviews && importedReviews.length > 0) {
      // Convert imported reviews to match the Google API format for findBestMatch
      allGoogleReviews = importedReviews.map(r => ({
        reviewId: r.google_review_id,
        reviewer: {
          displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim()
        },
        comment: r.review_content,
        createTime: r.submitted_at,
        starRating: r.star_rating ? `${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][r.star_rating - 1]}` : undefined
      }));
      console.log(`📊 Using ${allGoogleReviews.length} imported Google reviews from database`);
    } else {
      // Fallback: Fetch from Google API (slower, may timeout)
      console.log(`⚠️ No imported reviews found, fetching from Google API...`);
      for (const location of googleLocations) {
        try {
          console.log(`📥 Fetching reviews for location: ${location.location_name}`);
          const reviews = await gbpClient.getReviews(location.location_id);
          console.log(`   Got ${reviews.length} reviews`);
          allGoogleReviews = allGoogleReviews.concat(reviews);
        } catch (reviewError: any) {
          console.error(`❌ Error fetching reviews for ${location.location_name}:`, reviewError.message);
        }
      }
    }

    if (allGoogleReviews.length === 0) {
      console.log(`⚠️ No Google reviews found for account ${firstAccountId}`);
      for (const submission of accountSubmissions) {
        await incrementVerificationAttempt(submission.id);
      }
      return NextResponse.json({
        success: true,
        verified: 0,
        message: 'No Google reviews found to match against',
        duration: Date.now() - startTime
      });
    }

    console.log(`📊 Total ${allGoogleReviews.length} Google reviews to match against`);

    // Match submissions against Google reviews
    let verified = 0;
    let notFound = 0;
    let errors = 0;

    for (const submission of accountSubmissions) {
      try {
        const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();

        if (!reviewerName || !submission.review_text_copy) {
          await updateVerificationStatus(submission.id, 'failed', null, 0);
          errors++;
          continue;
        }

        const matchResult = findBestMatch(
          {
            reviewerName,
            reviewText: submission.review_text_copy,
            submittedDate: new Date(submission.submitted_at),
          },
          allGoogleReviews
        );

        if (matchResult && matchResult.isMatch) {
          console.log(`✅ Match found for ${reviewerName}: score ${matchResult.score}`);
          await updateVerificationStatus(
            submission.id,
            'verified',
            matchResult.googleReviewId,
            matchResult.score,
            matchResult.starRating
          );
          verified++;
        } else {
          // Increment attempts or mark as not_found
          if ((submission.verification_attempts ?? 0) >= 4) {
            await updateVerificationStatus(submission.id, 'not_found', null, 0);
            notFound++;
          } else {
            await incrementVerificationAttempt(submission.id);
          }
        }
      } catch (matchError: any) {
        console.error(`❌ Error matching submission:`, matchError.message);
        Sentry.captureException(matchError);
        await updateVerificationStatus(submission.id, 'failed', null, 0);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Done in ${duration}ms: ${verified} verified, ${notFound} not found, ${errors} errors`);

    return NextResponse.json({
      success: true,
      verified,
      notFound,
      errors,
      accountProcessed: firstAccountId,
      reviewsChecked: accountSubmissions.length,
      googleReviewsCount: allGoogleReviews.length,
      duration,
      version: 'v5-optimized'
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    Sentry.captureException(error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}

async function updateVerificationStatus(
  submissionId: string,
  status: 'verified' | 'not_found' | 'failed',
  googleReviewId: string | undefined | null,
  matchScore: number,
  starRating?: number
) {
  const updates: any = {
    auto_verification_status: status,
    last_verification_attempt_at: new Date().toISOString(),
  };

  if (status === 'verified') {
    updates.auto_verified_at = new Date().toISOString();
    updates.verified = true;
    updates.verified_at = new Date().toISOString();
    updates.google_review_id = googleReviewId;
    updates.verification_match_score = matchScore;
    if (starRating !== undefined) {
      updates.star_rating = starRating;
    }
  }

  const { error } = await supabase
    .from('review_submissions')
    .update(updates)
    .eq('id', submissionId);

  if (error) {
    console.error(`❌ Error updating submission ${submissionId}:`, error);
  }
}

async function incrementVerificationAttempt(submissionId: string) {
  const { data, error: fetchError } = await supabase
    .from('review_submissions')
    .select('verification_attempts')
    .eq('id', submissionId)
    .single();

  if (fetchError) {
    console.error(`❌ Error fetching attempt count:`, fetchError);
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
    console.error(`❌ Error incrementing attempt:`, error);
  }
}
