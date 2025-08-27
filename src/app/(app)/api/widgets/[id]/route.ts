import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getAccountIdForUser } from '@/auth/utils/accounts';
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
      
      // Get account ID respecting client selection if provided
      const accountId = await getRequestAccountId(req, userId, supabase);
      
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
  console.log(`[Widget ${widgetId}] Widget data:`, { 
    id: widget.id, 
    account_id: widget.account_id,
    widget_type: widget.widget_type,
    has_theme: !!widget.theme 
  });
  
  // Only fetch reviews that have been explicitly selected for this widget
  let reviews = [];
  const { data: widgetReviews, error: widgetReviewsError } = await supabaseAdmin
    .from('widget_reviews')
    .select('*')
    .eq('widget_id', widgetId)
    .order('order_index', { ascending: true });

  if (widgetReviewsError) {
    console.error('Error fetching widget reviews:', widgetReviewsError);
  } else if (widgetReviews && widgetReviews.length > 0) {
    // Fetch original reviews from review_submissions to get correct dates
    const reviewIds = widgetReviews.map(wr => wr.review_id).filter(id => id);
    
    // Only fetch if we have review IDs to look up
    if (reviewIds.length > 0) {
      const { data: originalReviews, error: originalError } = await supabaseAdmin
        .from('review_submissions')
        .select('id, created_at')
        .in('id', reviewIds);
      
      if (!originalError && originalReviews) {
        // Create a map of original dates
        const originalDatesMap = new Map(
          originalReviews.map(r => [r.id, r.created_at])
        );
        
        // Merge original dates into widget reviews
        reviews = widgetReviews.map(wr => {
          const originalDate = originalDatesMap.get(wr.review_id);
          if (originalDate) {
            // Use original created_at from review_submissions
            return { ...wr, created_at: originalDate };
          }
          // For custom reviews or reviews not found, keep existing date
          return wr;
        });
        
        console.log(`Found ${reviews.length} selected reviews for widget with original dates merged`);
      } else {
        // Fallback to widget reviews if we can't fetch originals
        reviews = widgetReviews;
        console.log(`Found ${reviews.length} selected reviews for widget (could not merge dates)`);
      }
    } else {
      // All reviews are custom (no review_ids)
      reviews = widgetReviews;
      console.log(`Found ${reviews.length} custom reviews for widget`);
    }
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
      console.log(`[Widget ${widgetId}] Fetching business slug for account_id: ${widget.account_id}`);
      
      const { data: promptPageData, error: slugError } = await supabaseAdmin
          .from('prompt_pages')
          .select('slug')
          .eq('account_id', widget.account_id)
          .eq('is_universal', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

      if (slugError) {
          console.error(`[Widget ${widgetId}] Error fetching business slug:`, slugError.message, slugError.code);
          
          // If single() fails because there are no rows, try without single()
          if (slugError.code === 'PGRST116') {
              console.log(`[Widget ${widgetId}] No universal prompt page found, trying without single()`);
              const { data: promptPages, error: retryError } = await supabaseAdmin
                  .from('prompt_pages')
                  .select('slug')
                  .eq('account_id', widget.account_id)
                  .eq('is_universal', true);
              
              console.log(`[Widget ${widgetId}] Found ${promptPages?.length || 0} universal prompt pages`);
              if (promptPages && promptPages.length > 0) {
                  businessSlug = promptPages[0].slug;
                  console.log(`[Widget ${widgetId}] Using business slug: ${businessSlug}`);
              }
          }
      } else if (promptPageData) {
          businessSlug = promptPageData.slug;
          console.log(`[Widget ${widgetId}] Found business slug: ${businessSlug}`);
      }
  } else {
      console.log(`[Widget ${widgetId}] No account_id on widget, cannot fetch business slug`);
  }

  // If we still don't have a businessSlug, try to get the account's default business slug
  if (!businessSlug && widget.account_id) {
      console.log(`[Widget ${widgetId}] No universal prompt page found, trying to get account's default business`);
      
      // Get the account's business name to use as a fallback slug
      const { data: accountData, error: accountError } = await supabaseAdmin
          .from('accounts')
          .select('business_name')
          .eq('id', widget.account_id)
          .single();
      
      if (accountData && accountData.business_name) {
          // Create a slug from the business name
          businessSlug = accountData.business_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
          console.log(`[Widget ${widgetId}] Using fallback business slug from account: ${businessSlug}`);
      }
  }

  // Compose the response object
  const response = {
    ...widget,
    design: widget.theme, // Map theme to design for backward compatibility
    reviews: reviewsWithPhotoUrl,
    businessSlug: businessSlug,
  };

  // Add CORS headers for cross-domain embedding
  const jsonResponse = NextResponse.json(response);
  jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
  jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return jsonResponse;
}

/**
 * OPTIONS /api/widgets/[id]
 * Handles CORS preflight requests for cross-domain embedding
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
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