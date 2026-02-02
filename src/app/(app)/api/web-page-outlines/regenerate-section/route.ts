/**
 * POST /api/web-page-outlines/regenerate-section
 * Regenerate a single section of an existing outline (1 credit)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { withCredits } from '@/lib/credits/withCredits';
import { SECTION_REGEN_COST } from '@/features/web-page-outlines/services/credits';
import { buildSystemPrompt, buildSectionRegenerationPrompt } from '../generate/prompt';
import type {
  RegenerateSectionRequest,
  WebPageOutlineRecord,
  PageOutline,
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

    const body: RegenerateSectionRequest = await request.json();
    const { outlineId, sectionKey } = body;

    if (!outlineId || !sectionKey) {
      return NextResponse.json(
        { error: 'Missing required fields: outlineId, sectionKey' },
        { status: 400 }
      );
    }

    const validKeys = ['hero', 'intro', 'benefits', 'bodySections', 'cta', 'faq', 'footer'];
    if (!validKeys.includes(sectionKey)) {
      return NextResponse.json(
        { error: `Invalid sectionKey. Must be one of: ${validKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch the existing outline (account ownership check)
    const { data: existingOutline, error: fetchError } = await supabase
      .from('web_page_outlines')
      .select('*')
      .eq('id', outlineId)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !existingOutline) {
      return NextResponse.json(
        { error: 'Outline not found or does not belong to this account' },
        { status: 404 }
      );
    }

    const record = existingOutline as WebPageOutlineRecord;
    const idempotencyKey = `web-outline-regen-${outlineId}-${sectionKey}-${Date.now()}`;

    const result = await withCredits({
      supabase,
      accountId,
      userId: user.id,
      featureType: 'web_page_outline',
      creditCost: SECTION_REGEN_COST,
      idempotencyKey,
      description: `Regenerate ${sectionKey}: ${record.keyword_phrase}`,
      featureMetadata: { outlineId, sectionKey },
      operation: async () => {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = buildSectionRegenerationPrompt(
          sectionKey,
          record.keyword_phrase,
          record.tone,
          record.business_info
        );

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: buildSystemPrompt(record.tone) },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from AI model');
        }

        const parsed = JSON.parse(content);

        // The AI may return the section data directly or wrapped
        const sectionData = parsed[sectionKey] ?? parsed;

        // Log AI usage
        const usage = completion.usage;
        if (usage) {
          const inputPrice = 0.0025;
          const outputPrice = 0.01;
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

        // Update the outline in the database
        const updatedOutline: PageOutline = {
          ...(record.outline_json as unknown as PageOutline),
          [sectionKey]: sectionData,
        };

        const serviceSupabase = createServiceRoleClient();
        const { error: updateError } = await serviceSupabase
          .from('web_page_outlines')
          .update({ outline_json: updatedOutline as unknown as Record<string, unknown> })
          .eq('id', outlineId);

        if (updateError) {
          console.error('[web-page-outlines] Update error:', updateError);
          throw new Error('Failed to update outline');
        }

        return { sectionKey, sectionData };
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
      sectionKey: result.data?.sectionKey,
      sectionData: result.data?.sectionData,
      creditsDebited: result.creditsDebited,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    console.error('[web-page-outlines/regenerate-section] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
