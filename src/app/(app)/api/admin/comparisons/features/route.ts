import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/comparisons/features
 * List all comparison features with their categories
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('comparison_features')
      .select(`
        *,
        category:comparison_categories(id, name, slug)
      `)
      .order('display_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching features:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ features: data });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/features:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/comparisons/features
 * Create a new feature
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess();

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
      .from('comparison_features')
      .select('slug')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A feature with this slug already exists' },
        { status: 409 }
      );
    }

    // Get max display_order for the category
    const { data: maxOrder } = await supabase
      .from('comparison_features')
      .select('display_order')
      .eq('category_id', body.category_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('comparison_features')
      .insert({
        name: body.name,
        slug: body.slug,
        benefit_framing: body.benefit_framing || null,
        description: body.description || null,
        category_id: body.category_id || null,
        feature_type: body.feature_type || 'boolean',
        display_order: (maxOrder?.display_order ?? -1) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feature:', error);
      return NextResponse.json(
        { error: 'Failed to create feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feature: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/admin/comparisons/features:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
