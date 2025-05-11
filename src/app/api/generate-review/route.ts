import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const { prompt, wordCountLimit } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: Math.floor((wordCountLimit || 200) * 1.5),
    });

    const review = completion.choices[0]?.message?.content;
    if (!review) {
      return NextResponse.json({ error: 'No review generated' }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
  }
} 