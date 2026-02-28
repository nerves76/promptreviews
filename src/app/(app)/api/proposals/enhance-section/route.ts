import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { applyRateLimit, createRateLimitResponse, RateLimits } from "@/app/(app)/api/middleware/rate-limit";
import { handleApiError } from "@/app/(app)/api/utils/errorResponse";
import { validateRequiredString } from "@/app/(app)/api/utils/validation";

export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 10000;

export async function POST(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request, RateLimits.ai);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    const { sectionTitle, sectionBody } = await request.json();

    const titleError = validateRequiredString(sectionTitle, "Section title", MAX_TITLE_LENGTH);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const bodyError = validateRequiredString(sectionBody, "Section body", MAX_BODY_LENGTH);
    if (bodyError) {
      return NextResponse.json({ error: bodyError }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert contract writer. Enhance the provided contract section text to be professional and legally precise.

Guidelines:
- Write as a lawyer would — clear, precise, enforceable
- Not verbose — no unnecessary legalese or filler
- Preserve the original intent and all specific details (names, dates, amounts, deliverables)
- Use standard contract language conventions
- Improve structure with numbered clauses or bullet points where appropriate
- Fix grammar, spelling, and punctuation
- Maintain a professional but readable tone

IMPORTANT: Return only the enhanced section text. Do not include the section title, quotes, formatting markers, or commentary.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Section title: "${sectionTitle}"\n\nSection content to enhance:\n\n${sectionBody}`,
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.4,
    });

    // Log AI usage
    const usage = completion.usage;
    if (usage) {
      const inputPrice = 0.0005; // $ per 1K tokens
      const outputPrice = 0.0015; // $ per 1K tokens
      const cost =
        (usage.prompt_tokens / 1000) * inputPrice +
        (usage.completion_tokens / 1000) * outputPrice;

      const serviceSupabase = createServiceRoleClient();
      await serviceSupabase.from("ai_usage").insert({
        user_id: user.id,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error: unknown) {
    return handleApiError(error, "enhance-section");
  }
}
