/**
 * Sentiment Analyzer Analyze Endpoint
 *
 * Runs sentiment analysis on recent reviews using OpenAI.
 * Uses credit-based billing instead of monthly quotas.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { MIN_REVIEWS_REQUIRED } from '@/lib/sentiment-analyzer-constants';
import {
  calculateSentimentAnalysisCost,
  checkSentimentAnalysisCredits,
  debitSentimentAnalysisCredits,
} from '@/features/sentiment-analyzer/services/credits';
import { InsufficientCreditsError } from '@/lib/credits/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for larger analyses

interface AnalyzeRequest {
  accountId: string;
  /** Maximum number of reviews to analyze. Defaults to 500 if not specified */
  reviewLimit?: number;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  platform?: string;
  reviewer_name?: string;
}

interface DiscoveredPhrase {
  phrase: string;
  occurrenceCount: number;
  sampleExcerpts: string[];
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
  discoveredPhrases?: DiscoveredPhrase[];
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

/**
 * Discover keyword phrases from reviews using AI
 * This runs as part of sentiment analysis to find potential keywords
 */
async function discoverPhrases(
  openai: OpenAI,
  reviews: Review[],
  existingKeywords: string[],
  businessContext: { name?: string; industry?: string; about?: string }
): Promise<DiscoveredPhrase[]> {
  if (reviews.length < 5) {
    return [];
  }

  try {
    // Sample reviews for phrase discovery (limit to avoid token limits)
    const reviewSample = reviews.slice(0, 50).map(r => r.content).join('\n---\n');

    // Build context string
    const contextParts = [
      businessContext.name ? `Business: ${businessContext.name}` : '',
      businessContext.industry ? `Industry: ${businessContext.industry}` : '',
      businessContext.about ? `About: ${businessContext.about}` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a keyword extraction expert. Extract specific, meaningful keyword phrases from customer reviews that would be valuable for SEO and business insights.

Focus on:
- Service/product names and types
- Quality descriptors (e.g., "high quality", "professional service")
- Specific features mentioned
- Industry-specific terminology

Rules:
- Extract 5-10 keyword phrases
- Each phrase should be 2-5 words
- Be specific, not generic
- Only extract phrases that actually appear in the reviews
- Return as a JSON object with a "keywords" array of strings

${contextParts ? `\nBusiness context:\n${contextParts}` : ''}
${existingKeywords.length > 0 ? `\nAlready tracked keywords (DO NOT include): ${existingKeywords.join(', ')}` : ''}`,
        },
        {
          role: 'user',
          content: `Extract keyword phrases from these customer reviews:\n\n${reviewSample}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let aiSuggestions: string[] = [];

    try {
      const parsed = JSON.parse(responseText);
      aiSuggestions = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : Array.isArray(parsed)
          ? parsed
          : [];
    } catch {
      console.error('[phrase-discovery] Failed to parse AI response');
      return [];
    }

    // Filter out existing keywords
    const existingLower = existingKeywords.map(k => k.toLowerCase());
    const newSuggestions = aiSuggestions.filter(
      (s: string) => !existingLower.includes(s.toLowerCase())
    );

    // Count occurrences and collect excerpts for each suggestion
    const discoveredPhrases: DiscoveredPhrase[] = [];

    for (const keyword of newSuggestions.slice(0, 10)) {
      const lowerKeyword = keyword.toLowerCase();
      const excerpts: string[] = [];

      for (const review of reviews) {
        const lowerContent = review.content.toLowerCase();
        if (lowerContent.includes(lowerKeyword)) {
          // Extract excerpt around the match
          const index = lowerContent.indexOf(lowerKeyword);
          const excerptStart = Math.max(0, index - 30);
          const excerptEnd = Math.min(review.content.length, index + keyword.length + 30);
          let excerpt = review.content.substring(excerptStart, excerptEnd);
          if (excerptStart > 0) excerpt = '...' + excerpt;
          if (excerptEnd < review.content.length) excerpt = excerpt + '...';
          excerpts.push(excerpt);
        }
      }

      // Only include if found in 2+ reviews
      if (excerpts.length >= 2) {
        discoveredPhrases.push({
          phrase: keyword,
          occurrenceCount: excerpts.length,
          sampleExcerpts: excerpts.slice(0, 3),
        });
      }
    }

    // Sort by occurrence count descending
    return discoveredPhrases.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  } catch (error) {
    console.error('[phrase-discovery] Error:', error);
    return [];
  }
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
      .select('plan, business_name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Review limit - user can specify or default to 500
    // Maximum of 10,000 reviews to keep processing time reasonable
    const reviewLimit = Math.min(body.reviewLimit || 500, 10000);

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

    // Check credit balance
    const creditCheck = await checkSentimentAnalysisCredits(
      serviceSupabase,
      accountId,
      reviewsToAnalyze.length
    );

    if (!creditCheck.hasCredits) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient credits',
          creditsRequired: creditCheck.required,
          creditsAvailable: creditCheck.available,
          tierLabel: creditCheck.tierLabel,
        },
        { status: 402 }
      );
    }

    // Generate idempotency key for this analysis
    const analysisId = crypto.randomUUID();
    const idempotencyKey = `sentiment_analysis:${accountId}:${analysisId}`;

    // Get business info including keywords for phrase discovery
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('name, industry, about, keywords')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name || account.business_name || 'your business';

    // Extract existing keywords for phrase discovery filtering
    let existingKeywords: string[] = [];
    if (business?.keywords) {
      if (Array.isArray(business.keywords)) {
        existingKeywords = business.keywords;
      } else if (typeof business.keywords === 'string') {
        existingKeywords = business.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      }
    }

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

    // Run phrase discovery in parallel with result creation
    const discoveredPhrases = await discoverPhrases(
      openai,
      reviewsToAnalyze,
      existingKeywords,
      {
        name: business?.name,
        industry: business?.industry,
        about: business?.about,
      }
    );

    // Create analysis result (analysisId already generated earlier for idempotency)
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
      discoveredPhrases: discoveredPhrases.length > 0 ? discoveredPhrases : undefined,
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
      plan_at_time: account.plan || 'grower',
      results_json: result,
      analysis_version: '1.0',
      processing_time_seconds: processingTimeSeconds
    });

    // Debit credits for this analysis
    const creditCost = calculateSentimentAnalysisCost(reviewsToAnalyze.length);
    await debitSentimentAnalysisCredits(
      serviceSupabase,
      accountId,
      reviewsToAnalyze.length,
      analysisId,
      idempotencyKey
    );

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
          creditCost
        },
        created_at: now.toISOString()
      });
    }

    // Get updated balance for response
    const updatedBalance = await checkSentimentAnalysisCredits(
      serviceSupabase,
      accountId,
      0 // Just get balance, not checking for a specific operation
    );

    return NextResponse.json({
      success: true,
      analysisId,
      results: result,
      reviewsAnalyzed: reviewsToAnalyze.length,
      reviewsSkipped: totalReviewCount - reviewsToAnalyze.length,
      credits: {
        cost: creditCost,
        remaining: updatedBalance.available,
      }
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);

    // Handle insufficient credits error
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient credits',
          creditsRequired: error.required,
          creditsAvailable: error.available,
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      },
      { status: 500 }
    );
  }
}
