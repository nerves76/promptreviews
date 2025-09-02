/**
 * AI Keyword Integration API Route
 * 
 * Takes a business description and selected keywords, then uses AI to 
 * rewrite the description to naturally integrate the selected keywords
 * while maintaining readability and authenticity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 AI Keyword Integration API called');

    // Check authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentDescription, keywords, businessContext } = body;

    // Validate required fields
    if (!currentDescription?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Current description is required' },
        { status: 400 }
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    console.log('📝 Integrating keywords:', keywords);
    console.log('📄 Current description:', currentDescription.substring(0, 100) + '...');

    // Create AI prompt for keyword integration
    const systemPrompt = `You are an expert copywriter specializing in Google Business Profile optimization. Your task is to rewrite business descriptions to naturally integrate specific keywords while maintaining authenticity and readability.

GUIDELINES:
1. Preserve the core message and personality of the original description
2. Integrate keywords naturally - avoid keyword stuffing
3. Maintain professional, engaging tone
4. Keep the description length similar to the original (ideal: 250-750 characters)
5. Ensure the result sounds authentic, not robotic or forced
6. Prioritize readability and customer appeal over keyword density
7. Use variations of keywords when appropriate (e.g., "roofing" and "roof repair")

BUSINESS CONTEXT: ${businessContext ? JSON.stringify(businessContext) : 'Not provided'}

SELECTED KEYWORDS TO INTEGRATE: ${keywords.join(', ')}

ORIGINAL DESCRIPTION: "${currentDescription}"

Please rewrite this description to naturally integrate the selected keywords while maintaining its authenticity and appeal to potential customers.`;

    const userPrompt = `Please rewrite the business description to naturally integrate these keywords: ${keywords.join(', ')}

Original description: "${currentDescription}"

Requirements:
- Keep the same friendly, professional tone
- Integrate keywords naturally (avoid keyword stuffing)  
- Maintain readability and customer appeal
- Keep length similar to original
- Make it sound authentic, not robotic

Return only the rewritten description.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error('AI keyword integration failed');
    }

    const aiData = await openaiResponse.json();
    const optimizedDescription = aiData.choices[0]?.message?.content?.trim();

    if (!optimizedDescription) {
      throw new Error('No optimized description returned from AI');
    }

    console.log('✅ Keyword integration successful');
    console.log('📊 Result length:', optimizedDescription.length);

    return NextResponse.json({
      success: true,
      optimizedDescription,
      originalLength: currentDescription.length,
      newLength: optimizedDescription.length,
      integratedKeywords: keywords
    });

  } catch (error: any) {
    console.error('❌ Keyword integration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to integrate keywords'
      },
      { status: 500 }
    );
  }
}