/**
 * Keyword Suggestion Endpoint
 *
 * Uses AI to find potential keywords in reviews, then verifies
 * each suggestion actually exists using fuzzy matching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VerifiedSuggestion {
  keyword: string;
  count: number;
  sampleExcerpts: string[];
}

/**
 * Fuzzy match - checks if keyword appears in text with some flexibility
 * Handles minor variations like plurals, spacing, etc.
 */
function fuzzyMatch(text: string, keyword: string): { found: boolean; excerpt: string } {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase().trim();

  // Exact match first
  let index = lowerText.indexOf(lowerKeyword);

  // Try without trailing 's' (plural handling)
  if (index === -1 && lowerKeyword.endsWith('s')) {
    index = lowerText.indexOf(lowerKeyword.slice(0, -1));
  }

  // Try with 's' added (singular to plural)
  if (index === -1) {
    index = lowerText.indexOf(lowerKeyword + 's');
  }

  // Try with common variations
  if (index === -1) {
    // Replace hyphens/spaces interchangeably
    const variations = [
      lowerKeyword.replace(/-/g, ' '),
      lowerKeyword.replace(/ /g, '-'),
      lowerKeyword.replace(/-/g, ''),
      lowerKeyword.replace(/ /g, ''),
    ];

    for (const variation of variations) {
      index = lowerText.indexOf(variation);
      if (index !== -1) break;
    }
  }

  if (index === -1) {
    return { found: false, excerpt: '' };
  }

  // Extract excerpt
  const excerptStart = Math.max(0, index - 30);
  const excerptEnd = Math.min(text.length, index + keyword.length + 30);
  let excerpt = text.substring(excerptStart, excerptEnd);

  if (excerptStart > 0) excerpt = '...' + excerpt;
  if (excerptEnd < text.length) excerpt = excerpt + '...';

  return { found: true, excerpt };
}

/**
 * Verify AI suggestions against actual review content
 */
function verifySuggestions(
  suggestions: string[],
  reviews: { id: string; content: string }[],
  existingKeywords: string[]
): VerifiedSuggestion[] {
  const verified: VerifiedSuggestion[] = [];
  const existingLower = existingKeywords.map(k => k.toLowerCase());

  for (const suggestion of suggestions) {
    // Skip if already in keyword list
    if (existingLower.includes(suggestion.toLowerCase())) {
      continue;
    }

    const matches: { reviewId: string; excerpt: string }[] = [];

    for (const review of reviews) {
      const { found, excerpt } = fuzzyMatch(review.content, suggestion);
      if (found) {
        matches.push({ reviewId: review.id, excerpt });
      }
    }

    // Only include if found in 2+ reviews (not a hallucination)
    if (matches.length >= 2) {
      verified.push({
        keyword: suggestion,
        count: matches.length,
        sampleExcerpts: matches.slice(0, 3).map(m => m.excerpt),
      });
    }
  }

  // Sort by count descending
  return verified.sort((a, b) => b.count - a.count);
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
      .select('keyword_suggestions_this_month, keyword_suggestions_last_reset_date')
      .eq('id', accountId)
      .single();

    let usageThisMonth = accountData?.keyword_suggestions_this_month || 0;
    const lastResetDate = accountData?.keyword_suggestions_last_reset_date
      ? new Date(accountData.keyword_suggestions_last_reset_date)
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
          error: `You've reached your limit of ${MONTHLY_LIMIT} keyword discoveries this month. Your limit resets on the 1st of next month.`,
          usageThisMonth,
          monthlyLimit: MONTHLY_LIMIT,
        },
        { status: 429 }
      );
    }

    // Get existing keywords and business info for context
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('keywords, name, industry, about, city, state')
      .eq('account_id', accountId)
      .single();

    let existingKeywords: string[] = [];
    if (business?.keywords) {
      if (Array.isArray(business.keywords)) {
        existingKeywords = business.keywords;
      } else if (typeof business.keywords === 'string') {
        existingKeywords = business.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      }
    }

    // Fetch recent reviews
    const { data: submissions } = await serviceSupabase
      .from('review_submissions')
      .select('id, review_content')
      .eq('account_id', accountId)
      .not('review_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const reviews = (submissions || [])
      .filter(r => r.review_content && r.review_content.trim().length > 10)
      .map(r => ({
        id: r.id,
        content: r.review_content || '',
      }));

    console.log('[keyword-tracker/suggest] Reviews found:', reviews.length, 'Existing keywords:', existingKeywords.length);

    if (reviews.length < 5) {
      console.log('[keyword-tracker/suggest] Not enough reviews, need at least 5');
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Need at least 5 reviews to suggest keywords',
      });
    }

    // Combine reviews for AI analysis (limit to avoid token limits)
    const reviewSample = reviews.slice(0, 50).map(r => r.content).join('\n---\n');

    // Build business context
    const businessContext = [
      business?.name ? `Business name: ${business.name}` : '',
      business?.industry ? `Industry: ${business.industry}` : '',
      business?.city || business?.state ? `Location: ${[business.city, business.state].filter(Boolean).join(', ')}` : '',
      business?.about ? `About: ${business.about}` : '',
    ].filter(Boolean).join('\n');

    // Ask AI to find keyword phrases
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a keyword extraction expert. Extract specific, meaningful keyword phrases from customer reviews that would be valuable for SEO and business insights.

The goal is to find keywords that potential customers might type into a search engine to find this business.

Focus on:
- Service/product names and types
- Quality descriptors (e.g., "high quality", "professional service")
- Specific features mentioned
- Location-specific terms if relevant
- Industry-specific terminology

Rules:
- Extract 10-20 keyword phrases
- Each phrase should be 2-6 words
- Be specific, not generic
- Only extract phrases that actually appear in the reviews
- Return as a JSON array of strings

${businessContext ? `\nBusiness context:\n${businessContext}` : ''}
${existingKeywords.length > 0 ? `\nAlready tracked keywords (DO NOT include these): ${existingKeywords.join(', ')}` : ''}`,
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
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI suggestions',
      }, { status: 500 });
    }

    console.log('[keyword-tracker/suggest] AI suggested keywords:', aiSuggestions.length, aiSuggestions);

    // Filter out existing keywords (AI should do this, but double-check)
    const existingLower = existingKeywords.map(k => k.toLowerCase());
    const newSuggestions = aiSuggestions.filter(
      (s: string) => !existingLower.includes(s.toLowerCase())
    );

    // Count occurrences and collect excerpts for each suggestion
    const formattedSuggestions = newSuggestions.slice(0, 10).map((keyword: string) => {
      const lowerKeyword = keyword.toLowerCase();
      const matches: string[] = [];

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
          matches.push(excerpt);
        }
      }

      return {
        keyword,
        count: matches.length,
        sampleExcerpts: matches.slice(0, 3),
      };
    });

    // Sort by count descending so most relevant appear first
    formattedSuggestions.sort((a, b) => b.count - a.count);

    // Update usage tracking
    const newUsageCount = usageThisMonth + 1;
    await serviceSupabase
      .from('accounts')
      .update({
        keyword_suggestions_this_month: newUsageCount,
        keyword_suggestions_last_reset_date: now.toISOString().split('T')[0]
      })
      .eq('id', accountId);

    console.log('[keyword-tracker/suggest] Returning suggestions:', formattedSuggestions.length);

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions,
      reviewsAnalyzed: reviews.length,
      usageThisMonth: newUsageCount,
      monthlyLimit: MONTHLY_LIMIT,
    });

  } catch (error) {
    console.error('Keyword suggestion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
      },
      { status: 500 }
    );
  }
}
