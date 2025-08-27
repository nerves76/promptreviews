/**
 * API Route: GET /api/business-information/categories
 * Fetches Google Business Categories for category selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Business categories API called');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication error:', authError?.message || 'No user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        categories: []
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get Google Business Profile tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ No Google tokens found:', tokenError?.message);
      return NextResponse.json({
        error: 'Google Business Profile not connected',
        categories: []
      }, { status: 401 });
    }

    // Create Google Business Profile client
    const gbpClient = new GoogleBusinessProfileClient({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : Date.now() + 3600000
    });

    try {
      // Fetch categories from Google Business Profile API
      console.log('🔍 Fetching business categories from Google...');
      const categories = await gbpClient.listCategories();
      
      // Filter categories based on search term
      let filteredCategories = categories;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredCategories = categories.filter(category => 
          category.displayName.toLowerCase().includes(searchLower) ||
          category.categoryId.toLowerCase().includes(searchLower)
        );
      }
      
      // Limit results
      const limitedCategories = filteredCategories.slice(0, limit);
      
      console.log(`✅ Returning ${limitedCategories.length} categories (filtered from ${categories.length} total)`);
      
      return NextResponse.json({
        success: true,
        categories: limitedCategories,
        total: categories.length,
        filtered: filteredCategories.length
      });

    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      
      // Check if it's a rate limit error
      if (error instanceof Error && 
          (error.message.includes('429') || 
           error.message.includes('rate limit') ||
           error.message.includes('Quota exceeded'))) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Google Business Profile API rate limit reached. Please wait and try again.',
          categories: []
        }, { status: 429 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        categories: []
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Categories API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      categories: []
    }, { status: 500 });
  }
} 