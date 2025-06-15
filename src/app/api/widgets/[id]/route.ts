import { NextRequest, NextResponse } from 'next/server';
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
 * Note: The context argument must be typed as 'any' or use the correct Next.js type for dynamic API routes.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const widgetId = context.params.id;
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

    // Fetch reviews for this widget from 'widget_reviews' table
    const { data: reviews, error: reviewsError } = await supabase
      .from('widget_reviews')
      .select('*')
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Compose the response object
    const response = {
      ...widget, // includes type, design, etc.
      reviews: reviews || [],
    };

    return NextResponse.json(response);
  } catch (err) {
    // Log and return server error
    console.error('[GET /api/widgets/[id]] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 