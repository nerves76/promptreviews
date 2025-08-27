import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with public credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/widgets/debug
 * Lists all widgets for the current user for debugging purposes
 */
export async function GET(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For debugging, let's try to get all widgets (this might not work due to RLS)
      const { data: widgets, error } = await supabase
        .from('widgets')
        .select('id, name, widget_type, created_at, account_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching widgets:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch widgets', 
          details: error.message,
          suggestion: 'Make sure you have created widgets in your dashboard first'
        }, { status: 500 });
      }

      return NextResponse.json({ 
        widgets: widgets || [],
        message: 'Showing all widgets (no auth provided)'
      });
    }

    // Extract the token
    const token = authHeader.substring(7);
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch widgets for the authenticated user
    const { data: widgets, error } = await supabase
      .from('widgets')
      .select(`
        id, 
        name, 
        widget_type, 
        created_at, 
        account_id,
        widget_reviews(count)
      `)
      .eq('account_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching widgets:', error);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    // Process the widgets to include review counts
    const processedWidgets = (widgets || []).map(widget => ({
      ...widget,
      review_count: widget.widget_reviews?.[0]?.count || 0
    }));

    return NextResponse.json({ 
      widgets: processedWidgets,
      user_id: user.id
    });
  } catch (err) {
    console.error('[GET /api/widgets/debug] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 