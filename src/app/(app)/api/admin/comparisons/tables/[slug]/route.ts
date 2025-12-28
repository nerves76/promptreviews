import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/comparisons/tables/[slug]
 * Get a single comparison table with full data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the table
    const { data: table, error: tableError } = await supabase
      .from('comparison_tables')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get related data for the editor
    const [categoriesResult, competitorsResult, featuresResult] = await Promise.all([
      supabase
        .from('comparison_categories')
        .select('*')
        .order('display_order'),
      supabase
        .from('competitors')
        .select(`
          *,
          features:competitor_features(
            feature_id,
            has_feature,
            value_text,
            value_number,
            is_limited,
            notes
          )
        `)
        .eq('status', 'active')
        .order('display_order'),
      supabase
        .from('comparison_features')
        .select(`
          *,
          category:comparison_categories(id, name, slug)
        `)
        .order('display_order'),
    ]);

    const response = NextResponse.json({
      table,
      categories: categoriesResult.data || [],
      competitors: competitorsResult.data || [],
      features: featuresResult.data || [],
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/tables/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/comparisons/tables/[slug]
 * Update a comparison table
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    // Check if table exists
    const { data: existing } = await supabase
      .from('comparison_tables')
      .select('id, status')
      .eq('slug', slug)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Set published_at if publishing for the first time
    let publishedAt = undefined;
    if (body.status === 'published' && existing.status !== 'published') {
      publishedAt = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('comparison_tables')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        table_type: body.table_type,
        competitor_ids: body.competitor_ids || [],
        single_competitor_id: body.single_competitor_id,
        category_ids: body.category_ids || [],
        feature_ids: body.feature_ids || [],
        promptreviews_overrides: body.promptreviews_overrides || {},
        pricing_notes: body.pricing_notes || {},
        design: body.design || {},
        status: body.status,
        ...(publishedAt && { published_at: publishedAt }),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating table:', error);
      return NextResponse.json(
        { error: 'Failed to update table' },
        { status: 500 }
      );
    }

    // Revalidate public embed endpoint
    revalidatePath(`/api/comparisons/embed/${body.slug || slug}`);

    return NextResponse.json({ table: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in PUT /api/admin/comparisons/tables/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/comparisons/tables/[slug]
 * Delete a comparison table
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('comparison_tables')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting table:', error);
      return NextResponse.json(
        { error: 'Failed to delete table' },
        { status: 500 }
      );
    }

    // Revalidate public embed endpoint
    revalidatePath(`/api/comparisons/embed/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in DELETE /api/admin/comparisons/tables/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
