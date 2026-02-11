/**
 * POST /api/web-page-outlines/generate
 * Generate a full web page outline (5 credits)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { withCredits } from '@/lib/credits/withCredits';
import { FULL_GENERATION_COST, MAX_OUTLINES_PER_ACCOUNT } from '@/features/web-page-outlines/services/credits';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import {
  fetchTopCompetitors,
  scrapeCompetitorPages,
  buildCompetitorContext,
} from '@/features/web-page-outlines/services/competitorAnalysis';
import type {
  GenerateOutlineRequest,
  OutlineGenerationResult,
  CompetitorUrl,
} from '@/features/web-page-outlines/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body: GenerateOutlineRequest = await request.json();
    const { keywordId, keywordPhrase, tone, pagePurpose, businessInfo } = body;

    if (!keywordPhrase || !tone || !pagePurpose || !businessInfo?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: keywordPhrase, tone, pagePurpose, businessInfo.name' },
        { status: 400 }
      );
    }

    // If a keywordId is provided, verify it belongs to this account
    if (keywordId) {
      const { data: keyword } = await supabase
        .from('keywords')
        .select('id')
        .eq('id', keywordId)
        .eq('account_id', accountId)
        .single();

      if (!keyword) {
        return NextResponse.json(
          { error: 'Keyword not found or does not belong to this account' },
          { status: 404 }
        );
      }
    }

    // Check outline count cap
    const { count: outlineCount } = await supabase
      .from('web_page_outlines')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (outlineCount !== null && outlineCount >= MAX_OUTLINES_PER_ACCOUNT) {
      return NextResponse.json(
        { error: `You've reached the limit of ${MAX_OUTLINES_PER_ACCOUNT} outlines. Please delete some from your library before creating new ones.` },
        { status: 400 }
      );
    }

    // --- Competitor Analysis (enhancement only, never blocks generation) ---
    let competitorContext = '';
    let competitorUrlData: CompetitorUrl[] = [];
    try {
      const userDomain = businessInfo.website || undefined;
      const topUrls = await fetchTopCompetitors(keywordPhrase, userDomain);
      if (topUrls.length > 0) {
        const scraped = await scrapeCompetitorPages(topUrls);
        competitorContext = buildCompetitorContext(keywordPhrase, scraped);

        // Extract URL data for frontend display
        competitorUrlData = scraped
          .filter((c): c is Extract<typeof c, { scraped: true }> => c.scraped)
          .map((c) => ({ url: c.url, title: c.title, wordCount: c.estimatedWordCount }));

        if (competitorContext) {
          console.log(`[web-page-outlines] Competitor context built (${competitorContext.length} chars)`);
        }
      }
    } catch (error) {
      console.warn('[web-page-outlines] Competitor analysis failed, continuing without it:', error);
    }

    const idempotencyKey = `web-outline-gen-${accountId}-${Date.now()}`;

    const result = await withCredits({
      supabase,
      accountId,
      userId: user.id,
      featureType: 'web_page_outline',
      creditCost: FULL_GENERATION_COST,
      idempotencyKey,
      description: `Web page outline: ${keywordPhrase}`,
      featureMetadata: { keywordPhrase, tone, pagePurpose },
      operation: async () => {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: buildSystemPrompt(tone, pagePurpose) },
            { role: 'user', content: buildUserPrompt(keywordPhrase, businessInfo, pagePurpose, competitorContext || undefined) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 4000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from AI model');
        }

        const parsed: OutlineGenerationResult = JSON.parse(content);

        // Log AI usage
        const usage = completion.usage;
        if (usage) {
          const inputPrice = 0.0025; // GPT-4o input per 1K tokens
          const outputPrice = 0.01; // GPT-4o output per 1K tokens
          const cost =
            (usage.prompt_tokens / 1000) * inputPrice +
            (usage.completion_tokens / 1000) * outputPrice;

          const serviceSupabase = createServiceRoleClient();
          await serviceSupabase.from('ai_usage').insert({
            user_id: user.id,
            account_id: accountId,
            feature_type: 'web_page_outline',
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            cost_usd: cost,
            created_at: new Date().toISOString(),
          });
        }

        // Save to database
        const serviceSupabase = createServiceRoleClient();
        const { data: saved, error: saveError } = await serviceSupabase
          .from('web_page_outlines')
          .insert({
            account_id: accountId,
            user_id: user.id,
            keyword_id: keywordId || null,
            keyword_phrase: keywordPhrase,
            tone,
            page_purpose: pagePurpose,
            business_name: businessInfo.name,
            business_info: businessInfo,
            outline_json: parsed.outline,
            schema_markup: parsed.seo,
            page_title: parsed.seo?.pageTitle || null,
            meta_description: parsed.seo?.metaDescription || null,
            credit_cost: FULL_GENERATION_COST,
          })
          .select()
          .single();

        if (saveError) {
          console.error('[web-page-outlines] Save error:', saveError);
          throw new Error('Failed to save outline');
        }

        return saved;
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.errorCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outline: result.data,
      creditsDebited: result.creditsDebited,
      creditsRemaining: result.creditsRemaining,
      ...(competitorUrlData.length > 0 && { competitorUrls: competitorUrlData }),
    });
  } catch (error) {
    console.error('[web-page-outlines/generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
