import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with public credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/widgets/[id]
 * Fetches all data needed to render a widget embed, including:
 *   - Widget info (type, name, design, etc.)
 *   - Associated reviews
 *   - Any other relevant settings
 *
 * Returns 404 if widget not found, or 500 on server error.
 *
 * Note: The context argument must be typed as 'any' for compatibility with Next.js App Router API routes.
 */
export async function GET(
  req: Request,
  context: any
) {
  const { id: widgetId } = await context.params;
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
  }

  try {
    // Fetch widget info from 'widgets' table
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // First, try to fetch reviews from 'widget_reviews' table
    let reviews = [];
    const { data: widgetReviews, error: widgetReviewsError } = await supabase
      .from('widget_reviews')
      .select('*')
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    if (widgetReviewsError) {
      console.error('Error fetching widget reviews:', widgetReviewsError);
    } else if (widgetReviews && widgetReviews.length > 0) {
      // Use widget-specific reviews if they exist
      reviews = widgetReviews;
      console.log(`Found ${reviews.length} widget-specific reviews`);
    } else {
      // Fallback: fetch reviews from review_submissions for this account
      console.log('No widget-specific reviews found, falling back to review_submissions');
      const { data: submissionReviews, error: submissionReviewsError } = await supabase
        .from('review_submissions')
        .select('*')
        .eq('business_id', widget.account_id)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to prevent too many reviews

      if (submissionReviewsError) {
        console.error('Error fetching review submissions:', submissionReviewsError);
      } else if (submissionReviews) {
        // Transform review_submissions to match widget_reviews format
        reviews = submissionReviews.map(review => ({
          id: review.id,
          widget_id: widgetId,
          review_id: review.id,
          first_name: review.first_name,
          last_name: review.last_name,
          reviewer_role: review.reviewer_role,
          review_content: review.review_content,
          star_rating: 5, // Default to 5 stars
          platform: review.platform,
          created_at: review.created_at,
          updated_at: review.created_at
        }));
        console.log(`Found ${reviews.length} review submissions for account`);
      }
    }

    // Add photo_url field to each review (since the column doesn't exist yet)
    const reviewsWithPhotoUrl = reviews.map(review => ({
      ...review,
      photo_url: review.photo_url || null
    }));

    // Fetch the universal prompt page slug for the business
    let businessSlug = null;
    if (widget.account_id) {
        const { data: promptPageData, error: slugError } = await supabase
            .from('prompt_pages')
            .select('slug')
            .eq('account_id', widget.account_id)
            .eq('is_universal', true)
            .single();

        if (slugError) {
            console.error('Error fetching business slug:', slugError.message);
        } else if (promptPageData) {
            businessSlug = promptPageData.slug;
        }
    }

    // Compose the response object
    const response = {
      ...widget,
      design: widget.theme, // Map theme to design for backward compatibility
      reviews: reviewsWithPhotoUrl,
      businessSlug: businessSlug,
    };

    return NextResponse.json(response);
  } catch (err) {
    // Log and return server error
    console.error('[GET /api/widgets/[id]] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 