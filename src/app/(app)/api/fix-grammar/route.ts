import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  try {
    // Create Supabase client for auth verification using proper SSR patterns
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Grammar fix API: Authentication failed', { error: authError?.message });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const { text, user_id } = await request.json();

    // Security: Verify user_id matches authenticated session
    if (user_id && user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: User ID mismatch" },
        { status: 403 },
      );
    }

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "No text provided for grammar correction." },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that improves grammar and writing quality while preserving the original meaning and tone. Fix grammar, punctuation, and sentence structure errors. Keep the same level of formality and style as the original text. Only make necessary corrections - if the text is already grammatically correct, return it unchanged. IMPORTANT: Return only the corrected text without any quotes, formatting, or additional text.",
        },
        {
          role: "user",
          content: `Please fix the grammar and improve the writing quality of this text while preserving the original meaning and tone. Return only the corrected text without quotes:\n\n${text}`,
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.3, // Lower temperature for more consistent grammar corrections
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
      
      // Use the authenticated user's ID (verified above)
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
  } catch (error) {
    console.error("Error fixing grammar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
} 