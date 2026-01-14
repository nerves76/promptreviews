import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('debug-verify-google-reviews', async () => {
    // Get ALL Google Business Profile reviews with imported_from_google field
    const { data: allReviews, count: totalGoogleCount } = await supabase
      .from('review_submissions')
      .select('id, auto_verification_status, verified, business_id, review_text_copy, submitted_at, verification_attempts, imported_from_google, account_id, first_name, last_name', { count: 'exact' })
      .eq('platform', 'Google Business Profile')
      .order('submitted_at', { ascending: false })
      .limit(200);

    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

    // Separate imported Google reviews vs Prompt Page submissions
    const importedFromGoogle = allReviews?.filter(r => r.imported_from_google === true) || [];
    const promptPageSubmissions = allReviews?.filter(r => r.imported_from_google === false) || [];

    const stats = {
      total: totalGoogleCount || 0,
      // KEY DISTINCTION: These are the two types of reviews
      importedFromGoogle: importedFromGoogle.length,
      promptPageSubmissions: promptPageSubmissions.length,
      // Prompt Page submission status breakdown
      promptPageStatus: {
        pending: promptPageSubmissions.filter(r => r.auto_verification_status === 'pending').length,
        verified: promptPageSubmissions.filter(r => r.auto_verification_status === 'verified').length,
        not_found: promptPageSubmissions.filter(r => r.auto_verification_status === 'not_found').length,
        failed: promptPageSubmissions.filter(r => r.auto_verification_status === 'failed').length,
        null: promptPageSubmissions.filter(r => r.auto_verification_status === null).length,
      },
      // Data quality for Prompt Page submissions
      promptPageDataQuality: {
        withBusinessId: promptPageSubmissions.filter(r => r.business_id).length,
        withReviewTextCopy: promptPageSubmissions.filter(r => r.review_text_copy).length,
        withinLast90Days: promptPageSubmissions.filter(r => new Date(r.submitted_at).getTime() >= ninetyDaysAgo).length,
        maxAttempts: promptPageSubmissions.filter(r => r.verification_attempts >= 5).length,
      },
      // By account
      uniqueAccounts: [...new Set(allReviews?.map(r => r.account_id) || [])].length,
    };

    // Eligible = Prompt Page submissions that should be verified by cron
    const eligibleForVerification = promptPageSubmissions.filter(r =>
      r.auto_verification_status === 'pending' &&
      r.review_text_copy &&
      r.verification_attempts < 5
    );

    // Group by account for per-account analysis
    const byAccount: Record<string, { imported: number; promptPage: number; pendingVerification: number }> = {};
    for (const r of allReviews || []) {
      if (!byAccount[r.account_id]) {
        byAccount[r.account_id] = { imported: 0, promptPage: 0, pendingVerification: 0 };
      }
      if (r.imported_from_google === true) {
        byAccount[r.account_id].imported++;
      } else {
        byAccount[r.account_id].promptPage++;
        if (r.auto_verification_status === 'pending' && r.review_text_copy && r.verification_attempts < 5) {
          byAccount[r.account_id].pendingVerification++;
        }
      }
    }

    return {
      success: true,
      summary: {
        explanation: {
          importedFromGoogle: 'Reviews fetched from Google API (already verified, not candidates for auto-verify)',
          promptPageSubmissions: 'Reviews submitted via Prompt Pages (candidates for auto-verify)',
          autoVerifyLogic: 'Cron matches pending Prompt Page submissions against imported Google reviews',
        },
        stats,
        byAccount,
        eligibleForVerification: eligibleForVerification.length,
        sampleEligible: eligibleForVerification.slice(0, 5).map(r => ({
          id: r.id,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          status: r.auto_verification_status,
          attempts: r.verification_attempts,
          hasText: !!r.review_text_copy,
        })),
        sampleImported: importedFromGoogle.slice(0, 3).map(r => ({
          id: r.id,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          verified: r.verified,
        })),
      },
    };
  });
}
