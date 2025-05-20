import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is missing from environment variables.' },
      { status: 500 }
    );
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const { prompt, user_id } = await request.json();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates authentic, positive reviews for businesses. The reviews should be specific, highlight the business's strengths, and sound natural."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
    });

    // Log token usage and cost to ai_usage table
    const usage = completion.usage;
    if (usage) {
      // Pricing for GPT-3.5 Turbo (as of June 2024)
      const inputPrice = 0.0005; // $ per 1K tokens
      const outputPrice = 0.0015; // $ per 1K tokens
      const cost = (usage.prompt_tokens / 1000) * inputPrice + (usage.completion_tokens / 1000) * outputPrice;

      // Insert into ai_usage table
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from('ai_usage').insert({
        user_id: user_id || null,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: cost,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 