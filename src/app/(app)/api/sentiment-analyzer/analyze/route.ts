/**
 * Sentiment Analyzer Analyze Endpoint
 *
 * Runs sentiment analysis on recent reviews using OpenAI.
 * Stores results and updates usage tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import {
  PLAN_ANALYSIS_LIMITS,
  PLAN_REVIEW_LIMITS,
  MIN_REVIEWS_REQUIRED,
  PlanType
} from '@/lib/sentiment-analyzer-constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for larger analyses

interface AnalyzeRequest {
  accountId: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  platform?: string;
  reviewer_name?: string;
}

interface SentimentAnalysisResult {
  metadata: {
    analysisId: string;
    runDate: string;
    reviewCount: number;
    reviewLimit: number;
    totalReviewsInAccount: number;
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string;
  };
  sentimentSummary: {
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number;
    breakdown: Record<'positive' | 'mixed' | 'negative', {
      count: number;
      percentage: number;
    }>;
    shortSummary: string;
  };
  themes: Array<{
    name: string;
    sentiment: 'strength' | 'improvement';
    mentionCount: number;
    supportingQuotes: Array<{
      reviewId: string;
      excerpt: string;
    }>;
  }>;
  improvementIdeas: Array<{
    title: string;
    description: string;
    sourceThemes: string[];
  }>;
  limitations?: string;
}

/**
 * Create AI prompt for sentiment analysis
 */
