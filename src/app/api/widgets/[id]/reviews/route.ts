/**
 * Widget Reviews API Route
 * Handles CRUD operations for widget_reviews table with proper authentication and RLS bypass
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getAccountIdForUser } from '@/auth/utils/accounts';
import { createServerClient } from '@supabase/ssr';

// 🔧 CONSOLIDATION: Use centralized service role client
const supabaseAdmin = createServiceRoleClient();

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

    // Get account ID for the user
    const accountId = await getAccountIdForUser(user.id, supabase);
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
      const reviewsToInsert = reviews.map((review, index) => {
        const finalRating = typeof review.star_rating === 'number' 
          ? Math.round(review.star_rating * 2) / 2 
          : null;
        
        console.log(`[API] Star Rating for ${review.review_id}:`, {
          received: review.star_rating,
          final: finalRating
        });
        
        // Ensure review_id is valid
        const reviewId = review.review_id || `review_${widgetId}_${index}_${Date.now()}`;
        
        return {
          widget_id: widgetId,
          review_id: reviewId,
          review_content: review.review_content || '',
          first_name: review.first_name || '',
          last_name: review.last_name || '',
          reviewer_role: review.reviewer_role || '',
          platform: review.platform || 'custom',
          order_index: index,
          star_rating: finalRating,
          photo_url: review.photo_url || null,
          created_at: new Date().toISOString()
        };
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

    // Get account ID for the user
    const accountId = await getAccountIdForUser(user.id, supabase);
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