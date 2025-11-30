/**
 * Keyword Tracker Analyze Endpoint
 *
 * Scans recent reviews for keyword mentions and stores results for historical tracking.
 * No AI required - uses simple text matching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export const dynamic = 'force-dynamic';

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  platform?: string;
  reviewer_name?: string;
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

interface AnalysisResult {
  id: string;
  runDate: string;
  reviewCountAnalyzed: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  keywordsAnalyzed: string[];
  results: KeywordResult[];
  totalMentions: number;
  keywordsWithMentions: number;
}

/**
 * Find keyword mentions in text (case-insensitive)
 * Returns excerpt around the first match
 */
function findKeywordInText(text: string, keyword: string): { found: boolean; excerpt: string } {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    return { found: false, excerpt: '' };
  }

  // Extract excerpt: 30 chars before and after the keyword
  const excerptStart = Math.max(0, index - 30);
  const excerptEnd = Math.min(text.length, index + keyword.length + 30);
  let excerpt = text.substring(excerptStart, excerptEnd);

  // Add ellipsis if truncated
  if (excerptStart > 0) excerpt = '...' + excerpt;
  if (excerptEnd < text.length) excerpt = excerpt + '...';

  return { found: true, excerpt };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'No valid account found' },
        { status: 403 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Check usage limit before proceeding
    const MONTHLY_LIMIT = 3;
    const now = new Date();

    const { data: accountData } = await serviceSupabase
      .from('accounts')
      .select('keyword_analyses_this_month, keyword_last_reset_date')
      .eq('id', accountId)
      .single();

    let usageThisMonth = accountData?.keyword_analyses_this_month || 0;
    const lastResetDate = accountData?.keyword_last_reset_date
      ? new Date(accountData.keyword_last_reset_date)
      : null;

    // Check if we need to reset the counter (new month)
    if (lastResetDate) {
      const isNewMonth = now.getMonth() !== lastResetDate.getMonth() ||
                        now.getFullYear() !== lastResetDate.getFullYear();
      if (isNewMonth) {
        usageThisMonth = 0;
      }
    }

    if (usageThisMonth >= MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `You've reached your limit of ${MONTHLY_LIMIT} analyses this month. Your limit resets on the 1st of next month.`,
          usageThisMonth,
          monthlyLimit: MONTHLY_LIMIT,
        },
        { status: 429 }
      );
    }

    // Fetch business to get keywords
    const { data: business, error: businessError } = await serviceSupabase
      .from('businesses')
      .select('keywords')
      .eq('account_id', accountId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Parse keywords
    let keywords: string[] = [];
    if (Array.isArray(business.keywords)) {
      keywords = business.keywords.filter((k: string) => k && k.trim());
    } else if (typeof business.keywords === 'string' && business.keywords) {
      keywords = business.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keywords to analyze. Add keywords first.' },
        { status: 400 }
      );
    }

    // Fetch reviews from review_submissions
    const { data: submissions } = await serviceSupabase
      .from('review_submissions')
      .select('id, review_content, star_rating, created_at, platform, reviewer_name, first_name, last_name')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(500); // Analyze up to 500 most recent reviews

    // Map to Review format
    const reviews: Review[] = (submissions || [])
      .filter(r => r.review_content && r.review_content.trim().length > 0)
      .map(r => ({
        id: r.id,
        content: r.review_content || '',
        rating: r.star_rating || 0,
        created_at: r.created_at,
        platform: r.platform,
        reviewer_name: r.reviewer_name || (r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : undefined)
      }));

    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No reviews to analyze. Import or collect some reviews first.' },
        { status: 400 }
      );
    }

    // Calculate date range
    const dates = reviews.map(r => new Date(r.created_at).getTime());
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    // Analyze keywords
    const results: KeywordResult[] = keywords.map(keyword => {
      const matchingReviews: { reviewId: string; excerpt: string }[] = [];

      for (const review of reviews) {
        const { found, excerpt } = findKeywordInText(review.content, keyword);
        if (found) {
          matchingReviews.push({
            reviewId: review.id,
            excerpt
          });
        }
      }

      return {
        keyword,
        mentionCount: matchingReviews.length,
        reviewIds: matchingReviews.map(m => m.reviewId),
        excerpts: matchingReviews.slice(0, 5) // Store up to 5 excerpts
      };
    });

    // Calculate summary stats
    const totalMentions = results.reduce((sum, r) => sum + r.mentionCount, 0);
    const keywordsWithMentions = results.filter(r => r.mentionCount > 0).length;

    // Store analysis run
    const analysisId = crypto.randomUUID();

    const { error: insertError } = await serviceSupabase
      .from('keyword_analysis_runs')
      .insert({
        id: analysisId,
        account_id: accountId,
        run_date: now.toISOString(),
        review_count_analyzed: reviews.length,
        date_range_start: earliestDate.toISOString(),
        date_range_end: latestDate.toISOString(),
        keywords_analyzed: keywords,
        results_json: results,
        total_mentions: totalMentions,
        keywords_with_mentions: keywordsWithMentions
      });

    if (insertError) {
      console.error('Error storing analysis run:', insertError);
      // Don't fail the request, just log the error
    }

    // Update usage tracking (increment the counter we already fetched)
    const newUsageCount = usageThisMonth + 1;
    await serviceSupabase
      .from('accounts')
      .update({
        keyword_analyses_this_month: newUsageCount,
        keyword_last_reset_date: now.toISOString().split('T')[0]
      })
      .eq('id', accountId);

    const analysisResult: AnalysisResult = {
      id: analysisId,
      runDate: now.toISOString(),
      reviewCountAnalyzed: reviews.length,
      dateRangeStart: earliestDate.toISOString(),
      dateRangeEnd: latestDate.toISOString(),
      keywordsAnalyzed: keywords,
      results,
      totalMentions,
      keywordsWithMentions
    };

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      usageThisMonth: newUsageCount,
      monthlyLimit: MONTHLY_LIMIT,
    });

  } catch (error) {
    console.error('Keyword analysis error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      },
      { status: 500 }
    );
  }
}
