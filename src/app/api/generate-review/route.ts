import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    const { prompt } = await request.json();

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

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 