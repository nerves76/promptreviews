/**
 * Monthly Keyword Tracker Analysis Cron
 *
 * Runs on the 1st of each month for accounts that have previously run analysis.
 * Only analyzes accounts that have opted in (have at least one analysis run).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}

interface KeywordResult {
  keyword: string;
  mentionCount: number;
  reviewIds: string[];
  excerpts: Array<{
    reviewId: string;
    excerpt: string;
  }>;
}

/**
 * Find keyword mentions in text (case-insensitive)
 */
function findKeywordInText(text: string, keyword: string): { found: boolean; excerpt: string } {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    return { found: false, excerpt: '' };
  }

  const excerptStart = Math.max(0, index - 30);
  const excerptEnd = Math.min(text.length, index + keyword.length + 30);
  let excerpt = text.substring(excerptStart, excerptEnd);

  if (excerptStart > 0) excerpt = '...' + excerpt;
  if (excerptEnd < text.length) excerpt = excerpt + '...';

  return { found: true, excerpt };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET_TOKEN;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Find accounts that have at least one analysis run (opted in)
    const { data: accountsWithAnalysis, error: accountsError } = await supabase
      .from('keyword_analysis_runs')
      .select('account_id')
      .order('run_date', { ascending: false });

    if (accountsError) {
      console.error('Error fetching accounts with analysis:', accountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    // Get unique account IDs
    const uniqueAccountIds = [...new Set(accountsWithAnalysis?.map(a => a.account_id) || [])];

    if (uniqueAccountIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts have opted into keyword tracking',
        analyzed: 0
      });
    }

    console.log(`Running keyword analysis for ${uniqueAccountIds.length} accounts`);

    let successCount = 0;
    let errorCount = 0;
    const results: { accountId: string; status: string; mentions?: number }[] = [];

    for (const accountId of uniqueAccountIds) {
      try {
        // Get business keywords
        const { data: business } = await supabase
          .from('businesses')
          .select('keywords')
          .eq('account_id', accountId)
          .single();

        if (!business?.keywords) {
          results.push({ accountId, status: 'skipped - no keywords' });
          continue;
        }

        // Parse keywords
        let keywords: string[] = [];
        if (Array.isArray(business.keywords)) {
          keywords = business.keywords.filter((k: string) => k && k.trim());
        } else if (typeof business.keywords === 'string' && business.keywords) {
          keywords = business.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        }

        if (keywords.length === 0) {
          results.push({ accountId, status: 'skipped - no keywords' });
          continue;
        }

        // Fetch reviews
        const { data: submissions } = await supabase
          .from('review_submissions')
          .select('id, review_content, star_rating, created_at')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(500);

        const reviews: Review[] = (submissions || [])
          .filter(r => r.review_content && r.review_content.trim().length > 0)
          .map(r => ({
            id: r.id,
            content: r.review_content || '',
            rating: r.star_rating || 0,
            created_at: r.created_at,
          }));

        if (reviews.length === 0) {
          results.push({ accountId, status: 'skipped - no reviews' });
          continue;
        }

        // Calculate date range
        const dates = reviews.map(r => new Date(r.created_at).getTime());
        const earliestDate = new Date(Math.min(...dates));
        const latestDate = new Date(Math.max(...dates));

        // Analyze keywords
        const keywordResults: KeywordResult[] = keywords.map(keyword => {
          const matchingReviews: { reviewId: string; excerpt: string }[] = [];

          for (const review of reviews) {
            const { found, excerpt } = findKeywordInText(review.content, keyword);
            if (found) {
              matchingReviews.push({ reviewId: review.id, excerpt });
            }
          }

          return {
            keyword,
            mentionCount: matchingReviews.length,
            reviewIds: matchingReviews.map(m => m.reviewId),
            excerpts: matchingReviews.slice(0, 5)
          };
        });

        const totalMentions = keywordResults.reduce((sum, r) => sum + r.mentionCount, 0);
        const keywordsWithMentions = keywordResults.filter(r => r.mentionCount > 0).length;

        // Store analysis run
        const { error: insertError } = await supabase
          .from('keyword_analysis_runs')
          .insert({
            id: crypto.randomUUID(),
            account_id: accountId,
            run_date: new Date().toISOString(),
            review_count_analyzed: reviews.length,
            date_range_start: earliestDate.toISOString(),
            date_range_end: latestDate.toISOString(),
            keywords_analyzed: keywords,
            results_json: keywordResults,
            total_mentions: totalMentions,
            keywords_with_mentions: keywordsWithMentions
          });

        if (insertError) {
          console.error(`Error storing analysis for ${accountId}:`, insertError);
          results.push({ accountId, status: 'error - failed to store' });
          errorCount++;
        } else {
          results.push({ accountId, status: 'success', mentions: totalMentions });
          successCount++;
        }

      } catch (err) {
        console.error(`Error analyzing account ${accountId}:`, err);
        results.push({ accountId, status: 'error' });
        errorCount++;
      }
    }

    console.log(`Keyword analysis complete: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Analyzed ${successCount} accounts`,
      analyzed: successCount,
      errors: errorCount,
      results
    });

  } catch (error) {
    console.error('Keyword tracker cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
