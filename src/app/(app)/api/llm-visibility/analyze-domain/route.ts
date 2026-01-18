import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DomainAnalysis {
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
}

/**
 * POST /api/llm-visibility/analyze-domain
 *
 * Analyzes a domain to determine how difficult it would be to get listed/cited
 * and provides actionable advice.
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
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Check if we already have a cached analysis for this domain
    const { data: cached } = await supabase
      .from('domain_analysis_cache')
      .select('*')
      .eq('domain', domain)
      .single();

    if (cached) {
      return NextResponse.json({
        difficulty: cached.difficulty,
        siteType: cached.site_type,
        strategy: cached.strategy,
        cached: true,
      });
    }

    // Use AI to analyze the domain
    const prompt = `Analyze the following website domain and determine:
1. What type of site it is (directory, blog, news site, review site, brand/company site, government site, educational site, etc.)
2. How difficult it would be for a business to get mentioned or listed on this site (easy, medium, or hard)
3. Specific, actionable advice on how to get listed or mentioned

Domain: ${domain}

Guidelines for difficulty:
- EASY: Directories, review sites, business listings where anyone can create a profile or submit a listing (e.g., Yelp, Yellow Pages, industry directories, Google Business Profile, Clutch, G2)
- MEDIUM: Blogs, news sites, forums, community sites where you could pitch a story, contribute content, get mentioned in articles, or participate in discussions (e.g., Reddit, Medium, industry blogs, local news)
- HARD: Competitor brand sites, major publications with strict editorial standards, government sites, educational institutions, sites that don't accept outside contributions

For EASY sites: Provide specific steps to create a listing or profile.
For MEDIUM sites: Provide realistic outreach strategies like guest posting, PR pitches, or community participation.
For HARD sites: Be honest. If it's very difficult or unlikely, say "Getting a citation on this site would be difficult. No known direct strategy." Only suggest approaches if they're genuinely feasible.

Respond in JSON format:
{
  "siteType": "type of site",
  "difficulty": "easy|medium|hard",
  "strategy": "Your specific advice here. Keep it concise but actionable (2-4 sentences max)."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO and digital marketing expert. Analyze domains and provide realistic, actionable advice for getting a business mentioned or listed on them. Be honest about difficulty - don\'t give false hope for sites that are very difficult to get on.',
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
    let analysis: DomainAnalysis;

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
        strategy: 'Unable to analyze this domain.',
      };
    }

    // Cache the result (create table if needed via migration, but try insert anyway)
    try {
      await supabase
        .from('domain_analysis_cache')
        .upsert({
          domain,
          difficulty: analysis.difficulty,
          site_type: analysis.siteType,
          strategy: analysis.strategy,
          analyzed_at: new Date().toISOString(),
        }, {
          onConflict: 'domain',
        });
    } catch (cacheError) {
      // Cache table might not exist yet, that's okay
      console.warn('[analyze-domain] Could not cache result:', cacheError);
    }

    return NextResponse.json({
      difficulty: analysis.difficulty,
      siteType: analysis.siteType,
      strategy: analysis.strategy,
      cached: false,
    });

  } catch (error) {
    console.error('[analyze-domain] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze domain' },
      { status: 500 }
    );
  }
}