function createAnalysisPrompt(
  reviews: Review[],
  businessName: string,
  totalReviews: number
): string {
  const reviewsJson = JSON.stringify(reviews.map(r => ({
    id: r.id,
    content: r.content,
    rating: r.rating,
    created_at: r.created_at,
    platform: r.platform,
    reviewer_name: r.reviewer_name
  })), null, 2);

  const reviewCount = reviews.length;

  return `You are an insights analyst who reviews customer feedback and produces concise,
actionable summaries. Stay within the provided schema, ground every claim in the
review data, and avoid guessing beyond the evidence. If the reviews do not
support an insight or improvement idea, leave it out or use the \`limitations\`
field to explain why.

You are analyzing the ${reviewCount} most recent reviews (out of ${totalReviews})
for ${businessName}. Focus on what customers are praising and where they are
asking for improvements.

REVIEW DATA:
${reviewsJson}

TASKS:
1. Sentiment Summary:
   - Label overall sentiment as positive, mixed, or negative.
   - Count how many reviews are positive, mixed, and negative.
   - Produce a 0-100 sentiment score where >66 is positive, 34-66 is mixed, <34 is negative.
   - Write a one-sentence summary grounded in the reviews.
   - Ensure the counts add up to ${reviewCount} and percentages reflect those counts.

2. Themes Spotlight:
   - Identify up to three recurring themes present in the reviews.
   - Mark each theme as either a strength or an improvement area.
   - Provide the mention count and up to two short supporting quotes (≤80 characters) with their review IDs.

3. Improvement Ideas:
   - Suggest up to three ideas that would improve customer experience.
   - Each idea must reference at least one of the themes and explain how it helps.

4. Limitations:
   - If feedback volume is too small or signals conflict, use the \`limitations\`
     field to explain instead of guessing.

OUTPUT:
Return JSON that exactly matches this structure (no markdown, no code blocks, just raw JSON):
{
  "sentimentSummary": {
    "overallLabel": "positive" | "mixed" | "negative",
    "sentimentScore": number (0-100),
    "breakdown": {
      "positive": { "count": number, "percentage": number },
      "mixed": { "count": number, "percentage": number },
      "negative": { "count": number, "percentage": number }
    },
    "shortSummary": string
  },
  "themes": [
    {
      "name": string,
      "sentiment": "strength" | "improvement",
      "mentionCount": number,
      "supportingQuotes": [
        { "reviewId": string, "excerpt": string }
      ]
    }
  ],
  "improvementIdeas": [
    {
      "title": string,
      "description": string,
      "sourceThemes": [string]
    }
  ],
  "limitations": string (optional)
}

Do not invent data or entities not evidenced in the reviews.
If eligibility requirements are not met (e.g., <10 reviews), return only a limitations message.`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request
    const body: AnalyzeRequest = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .maybeSingle();

    if (!accountUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Fetch account data
    const serviceSupabase = createServiceRoleClient();
    const { data: account, error: accountError } = await serviceSupabase
      .from('accounts')
      .select('plan, sentiment_analyses_this_month, sentiment_last_reset_date, business_name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Determine plan
    let plan: PlanType = 'grower';
    if (account.plan === 'builder' || account.plan === 'maven') {
      plan = account.plan as PlanType;
    }

    const usageLimit = PLAN_ANALYSIS_LIMITS[plan];
    const reviewLimit = PLAN_REVIEW_LIMITS[plan];

    // Check monthly reset
    const now = new Date();
    const lastResetDate = account.sentiment_last_reset_date
      ? new Date(account.sentiment_last_reset_date)
      : null;

    let usageThisMonth = account.sentiment_analyses_this_month || 0;

    if (lastResetDate) {
      const isNewMonth = now.getMonth() !== lastResetDate.getMonth() ||
                        now.getFullYear() !== lastResetDate.getFullYear();
      if (isNewMonth) {
        usageThisMonth = 0;
      }
    }

    // Check quota
    if (usageThisMonth >= usageLimit) {
      return NextResponse.json(
        { success: false, error: 'Monthly analysis quota exceeded' },
        { status: 429 }
      );
    }

    // Fetch reviews from review_submissions only (excluding widget_reviews as they are curated/duplicate entries)
    const { data: submissions } = await serviceSupabase
      .from('review_submissions')
      .select('id, review_content, star_rating, created_at, platform, reviewer_name, first_name, last_name')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(reviewLimit);

    // Map to Review format
    const allReviews: Review[] = (submissions || []).map(r => ({
      id: r.id,
      content: r.review_content || '',
      rating: r.star_rating || 0,
      created_at: r.created_at,
      platform: r.platform,
      reviewer_name: r.reviewer_name || (r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : undefined)
    }));

    // Filter out reviews without content
    const reviewsToAnalyze = allReviews.filter(r => r.content && r.content.trim().length > 0);

    const totalReviewCount = reviewsToAnalyze.length;

    // Check minimum reviews
    if (reviewsToAnalyze.length < MIN_REVIEWS_REQUIRED) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient reviews. Need at least ${MIN_REVIEWS_REQUIRED} reviews, found ${reviewsToAnalyze.length}`
        },
        { status: 400 }
      );
    }

    // Get business name
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name || account.business_name || 'your business';

    // Create AI prompt
    const prompt = createAnalysisPrompt(reviewsToAnalyze, businessName, totalReviewCount);

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert data analyst specializing in sentiment analysis and customer feedback insights. Return only valid JSON without markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse AI response
    const analysisData = JSON.parse(aiResponse);

    // Calculate date range
    const dates = reviewsToAnalyze.map(r => new Date(r.created_at).getTime());
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    // Create analysis result
    const analysisId = crypto.randomUUID();
    const result: SentimentAnalysisResult = {
      metadata: {
        analysisId,
        runDate: now.toISOString(),
        reviewCount: reviewsToAnalyze.length,
        reviewLimit,
        totalReviewsInAccount: totalReviewCount,
        dateRangeAnalyzed: {
          start: earliestDate.toISOString(),
          end: latestDate.toISOString()
        },
        analysisVersion: '1.0'
      },
      sentimentSummary: analysisData.sentimentSummary,
      themes: analysisData.themes || [],
      improvementIdeas: analysisData.improvementIdeas || [],
      limitations: analysisData.limitations
    };

    // Calculate processing time
    const processingTimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Store result in database
    await serviceSupabase.from('sentiment_analysis_runs').insert({
      id: analysisId,
      account_id: accountId,
      run_date: now.toISOString(),
      review_count_analyzed: reviewsToAnalyze.length,
      date_range_start: earliestDate.toISOString(),
      date_range_end: latestDate.toISOString(),
      plan_at_time: plan,
      results_json: result,
      analysis_version: '1.0',
      processing_time_seconds: processingTimeSeconds
    });

    // Update usage counter
    await serviceSupabase
      .from('accounts')
      .update({
        sentiment_analyses_this_month: usageThisMonth + 1,
        sentiment_last_reset_date: now.toISOString().split('T')[0]
      })
      .eq('id', accountId);

    // Log AI usage
    const usage = completion.usage;
    if (usage) {
      const inputPrice = 0.01; // GPT-4 Turbo pricing per 1K tokens
      const outputPrice = 0.03;
      const cost = (usage.prompt_tokens / 1000) * inputPrice +
                   (usage.completion_tokens / 1000) * outputPrice;

      await serviceSupabase.from('ai_usage').insert({
        user_id: user.id,
        feature: 'sentiment_analysis',
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: cost,
        input_data: {
          accountId,
          reviewCount: reviewsToAnalyze.length,
          plan
        },
        created_at: now.toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      analysisId,
      results: result,
      reviewsAnalyzed: reviewsToAnalyze.length,
      reviewsSkipped: totalReviewCount - reviewsToAnalyze.length
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      },
      { status: 500 }
    );
  }
}
