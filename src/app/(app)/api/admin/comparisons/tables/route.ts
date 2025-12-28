import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/comparisons/tables
 * List all comparison tables
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('comparison_tables')
      .select('*')
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tables:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tables' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      published: data?.filter((t) => t.status === 'published').length || 0,
      draft: data?.filter((t) => t.status === 'draft').length || 0,
      archived: data?.filter((t) => t.status === 'archived').length || 0,
    };

    const response = NextResponse.json({ tables: data, stats });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/tables:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/comparisons/tables
 * Create a new comparison table
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('comparison_tables')
      .select('slug')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A table with this slug already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('comparison_tables')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        table_type: body.table_type || 'multi',
        competitor_ids: body.competitor_ids || [],
        single_competitor_id: body.single_competitor_id || null,
        category_ids: body.category_ids || [],
        feature_ids: body.feature_ids || [],
        promptreviews_overrides: body.promptreviews_overrides || {},
        pricing_notes: body.pricing_notes || {},
        design: body.design || {},
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating table:', error);
      return NextResponse.json(
        { error: 'Failed to create table' },
        { status: 500 }
      );
    }

    return NextResponse.json({ table: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/admin/comparisons/tables:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
