import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { applyRateLimit, createRateLimitResponse, RateLimits } from "@/app/(app)/api/middleware/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Apply persistent rate limiting (Supabase-backed)
  const rateLimitResult = await applyRateLimit(request, RateLimits.publicAi);
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
    // Create Supabase client for optional auth verification
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session (optional for public Prompt Pages)
    const { data: { user } } = await supabase.auth.getUser();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, keywords, user_id } = await request.json();

    // Security: If user_id is provided, verify it matches authenticated session
    if (user_id && user && user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: User ID mismatch" },
        { status: 403 },
      );
    }

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "No text provided for enhancement." },
        { status: 400 },
      );
    }

    // Build the system prompt
    let systemPrompt = `You are a helpful assistant that enhances customer reviews while preserving the reviewer's authentic voice and original meaning.

Your task is to make small improvements to grammar, readability, and flow. The enhanced review should:
- Fix any spelling or grammar errors
- Improve sentence structure for better readability
- Maintain the original tone and personality
- Keep the same level of formality
- Preserve all specific details and experiences mentioned
- Sound natural and conversational, not overly polished or marketing-like`;

    // Add keyword instructions if keywords are provided
    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      const keywordsToUse = keywords.slice(0, 2); // Use only first 2 keywords
      systemPrompt += `

Additionally, if it fits naturally within the context, try to incorporate one or two of these phrases: ${keywordsToUse.map(k => `"${k}"`).join(", ")}. Only include them if they genuinely fit the review's content - do not force them in awkwardly. It's better to skip them than to make the review sound unnatural.`;
    }

    systemPrompt += `

IMPORTANT: Return only the enhanced review text without any quotes, formatting, or additional commentary. The output must be ready to post directly.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please enhance this review while preserving the original voice and meaning:\n\n${text}`,
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.4, // Balanced between consistency and creativity
    });

    // Log token usage and cost to ai_usage table
    const usage = completion.usage;
    if (usage) {
      // Pricing for GPT-3.5 Turbo (as of June 2024)
      const inputPrice = 0.0005; // $ per 1K tokens
      const outputPrice = 0.0015; // $ per 1K tokens
      const cost =
        (usage.prompt_tokens / 1000) * inputPrice +
        (usage.completion_tokens / 1000) * outputPrice;

      // Insert into ai_usage table (using service role for database write)
      const serviceSupabase = createServiceRoleClient();

      // Use the authenticated user's ID if available, null for public visitors
      await serviceSupabase.from("ai_usage").insert({
        user_id: user?.id || null,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error enhancing review:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
