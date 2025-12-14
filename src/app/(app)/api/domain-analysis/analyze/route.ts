import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  debit,
  refundFeature,
  ensureBalanceExists,
  getBalance,
  InsufficientCreditsError,
} from '@/lib/credits';
import {
  analyzeDomain,
  normalizeDomain,
  isValidDomain,
} from '@/features/domain-analysis/api/dataforseo-domain-client';
import { DOMAIN_ANALYSIS_CREDIT_COST, DomainAnalysisResult, DomainAIInsights } from '@/features/domain-analysis/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI insights from domain analysis data
 */
async function generateAIInsights(data: DomainAnalysisResult): Promise<DomainAIInsights | null> {
  try {
    // Build context about the domain
    const techList = data.technologies
      ? Object.entries(data.technologies)
          .flatMap(([cat, subcats]) =>
            Object.entries(subcats).flatMap(([subcat, techs]) =>
              techs.map((t) => `${t.name}${t.version ? ` (${t.version})` : ''}`)
            )
          )
          .slice(0, 30)
          .join(', ')
      : 'Unknown';

    const positionSummary = data.organicPositions
      ? `Top 3: ${data.organicPositions.pos_1 + data.organicPositions.pos_2_3}, Top 10: ${data.organicPositions.pos_1 + data.organicPositions.pos_2_3 + data.organicPositions.pos_4_10}, Top 20: ${data.organicPositions.pos_1 + data.organicPositions.pos_2_3 + data.organicPositions.pos_4_10 + data.organicPositions.pos_11_20}`
      : 'N/A';

    const prompt = `Analyze this domain and provide competitive insights:

DOMAIN: ${data.domain}
TITLE: ${data.title || 'N/A'}
DESCRIPTION: ${data.description || 'N/A'}

SEO METRICS:
- Domain Rank: ${data.domainRank?.toLocaleString() || 'N/A'}
- Est. Monthly Organic Traffic: ${data.organicEtv ? Math.round(data.organicEtv).toLocaleString() : 'N/A'}
- Traffic Value: ${data.estimatedPaidTrafficCost ? `$${Math.round(data.estimatedPaidTrafficCost).toLocaleString()}/mo` : 'N/A'}
- Total Organic Keywords: ${data.organicCount?.toLocaleString() || 'N/A'}
- Keyword Position Distribution: ${positionSummary}

BACKLINKS:
- Referring Domains: ${data.referringDomains?.toLocaleString() || 'N/A'}
- Total Backlinks: ${data.backlinks?.toLocaleString() || 'N/A'}
- Dofollow: ${data.dofollow?.toLocaleString() || 'N/A'}

DOMAIN INFO:
- Created: ${data.createdDatetime || 'N/A'}
- Registrar: ${data.registrar || 'N/A'}
- Country: ${data.countryIsoCode || 'N/A'}

TECHNOLOGY STACK:
${techList}

Provide a JSON response with this exact structure:
{
  "summary": "2-3 sentence executive summary of the domain's online presence",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "techStackAnalysis": "1-2 sentences analyzing their technology choices",
  "seoAssessment": "1-2 sentences assessing their SEO performance",
  "competitivePosition": "1-2 sentences on their competitive positioning",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Be specific and actionable. Reference actual metrics where possible.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO analyst and competitive intelligence specialist. Provide concise, actionable insights based on domain analysis data. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[DomainAnalysis] No AI response content');
      return null;
    }

    const insights = JSON.parse(content) as DomainAIInsights;
    console.log('[DomainAnalysis] AI insights generated successfully');
    return insights;
  } catch (error) {
    console.error('[DomainAnalysis] AI insights generation failed:', error);
    return null;
  }
}

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/domain-analysis/analyze
 * Run domain analysis using DataForSEO APIs
 *
 * Body:
 * - domain: string - Domain to analyze (e.g., "example.com")
 *
 * Cost: 3 credits per analysis
 *
 * Returns technology stack, whois data, and SEO metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Account isolation
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse request body
    let domain: string;
    let includeAiInsights = true;
    try {
      const body = await request.json();
      domain = body.domain;
      includeAiInsights = body.includeAiInsights !== false; // Default to true
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate domain
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const normalizedDomain = normalizeDomain(domain);
    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Please enter a valid domain (e.g., example.com)' },
        { status: 400 }
      );
    }

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check credits
    const balance = await getBalance(serviceSupabase, accountId);
    const creditCost = DOMAIN_ANALYSIS_CREDIT_COST;

    if (balance.totalCredits < creditCost) {
      console.log(`[DomainAnalysis] Insufficient credits for account ${accountId}: need ${creditCost}, have ${balance.totalCredits}`);
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: `Domain analysis requires ${creditCost} credits. You have ${balance.totalCredits} credits available.`,
          required: creditCost,
          available: balance.totalCredits,
          balance: {
            included: balance.includedCredits,
            purchased: balance.purchasedCredits,
            total: balance.totalCredits,
          },
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const analysisId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `domain_analysis:${accountId}:${analysisId}`;

    // Debit credits before running analysis
    console.log(`[DomainAnalysis] Debiting ${creditCost} credits for account ${accountId} (domain: ${normalizedDomain})`);
    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'domain_analysis',
        featureMetadata: {
          domain: normalizedDomain,
          analysisId,
        },
        idempotencyKey,
        description: `Domain analysis: ${normalizedDomain}`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: `Domain analysis requires ${error.required} credits. You have ${error.available} credits available.`,
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }

    // Run domain analysis
    let result;
    try {
      result = await analyzeDomain(normalizedDomain);
    } catch (error) {
      // Refund credits on failure
      console.error(`[DomainAnalysis] Analysis failed, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'domain_analysis',
        featureMetadata: { domain: normalizedDomain, reason: 'api_failure', error: String(error) },
        description: 'Refund: Domain analysis failed',
      });
      throw error;
    }

    if (!result.success) {
      // Refund credits on API failure
      console.error(`[DomainAnalysis] Analysis failed: ${result.error}, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'domain_analysis',
        featureMetadata: { domain: normalizedDomain, reason: 'api_error', error: result.error },
        description: 'Refund: Domain analysis failed',
      });

      return NextResponse.json(
        { error: result.error || 'Domain analysis failed' },
        { status: 500 }
      );
    }

    // Track API cost in ai_usage table
    if (result.result?.totalCost && result.result.totalCost > 0) {
      await serviceSupabase.from('ai_usage').insert({
        account_id: accountId,
        feature_type: 'domain_analysis',
        cost_usd: result.result.totalCost,
        created_at: new Date().toISOString(),
      });
    }

    // Generate AI insights if requested
    let finalResult = result.result;
    if (includeAiInsights && finalResult) {
      console.log('[DomainAnalysis] Generating AI insights...');
      const aiInsights = await generateAIInsights(finalResult);
      if (aiInsights) {
        finalResult = { ...finalResult, aiInsights };
      }
    }

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      result: finalResult,
      creditsUsed: creditCost,
      creditsRemaining: updatedBalance.totalCredits,
    });
  } catch (error) {
    console.error('[DomainAnalysis] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
