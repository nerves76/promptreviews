import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { checkRateLimit, apiRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Stricter rate limiter for public AI endpoints: 10 requests per minute per IP
const publicAiRateLimiter = {
  limits: new Map<string, { count: number; resetTime: number }>(),
  windowMs: 60000,
  maxRequests: 10,
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.maxRequests) return false;
    entry.count++;
    return true;
  },
  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }
};

export async function POST(request: Request) {
  // Rate limit by IP address (public endpoint protection)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (!publicAiRateLimiter.isAllowed(ip)) {
    const remaining = publicAiRateLimiter.getRemainingRequests(ip);
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60'
        }
      }
    );
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

    const { text, user_id } = await request.json();

    // Security: If user_id is provided, verify it matches authenticated session
    if (user_id && user && user_id !== user.id) {
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
    console.error("Error fixing grammar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
} 