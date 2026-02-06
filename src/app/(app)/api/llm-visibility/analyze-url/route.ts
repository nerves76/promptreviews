import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface URLAnalysis {
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
}

/**
 * POST /api/llm-visibility/analyze-url
 *
 * Analyzes a specific URL (not just its domain) to determine the page type
 * and provide tailored link-building strategies.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check if we already have a cached analysis for this URL
    const { data: cached } = await supabase
      .from('url_analysis_cache')
      .select('*')
      .eq('url', url)
      .single();

    if (cached) {
      return NextResponse.json({
        difficulty: cached.difficulty,
        siteType: cached.site_type,
        strategy: cached.strategy,
        cached: true,
      });
    }

    // Use AI to analyze the specific URL
    const prompt = `Analyze the following specific URL and determine:
1. What type of page it is (directory listing, blog article, resource/roundup page, forum thread, news article, review/comparison page, product page, FAQ page, government page, educational page, etc.)
2. How difficult it would be for a business to get mentioned or listed on THIS SPECIFIC PAGE (easy, medium, or hard)
3. Specific, actionable advice tailored to this page type for getting mentioned or linked

URL: ${url}

Guidelines for difficulty:
- EASY: Directory listings, business listing pages, profile submission pages, review platforms where anyone can submit (e.g., Yelp listings, industry directories, Google Business Profile)
- MEDIUM: Blog articles, resource/roundup pages, forum threads, community discussions where you could contribute, get added, or pitch inclusion (e.g., "best of" lists, Reddit threads, industry blogs)
- HARD: News articles from major publications, competitor product pages, government pages, academic resources, pages that don't accept outside contributions

Page-type-specific strategy guidelines:
- Directory/listing page: Explain how to submit a profile or claim a listing on this specific site.
- Blog article: Suggest pitching the author to include your business, or propose a guest post on a related topic.
- Resource/roundup page: Recommend emailing the author to suggest adding your business to the list.
- Forum/community thread: Suggest participating in discussions, answering questions, or sharing expertise.
- News article: Suggest PR outreach, offering expert commentary, or newsjacking related stories.
- Review/comparison page: Recommend getting reviewed or providing your product for comparison.
- FAQ/educational page: Suggest offering your expertise or content as an additional resource.
- For HARD pages: Be honest. If it's very difficult or unlikely, say "Getting a citation on this page would be difficult. No known direct strategy." Only suggest approaches if they're genuinely feasible.

Keep the strategy concise (2-4 sentences) and actionable for this specific page type.

Respond in JSON format:
{
  "siteType": "specific page type (e.g., 'Blog article', 'Directory listing', 'Resource roundup page')",
  "difficulty": "easy|medium|hard",
  "strategy": "Your specific advice here tailored to this page type."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO and digital marketing expert. Analyze specific URLs and provide realistic, actionable advice for getting a business mentioned or linked on them. Focus on the page type and tailor your strategy accordingly. Be honest about difficulty - don\'t give false hope for pages that are very difficult to get on.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let analysis: URLAnalysis;

    try {
      const parsed = JSON.parse(responseText);
      analysis = {
        difficulty: parsed.difficulty || 'medium',
        siteType: parsed.siteType || 'Unknown',
        strategy: parsed.strategy || 'No strategy available.',
      };
    } catch {
      analysis = {
        difficulty: 'medium',
        siteType: 'Unknown',
        strategy: 'Unable to analyze this URL.',
      };
    }

    // Cache the result
    try {
      await supabase
        .from('url_analysis_cache')
        .upsert({
          url,
          difficulty: analysis.difficulty,
          site_type: analysis.siteType,
          strategy: analysis.strategy,
          analyzed_at: new Date().toISOString(),
        }, {
          onConflict: 'url',
        });
    } catch (cacheError) {
      console.warn('[analyze-url] Could not cache result:', cacheError);
    }

    return NextResponse.json({
      difficulty: analysis.difficulty,
      siteType: analysis.siteType,
      strategy: analysis.strategy,
      cached: false,
    });

  } catch (error) {
    console.error('[analyze-url] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze URL' },
      { status: 500 }
    );
  }
}
