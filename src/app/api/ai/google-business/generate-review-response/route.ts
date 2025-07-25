/**
 * API endpoint for generating review responses
 * 
 * Generates brand-appropriate responses for Google Business Profile reviews
 * based on review content, rating, and business brand voice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { generateReviewResponse } from '@/utils/ai/google-business/reviewResponseGenerator';
import { extractBrandContext, AIBrandContext } from '@/utils/ai/google-business/googleBusinessProfileHelpers';

interface ReviewResponseRequest {
  reviewText: string;
  reviewRating: number;
  reviewerName?: string;
  businessContext?: AIBrandContext;
}

interface ReviewResponseResponse {
  success: boolean;
  response?: string;
  tone?: 'professional' | 'friendly' | 'apologetic';
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ReviewResponseResponse>> {
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
    const body: ReviewResponseRequest = await request.json();
    const { reviewText, reviewRating, reviewerName, businessContext } = body;

    // Validate required fields
    if (!reviewText || reviewText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review text is required' },
        { status: 400 }
      );
    }

    if (reviewText.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Review text must be 5000 characters or less' },
        { status: 400 }
      );
    }

    if (typeof reviewRating !== 'number' || reviewRating < 1 || reviewRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Review rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate reviewer name if provided
    if (reviewerName && reviewerName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Reviewer name must be 100 characters or less' },
        { status: 400 }
      );
    }

    let brandContext: AIBrandContext;

    // Use provided business context or fetch from database
    if (businessContext) {
      brandContext = businessContext;
    } else {
      // Get user's account ID
      const userAccountId = await getAccountIdForUser(user.id, supabase);
      if (!userAccountId) {
        return NextResponse.json(
          { success: false, error: 'No account found for user' },
          { status: 400 }
        );
      }

      // Fetch business profile data
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', userAccountId)
        .single();

      if (businessError || !business) {
        return NextResponse.json(
          { success: false, error: 'Business profile not found. Please complete your business profile first.' },
          { status: 400 }
        );
      }

      brandContext = extractBrandContext(business);
    }

    // Validate brand context has minimum required data
    if (!brandContext.businessName || brandContext.businessName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business name is required in your business profile' },
        { status: 400 }
      );
    }

    // Generate review response
    const result = await generateReviewResponse(
      reviewText.trim(),
      reviewRating,
      brandContext,
      reviewerName?.trim()
    );

    // Validate that response was generated
    if (!result.response || result.response.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate review response. Please try again.' },
        { status: 500 }
      );
    }

    // Log usage for analytics (optional)
    try {
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        feature: 'review_response_generation',
        input_data: { 
          reviewRating, 
          reviewLength: reviewText.length,
          businessName: brandContext.businessName,
          tone: result.tone 
        },
        created_at: new Date().toISOString(),
      });
    } catch (loggingError) {
      // Don't fail the request if logging fails
      console.error('Failed to log AI usage:', loggingError);
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      tone: result.tone
    });

  } catch (error) {
    console.error('Review response generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while generating review response' 
      },
      { status: 500 }
    );
  }
} 