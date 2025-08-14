/**
 * Widget API Routes
 * Handles widget creation, listing, and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccountIdForUser } from '@/auth/utils/accounts';

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/widgets
 * Creates a new widget for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, theme } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name and type are required' },
        { status: 400 }
      );
    }

    // Get user from request headers (set by middleware)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID for user
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found. Please ensure you have completed the signup process.' },
        { status: 404 }
      );
    }

    // Create widget
    const widgetData = {
      account_id: accountId,
      name: name.trim(),
      type: type,
      theme: theme || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: widget, error: createError } = await supabase
      .from('widgets')
      .insert(widgetData)
      .select()
      .single();

    if (createError) {
      console.error('Widget creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create widget' },
        { status: 500 }
      );
    }

    return NextResponse.json(widget, { status: 201 });

  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/widgets
 * Lists all widgets for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID for user
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Fetch widgets for account
    const { data: widgets, error: fetchError } = await supabase
      .from('widgets')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Widget fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch widgets' },
        { status: 500 }
      );
    }

    return NextResponse.json(widgets || []);

  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 