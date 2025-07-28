import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { createServerClient } from '@supabase/ssr';

// 🔧 CONSOLIDATION: Use centralized service role client
// This eliminates global client instances in favor of request-scoped clients
const supabaseAdmin = createServiceRoleClient();

// 🔧 CONSOLIDATION: Helper function for request-scoped auth client
// This replaces the global createClient() with proper request-scoped client
// Used ONLY for authenticated dashboard requests, NOT for public widget embeds
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

// 🔧 CONSOLIDATION: Public client for widget embeds
// This handles public access for widgets embedded on external websites
// Uses admin client to bypass RLS for public widget data
function getPublicWidgetData(widgetId: string) {
  // For public embeds, we use the admin client to fetch widget data
  // This allows widgets to be embedded on external websites without authentication
  return supabaseAdmin;
}

/**
 * GET /api/widgets/[id]
 * Fetches all data needed to render a widget embed, including:
 *   - Widget info (type, name, design, etc.)
 *   - Associated reviews
 *   - Any other relevant settings
 *
 * Returns 404 if widget not found, 403 if unauthorized, or 500 on server error.
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
    // Get the user from the request headers (for dashboard requests)
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // This is a dashboard request - authenticate the user
      const token = authHeader.substring(7);
      const supabase = createAuthClient(token); // 🔧 CONSOLIDATED: Use request-scoped client
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = user.id;
      
      // Get account ID for the user
      const accountId = await getAccountIdForUser(userId, supabase);
      if (!accountId) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      
      // Fetch widget info and verify ownership using admin client to bypass RLS
      const { data: widget, error: widgetError } = await supabaseAdmin
        .from('widgets')
        .select('*')
        .eq('id', widgetId)
        .eq('account_id', accountId)
        .single();

      if (widgetError || !widget) {
        return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 403 });
      }
      
      // Continue with the rest of the logic using the authenticated widget
      return await fetchWidgetData(widget, widgetId);
    } else {
      // This is a public widget request (for embedding) - fetch without authentication using admin client
      const { data: widget, error: widgetError } = await supabaseAdmin
        .from('widgets')
        .select('*')
        .eq('id', widgetId)
        .single();

      if (widgetError || !widget) {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }
      
      // Continue with the rest of the logic using the public widget
      return await fetchWidgetData(widget, widgetId);
    }
  } catch (err) {
    // Log and return server error
    console.error('[GET /api/widgets/[id]] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * Helper function to fetch widget data and reviews
 */
async function fetchWidgetData(widget: any, widgetId: string) {
  // Only fetch reviews that have been explicitly selected for this widget
  let reviews = [];
  const { data: widgetReviews, error: widgetReviewsError } = await supabaseAdmin
    .from('widget_reviews')
    .select('*')
    .eq('widget_id', widgetId)
    .order('created_at', { ascending: false });

  if (widgetReviewsError) {
    console.error('Error fetching widget reviews:', widgetReviewsError);
  } else if (widgetReviews && widgetReviews.length > 0) {
    // Use only the reviews that have been explicitly selected for this widget
    reviews = widgetReviews;
    console.log(`Found ${reviews.length} selected reviews for widget`);
  } else {
    // No reviews have been selected for this widget yet
    console.log('No reviews selected for this widget yet. Use "Manage Reviews" to select which reviews to display.');
    reviews = [];
  }

  // Add photo_url field to each review (since the column doesn't exist yet)
  const reviewsWithPhotoUrl = reviews.map(review => ({
    ...review,
    photo_url: review.photo_url || null
  }));

  // Fetch the universal prompt page slug for the business
  let businessSlug = null;
  if (widget.account_id) {
      const { data: promptPageData, error: slugError } = await supabaseAdmin
          .from('prompt_pages')
          .select('slug')
          .eq('account_id', widget.account_id)
          .eq('is_universal', true)
          .order('created_at', { ascending: false })
          .limit(1)
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
}

/**
 * PUT /api/widgets/[id]
 * Updates an existing widget for the authenticated user
 */
export async function PUT(
  req: Request,
  context: any
) {
  const { id: widgetId } = await context.params;
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    
    // Get the user from the request headers
    const authHeader = req.headers.get('authorization');
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
    
    // Update widget and verify ownership using admin client to bypass RLS
    const { data: widget, error: updateError } = await supabaseAdmin
      .from('widgets')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', widgetId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (updateError || !widget) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 403 });
    }

    return NextResponse.json(widget);
  } catch (err) {
    console.error('[PUT /api/widgets/[id]] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/widgets/[id]
 * Deletes a widget for the authenticated user
 */
export async function DELETE(
  req: Request,
  context: any
) {
  const { id: widgetId } = await context.params;
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widget ID' }, { status: 400 });
  }

  try {
    // Get the user from the request headers
    const authHeader = req.headers.get('authorization');
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
    
    // Delete widget and verify ownership using admin client to bypass RLS
    const { error: deleteError } = await supabaseAdmin
      .from('widgets')
      .delete()
      .eq('id', widgetId)
      .eq('account_id', accountId);

    if (deleteError) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/widgets/[id]] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 