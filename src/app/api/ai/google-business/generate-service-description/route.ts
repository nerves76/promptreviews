/**
 * API endpoint for generating service descriptions
 * 
 * Generates SEO-optimized service descriptions in 3 lengths (short, medium, long)
 * for Google Business Profile optimization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getAccountIdForUser } from '@/auth/utils/accounts';
import { generateServiceDescriptions } from '@/utils/ai/google-business/serviceDescriptionGenerator';
import { extractBrandContext, AIBrandContext } from '@/utils/ai/google-business/googleBusinessProfileHelpers';

interface ServiceDescriptionRequest {
  serviceName: string;
  businessContext?: {
    businessName?: string;
    address?: string;
    city?: string;
    primaryCategory?: string;
    description?: string;
  };
}

interface ServiceDescriptionResponse {
  success: boolean;
  descriptions?: {
    short: string;
    medium: string;
    long: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ServiceDescriptionResponse>> {
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
    const body: ServiceDescriptionRequest = await request.json();
    const { serviceName, businessContext } = body;

    // Validate required fields
    if (!serviceName || serviceName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }

    if (serviceName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Service name must be 100 characters or less' },
        { status: 400 }
      );
    }

    let brandContext: AIBrandContext;

    // Use provided Google Business Profile context when available
    if (businessContext && businessContext.businessName) {
      // Convert Google Business Profile context to AIBrandContext format
      brandContext = {
        businessName: businessContext.businessName,
        city: businessContext.city || '',
        industry: businessContext.primaryCategory ? [businessContext.primaryCategory] : []
      };
      console.log('✅ Using Google Business Profile context:', brandContext);
    } else {
      // Fall back to database business profile
      console.log('⚠️ No Google Business Profile context provided, fetching from database...');
      
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
      console.log('📋 Using database business context:', brandContext);
    }

    // Validate brand context has minimum required data
    if (!brandContext.businessName || brandContext.businessName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business name is required in your business profile' },
        { status: 400 }
      );
    }

    // Generate service descriptions
    const descriptions = await generateServiceDescriptions(serviceName.trim(), brandContext);

    // Validate that descriptions were generated
    if (!descriptions.short && !descriptions.medium && !descriptions.long) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate service descriptions. Please try again.' },
        { status: 500 }
      );
    }

    // Log usage for analytics (optional)
    try {
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        feature: 'service_description_generation',
        input_data: { 
          serviceName, 
          businessName: brandContext.businessName,
          contextSource: businessContext && businessContext.businessName ? 'google_business_profile' : 'database'
        },
        created_at: new Date().toISOString(),
      });
    } catch (loggingError) {
      // Don't fail the request if logging fails
      console.error('Failed to log AI usage:', loggingError);
    }

    return NextResponse.json({
      success: true,
      descriptions
    });

  } catch (error) {
    console.error('Service description generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while generating service descriptions' 
      },
      { status: 500 }
    );
  }
} 