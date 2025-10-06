import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getAccountIdForUser } from '@/auth/utils/accounts';
import OpenAI from 'openai';

interface ImprovementRequest {
  currentContent: string;
  businessLocations: string[];
  ctaType?: string | null;
  ctaUrl?: string | null;
  imageCount?: number;
}

// Create OpenAI client inside request handler to avoid build-time env var access
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const AI_IMPROVEMENT_PROMPT = `You are a senior local SEO and copywriting expert writing Google Business Profile posts that improve local visibility and engagement.

Write a GBP post that:
• Clearly promotes a product, service, event, update, or offer
• Includes local keywords (e.g., city name, neighborhood, or service area)
• Speaks directly to the customer with a helpful, friendly tone
• Contains a strong call to action (e.g., "Call now," "Stop by today," "See our menu")
• Uses natural-sounding sentences, not overly promotional
• Is under 1,500 characters (Google's limit)
• Can include 1–2 relevant hashtags

Optional details to include:
• Service or product name
• Special offer or seasonal detail
• Hours or location-specific information
• Customer benefit or differentiator

Return ONLY the improved post content, nothing else.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ImprovementRequest = await request.json();
    const { currentContent, businessLocations, ctaType, ctaUrl, imageCount } = body;

    if (!currentContent?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Current content is required' 
      }, { status: 400 });
    }

    if (!businessLocations?.length) {
      return NextResponse.json({ 
        success: false, 
        message: 'Business locations are required for context' 
      }, { status: 400 });
    }

    // Get user's account ID
    const userAccountId = await getAccountIdForUser(user.id, supabase);
    if (!userAccountId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No account found for user' 
      }, { status: 400 });
    }

    // Get business data for context
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, description, website_url, phone_number, city')
      .eq('account_id', userAccountId)
      .single();

    if (businessError) {
      console.error('Error fetching business data:', businessError);
    }

    // Build context for AI improvement
    let contextPrompt = `${AI_IMPROVEMENT_PROMPT}\n\nCurrent post content:\n"${currentContent}"\n\nPosting to location(s): ${businessLocations.join(', ')}`;
    
    if (business) {
      contextPrompt += `\nBusiness info:`;
      contextPrompt += `\n- Name: ${business.name || 'Not specified'}`;
      contextPrompt += `\n- Location: ${business.city || 'Not specified'}`;
      contextPrompt += `\n- Website: ${business.website_url || 'Not specified'}`;
      contextPrompt += `\n- Phone: ${business.phone_number || 'Not specified'}`;
      if (business.description) {
        contextPrompt += `\n- Description: ${business.description}`;
      }
    }

    if (ctaType && ctaUrl) {
      contextPrompt += `\n- Preferred CTA type: ${ctaType.replace('_', ' ')}`;
      contextPrompt += `\n- CTA URL: ${ctaUrl}`;
    }

    if (imageCount && imageCount > 0) {
      contextPrompt += `\n- Will include ${imageCount} image${imageCount > 1 ? 's' : ''}`;
    }

    contextPrompt += `\n\nImprove the current post content to be more engaging, locally optimized, and effective for Google Business Profile. Keep the improved content under 1,500 characters.`;

    // Call OpenAI API
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: contextPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const improvedContent = completion.choices[0]?.message?.content?.trim();

    if (!improvedContent) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to generate improved content' 
      }, { status: 500 });
    }

    // Ensure content is under 1500 characters
    const finalContent = improvedContent.length > 1500 
      ? improvedContent.substring(0, 1497) + '...'
      : improvedContent;

    return NextResponse.json({ 
      success: true, 
      improvedContent: finalContent 
    });

  } catch (error) {
    console.error('Error improving post with AI:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to improve post. Please try again.' 
    }, { status: 500 });
  }
} 