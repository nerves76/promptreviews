/**
 * Widget Reviews API Route
 * Handles CRUD operations for widget_reviews table with proper authentication and RLS bypass
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';

// Initialize clients
const supabase = createClient();
const supabaseAdmin = createServiceRoleClient();

/**
 * PUT /api/widgets/[id]/reviews
 * Updates reviews for a specific widget
 */
export async function PUT(
  request: NextRequest,
  context: any
) {
  const { id: widgetId } = await context.params;
  
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { reviews } = body;

    if (!Array.isArray(reviews)) {
      return NextResponse.json({ error: 'Reviews must be an array' }, { status: 400 });
    }

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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

    // Delete existing reviews for this widget
    const { error: deleteError } = await supabaseAdmin
      .from('widget_reviews')
      .delete()
      .eq('widget_id', widgetId);

    if (deleteError) {
      console.error('[WIDGET-REVIEWS] Error deleting existing reviews:', deleteError);
      return NextResponse.json({ error: 'Failed to update reviews' }, { status: 500 });
    }

    // Insert new reviews if any provided
    if (reviews.length > 0) {
      const reviewsToInsert = reviews.map((review, index) => ({
        widget_id: widgetId,
        review_id: review.review_id,
        review_content: review.review_content,
        first_name: review.first_name,
        last_name: review.last_name,
        reviewer_role: review.reviewer_role,
        platform: review.platform || 'custom',
        order_index: index,
        star_rating: typeof review.star_rating === 'number' 
          ? Math.round(review.star_rating * 2) / 2 
          : null,
        photo_url: review.photo_url || null,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('widget_reviews')
        .insert(reviewsToInsert);

      if (insertError) {
        console.error('[WIDGET-REVIEWS] Error inserting reviews:', insertError);
        return NextResponse.json({ error: 'Failed to save reviews' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${reviews.length} reviews for widget` 
    });

  } catch (error) {
    console.error('[WIDGET-REVIEWS] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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