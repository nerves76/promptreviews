import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/comparisons/categories
 * List all comparison categories
 */
export async function GET() {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('comparison_categories')
      .select(`
        *,
        features:comparison_features(count)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ categories: data });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/categories:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/comparisons/categories
 * Create a new category
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
      .from('comparison_categories')
      .select('slug')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('comparison_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('comparison_categories')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        icon_name: body.icon_name || null,
        display_order: (maxOrder?.display_order ?? -1) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/admin/comparisons/categories:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/comparisons/categories
 * Bulk update category order
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    if (!body.categories || !Array.isArray(body.categories)) {
      return NextResponse.json(
        { error: 'Missing categories array' },
        { status: 400 }
      );
    }

    // Update each category's display_order
    for (let i = 0; i < body.categories.length; i++) {
      const category = body.categories[i];
      await supabase
        .from('comparison_categories')
        .update({ display_order: i })
        .eq('id', category.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in PUT /api/admin/comparisons/categories:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
