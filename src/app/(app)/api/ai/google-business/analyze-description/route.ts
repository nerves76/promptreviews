/**
 * AI Business Description Analyzer
 * 
 * Uses OpenAI to provide expert SEO analysis and recommendations
 * specialized for AI search engines and semantic embeddings.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getAccountIdForUser } from '@/auth/utils/accounts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisRequest {
  description: string;
  businessContext?: {
    businessName?: string;
    businessType?: string;
    location?: string;
    services?: string[];
    industry?: string;
  };
}

interface AnalysisResponse {
  success: boolean;
  analysis?: {
    seoScore: number;
    improvements: string[];
    keywordSuggestions: string[];
    optimizedDescription: string;
    semanticAnalysis: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: AnalysisRequest = await request.json();
    const { description, businessContext } = body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business description is required' },
        { status: 400 }
      );
    }

    if (description.length > 700) {
      return NextResponse.json(
        { success: false, error: 'Description must be 700 characters or less (optimal length)' },
        { status: 400 }
      );
    }

    // Build context for AI analysis
    let contextInfo = '';
    if (businessContext) {
      if (businessContext.businessName) contextInfo += `Business: ${businessContext.businessName}\n`;
      if (businessContext.businessType) contextInfo += `Type: ${businessContext.businessType}\n`;
      if (businessContext.location) contextInfo += `Location: ${businessContext.location}\n`;
      if (businessContext.industry) contextInfo += `Industry: ${businessContext.industry}\n`;
      if (businessContext.services && businessContext.services.length > 0) {
        contextInfo += `Services: ${businessContext.services.join(', ')}\n`;
      }
    }

    // Create expert AI prompt for analysis
    const systemPrompt = `You are a seasoned SEO expert specializing in AI search engine optimization and semantic embeddings. You understand how modern AI engines like ChatGPT, Claude, Perplexity, and Google's AI systems interpret and rank content.

Your expertise includes:
- Semantic search optimization and vector embeddings
- Entity recognition and contextual understanding
- Intent matching for conversational AI queries
- Local SEO for AI-powered search platforms
- Content optimization for AI comprehension

Analyze the following business description and provide specific, actionable recommendations. Focus on optimization for AI search engines, semantic understanding, and modern search patterns.

${contextInfo ? `Business Context:\n${contextInfo}\n` : ''}

Business Description to Analyze:
"${description}"

Provide your analysis in the following JSON format:
{
  "seoScore": <number between 1-10>,
  "improvements": [<array of specific, actionable improvement suggestions>],
  "keywordSuggestions": [<array of 6-8 strategic local SEO keywords optimized for AI search>],
  "optimizedDescription": "<your optimized version of the description>",
  "semanticAnalysis": "<brief explanation of semantic strengths and areas for improvement>"
}

Focus on:
- Semantic richness and AI comprehension
- Entity recognition optimization  
- Problem-solution matching for user intent
- Conversational query optimization
- Local SEO for AI search platforms
- Geographic context for location embeddings
- Action-oriented language for conversion optimization

IMPORTANT: Aim for 400-700 characters for optimal impact and readability. This length provides comprehensive information while maintaining user engagement. Include multiple keywords, strong calls-to-action, and comprehensive details within this range for best results.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent, analytical responses
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate analysis' 
      }, { status: 500 });
    }

              // Parse the JSON response (handle markdown code blocks)
          let analysis;
          try {
            // Remove markdown code blocks if present
            let cleanResponse = aiResponse.trim();
            
            // More robust markdown removal
            if (cleanResponse.includes('```json')) {
              // Extract content between ```json and ```
              const match = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
              if (match) {
                cleanResponse = match[1].trim();
              } else {
                // Fallback: remove ```json from start and ``` from end
                cleanResponse = cleanResponse.replace(/^```json\s*/m, '').replace(/\s*```\s*$/m, '');
              }
            } else if (cleanResponse.includes('```')) {
              // Extract content between ``` and ```
              const match = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
              if (match) {
                cleanResponse = match[1].trim();
              } else {
                // Fallback: remove ``` from start and end
                cleanResponse = cleanResponse.replace(/^```\s*/m, '').replace(/\s*```\s*$/m, '');
              }
            }
            
            cleanResponse = cleanResponse.trim();
            analysis = JSON.parse(cleanResponse);
          } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            return NextResponse.json({ 
              success: false, 
              error: 'Failed to parse AI analysis' 
            }, { status: 500 });
          }

    // Validate the response structure
    if (!analysis.seoScore || !analysis.improvements || !analysis.keywordSuggestions || !analysis.optimizedDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid analysis format received' 
      }, { status: 500 });
    }

    // Log usage for analytics
    try {
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        feature: 'business_description_analysis',
        input_data: { 
          descriptionLength: description.length,
          hasBusinessContext: !!businessContext,
          seoScore: analysis.seoScore
        },
        created_at: new Date().toISOString(),
      });
    } catch (loggingError) {
      console.error('Failed to log AI usage:', loggingError);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        seoScore: Math.max(1, Math.min(10, analysis.seoScore)), // Ensure score is 1-10
        improvements: analysis.improvements.slice(0, 8), // Limit to 8 improvements
        keywordSuggestions: analysis.keywordSuggestions.slice(0, 8), // Limit to 8 keywords
        optimizedDescription: analysis.optimizedDescription.substring(0, 700), // Optimal length limit
        semanticAnalysis: analysis.semanticAnalysis || 'AI analysis completed successfully.'
      }
    });

  } catch (error) {
    console.error('Business description analysis error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred during analysis' 
      },
      { status: 500 }
    );
  }
} 