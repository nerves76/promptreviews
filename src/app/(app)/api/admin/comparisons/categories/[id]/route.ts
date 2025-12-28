import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/comparisons/categories/[id]
 * Get a single category
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('comparison_categories')
      .select(`
        *,
        features:comparison_features(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ category: data });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/categories/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/comparisons/categories/[id]
 * Update a category
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { data, error } = await supabase
      .from('comparison_categories')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon_name: body.icon_name,
        display_order: body.display_order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in PUT /api/admin/comparisons/categories/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/comparisons/categories/[id]
 * Delete a category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('comparison_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in DELETE /api/admin/comparisons/categories/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
