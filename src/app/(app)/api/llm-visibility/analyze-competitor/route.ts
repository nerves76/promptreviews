import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CompetitorAnalysis {
  whoTheyAre: string;
  whyMentioned: string;
  howToDifferentiate: string;
}

/**
 * POST /api/llm-visibility/analyze-competitor
 *
 * Analyzes a competitor to provide strategic insights:
 * - Who they are (brief description)
 * - Why AI mentions them (what makes them authoritative)
 * - How to differentiate (actionable advice)
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
    const { competitorName, domain, categories, concepts } = body;

    if (!competitorName) {
      return NextResponse.json({ error: 'Competitor name is required' }, { status: 400 });
    }

    // Check if we already have a cached analysis for this competitor
    const { data: cached } = await supabase
      .from('competitor_analysis_cache')
      .select('*')
      .eq('competitor_name', competitorName.toLowerCase())
      .eq('account_id', accountId)
      .single();

    if (cached) {
      return NextResponse.json({
        whoTheyAre: cached.who_they_are,
        whyMentioned: cached.why_mentioned,
        howToDifferentiate: cached.how_to_differentiate,
        cached: true,
      });
    }

    // Get the user's business info for context
    const { data: business } = await supabase
      .from('businesses')
      .select(`
        name,
        business_description,
        unique_aspects,
        about_us,
        business_website,
        industry,
        services_offered,
        company_values,
        differentiators,
        tagline,
        keywords,
        address_city,
        address_state
      `)
      .eq('account_id', accountId)
      .single();

    // Build comprehensive business context
    const businessContextParts: string[] = [];
    if (business) {
      if (business.name) {
        businessContextParts.push(`The user's business is "${business.name}".`);
      }
      if (business.tagline) {
        businessContextParts.push(`Tagline: "${business.tagline}".`);
      }
      if (business.business_description) {
        businessContextParts.push(`Description: ${business.business_description}`);
      }
      if (business.about_us) {
        businessContextParts.push(`About: ${business.about_us}`);
      }
      if (business.industry && Array.isArray(business.industry) && business.industry.length > 0) {
        businessContextParts.push(`Industry: ${business.industry.join(', ')}.`);
      }
      if (business.services_offered && Array.isArray(business.services_offered) && business.services_offered.length > 0) {
        businessContextParts.push(`Services offered: ${business.services_offered.join(', ')}.`);
      }
      if (business.unique_aspects) {
        businessContextParts.push(`Unique aspects: ${business.unique_aspects}`);
      }
      if (business.differentiators) {
        businessContextParts.push(`Key differentiators: ${business.differentiators}`);
      }
      if (business.company_values) {
        businessContextParts.push(`Company values: ${business.company_values}`);
      }
      if (business.keywords && Array.isArray(business.keywords) && business.keywords.length > 0) {
        businessContextParts.push(`Keywords: ${business.keywords.join(', ')}.`);
      }
      if (business.address_city || business.address_state) {
        const location = [business.address_city, business.address_state].filter(Boolean).join(', ');
        businessContextParts.push(`Location: ${location}.`);
      }
      if (business.business_website) {
        businessContextParts.push(`Website: ${business.business_website}`);
      }
    }
    const businessContext = businessContextParts.join('\n');

    // Build context about the competitor
    const competitorContext = [
      domain ? `Their website is ${domain}.` : '',
      categories?.length ? `They operate in: ${categories.join(', ')}.` : '',
      concepts?.length ? `They appear when people ask about: ${concepts.join(', ')}.` : '',
    ].filter(Boolean).join(' ');

    // Use AI to analyze the competitor
    const prompt = `Analyze this competitor and provide strategic insights for the user's business. Be concise - each section should be 1-2 sentences max.

## Competitor Information
Name: ${competitorName}
${competitorContext}

## User's Business Information
${businessContext || 'No business information provided.'}

## Required Output
Provide analysis in this exact JSON format:
{
  "whoTheyAre": "Brief description of what this competitor does and who they serve. One sentence.",
  "whyMentioned": "Why AI assistants recommend this competitor - what makes them authoritative or notable. One sentence.",
  "howToDifferentiate": "Specific, actionable advice on how the user's business can stand out from this competitor. Reference the user's unique strengths if known. One sentence."
}

## Guidelines
- Keep each response to ONE concise sentence
- Be specific and actionable, not generic
- For "howToDifferentiate", consider the user's business strengths, services, values, and differentiators when suggesting how to compete
- If you don't know the competitor, make reasonable inferences from the name and context provided
- Focus on practical actions the user can take`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a competitive intelligence analyst. Provide brief, actionable insights about competitors. Always respond with valid JSON.',
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
    let analysis: CompetitorAnalysis;

    try {
      const parsed = JSON.parse(responseText);
      analysis = {
        whoTheyAre: parsed.whoTheyAre || 'Unable to determine.',
        whyMentioned: parsed.whyMentioned || 'Unable to determine.',
        howToDifferentiate: parsed.howToDifferentiate || 'Unable to determine.',
      };
    } catch {
      analysis = {
        whoTheyAre: 'Unable to analyze this competitor.',
        whyMentioned: 'Unable to determine.',
        howToDifferentiate: 'Unable to determine.',
      };
    }

    // Cache the result
    try {
      await supabase
        .from('competitor_analysis_cache')
        .upsert({
          account_id: accountId,
          competitor_name: competitorName.toLowerCase(),
          who_they_are: analysis.whoTheyAre,
          why_mentioned: analysis.whyMentioned,
          how_to_differentiate: analysis.howToDifferentiate,
          domain: domain || null,
          analyzed_at: new Date().toISOString(),
        }, {
          onConflict: 'account_id,competitor_name',
        });
    } catch (cacheError) {
      console.warn('[analyze-competitor] Could not cache result:', cacheError);
    }

    return NextResponse.json({
      whoTheyAre: analysis.whoTheyAre,
      whyMentioned: analysis.whyMentioned,
      howToDifferentiate: analysis.howToDifferentiate,
      cached: false,
    });

  } catch (error) {
    console.error('[analyze-competitor] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitor' },
      { status: 500 }
    );
  }
}
