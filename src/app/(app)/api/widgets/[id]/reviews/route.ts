/**
 * Widget Reviews API Route
 * Handles CRUD operations for widget_reviews table with proper authentication and RLS bypass
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { createServerClient } from '@supabase/ssr';

// 🔧 CONSOLIDATION: Use centralized service role client
const supabaseAdmin = createServiceRoleClient();

// Helper function to generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 🔧 CONSOLIDATION: Helper function for request-scoped auth client
// Used ONLY for authenticated dashboard requests (PUT operations)
function createAuthClient(authToken: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      },
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

/**
 * PUT /api/widgets/[id]/reviews
 * Updates reviews for a specific widget
 */
export async function PUT(
  request: NextRequest,
  context: any
) {
  // CSRF Protection - Check origin for widget review updates
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;
  
  try {
    const { id: widgetId } = await context.params;
    
    if (!widgetId) {
      return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
    }

    const body = await request.json();
    const { reviews } = body;
    
    console.log('[WIDGET-REVIEWS] PUT request received:', {
      widgetId,
      reviewCount: reviews?.length,
      bodyKeys: Object.keys(body)
    });

    if (!Array.isArray(reviews)) {
      return NextResponse.json({ error: 'Reviews must be an array' }, { status: 400 });
    }

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createAuthClient(token); // 🔧 CONSOLIDATED: Use request-scoped client
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      console.error('[WIDGET-REVIEWS] Account not found for user:', user.id);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    console.log('[WIDGET-REVIEWS] Verifying widget ownership:', {
      widgetId,
      accountId,
      userId: user.id
    });

    // Verify widget ownership using admin client
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('id, account_id')
      .eq('id', widgetId)
      .eq('account_id', accountId)
      .single();

    if (widgetError || !widget) {
      console.error('[WIDGET-REVIEWS] Widget access denied:', {
        widgetId,
        accountId,
        error: widgetError,
        widget,
        userId: user.id
      });
      
      // Provide more specific error message
      if (widgetError?.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Widget not found. It may have been deleted or does not belong to your current account.',
          details: 'Please refresh the page or switch to the correct account.'
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Access denied. This widget belongs to a different account.',
        details: 'Please switch to the correct account or select a different widget.'
      }, { status: 403 });
    }

    // First, let's check if the table exists and what columns it has
    console.log('[WIDGET-REVIEWS] Testing database connection...');
    
    // Try a simple select first
    const { data: testSelect, error: testError } = await supabaseAdmin
      .from('widget_reviews')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('[WIDGET-REVIEWS] Table access error:', {
        error: testError,
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      // Check if it's a table not found error
      if (testError.message?.includes('relation') && testError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database table widget_reviews does not exist',
          details: testError.message
        }, { status: 500 });
      }
    } else {
      console.log('[WIDGET-REVIEWS] Table exists, sample row:', testSelect?.[0]);
    }
    
    // Delete existing reviews for this widget
    console.log('[WIDGET-REVIEWS] Deleting existing reviews for widget:', widgetId);
    const { error: deleteError } = await supabaseAdmin
      .from('widget_reviews')
      .delete()
      .eq('widget_id', widgetId);

    if (deleteError) {
      console.error('[WIDGET-REVIEWS] Error deleting existing reviews:', {
        error: deleteError,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      return NextResponse.json({ 
        error: 'Failed to delete existing reviews',
        details: deleteError.message
      }, { status: 500 });
    }

    // Insert new reviews if any provided
    if (reviews.length > 0) {
      // First, try inserting a minimal test review to see what works
      console.log('[WIDGET-REVIEWS] Testing with minimal review first...');
      
      const testReview = {
        widget_id: widgetId,
        review_id: generateUUID(),
        review_content: 'Test',
        first_name: 'Test',
        last_name: 'User',
        order_index: 0
      };
      
      const { error: testError } = await supabaseAdmin
        .from('widget_reviews')
        .insert([testReview]);
        
      if (testError) {
        console.error('[WIDGET-REVIEWS] Test review failed:', {
          error: testError,
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        return NextResponse.json({ 
          error: 'Failed to insert test review - check column names',
          details: testError.message,
          hint: testError.hint
        }, { status: 500 });
      } else {
        console.log('[WIDGET-REVIEWS] Test review succeeded, proceeding with actual reviews');
        
        // Delete the test review
        await supabaseAdmin
          .from('widget_reviews')
          .delete()
          .eq('review_id', testReview.review_id);
      }
      
      const reviewsToInsert = reviews.map((review, index) => {
        // Convert star rating to support half-stars (database now accepts decimals)
        let finalRating = 5; // Default to 5
        if (typeof review.star_rating === 'number') {
          // Round to nearest 0.5 (e.g., 3.3 -> 3.5, 3.7 -> 3.5, 3.8 -> 4.0)
          finalRating = Math.round(review.star_rating * 2) / 2;
          // Ensure rating is within valid range (1.0 to 5.0)
          finalRating = Math.max(1, Math.min(5, finalRating));
        }
        
        console.log(`[API] Star Rating for ${review.review_id}:`, {
          received: review.star_rating,
          rounded: Math.round(review.star_rating * 2) / 2,
          final: finalRating
        });
        
        // Ensure review_id is a valid UUID
        // If the review already has a valid UUID, use it; otherwise generate one
        let reviewId = review.review_id;
        
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!reviewId || !uuidRegex.test(reviewId)) {
          // Generate a new UUID if invalid or missing
          reviewId = generateUUID();
        }
        
        const reviewToInsert: any = {
          widget_id: widgetId,
          review_id: reviewId,
          review_content: review.review_content || '',
          first_name: review.first_name || '',
          last_name: review.last_name || '',
          reviewer_role: review.reviewer_role || '',
          platform: review.platform || null,
          order_index: index,
          star_rating: finalRating,
          created_at: review.created_at || new Date().toISOString() // Use original date or current date as fallback
        };
        
        // Only add photo_url if it's provided (column might not exist)
        if (review.photo_url) {
          reviewToInsert.photo_url = review.photo_url;
        }
        
        console.log(`[WIDGET-REVIEWS] Review ${index} to insert:`, reviewToInsert);
        
        return reviewToInsert;
      });

      console.log('[WIDGET-REVIEWS] Attempting to insert reviews:', {
        count: reviewsToInsert.length,
        widgetId,
        sample: reviewsToInsert[0]
      });

      const { error: insertError } = await supabaseAdmin
        .from('widget_reviews')
        .insert(reviewsToInsert);

      if (insertError) {
        console.error('[WIDGET-REVIEWS] Error inserting reviews:', {
          error: insertError,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        return NextResponse.json({ 
          error: 'Failed to save reviews', 
          details: insertError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${reviews.length} reviews for widget` 
    });

  } catch (error: any) {
    console.error('[WIDGET-REVIEWS] Unexpected error:', {
      error,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/widgets/[id]/reviews
 * Fetches reviews for a specific widget
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  const { id: widgetId } = await context.params;
  
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
  }

  try {
    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createAuthClient(token); // 🔧 CONSOLIDATED: Use request-scoped client
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify widget ownership using admin client
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('id, account_id')
      .eq('id', widgetId)
      .eq('account_id', accountId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 403 });
    }

    // Fetch reviews for this widget
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('widget_reviews')
      .select('*')
      .eq('widget_id', widgetId)
      .order('order_index', { ascending: true });

    if (reviewsError) {
      console.error('[WIDGET-REVIEWS] Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json(reviews || []);

  } catch (error) {
    console.error('[WIDGET-REVIEWS] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 