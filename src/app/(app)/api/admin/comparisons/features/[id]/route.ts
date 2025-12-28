import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/comparisons/features/[id]
 * Get a single feature
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('comparison_features')
      .select(`
        *,
        category:comparison_categories(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ feature: data });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/features/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/comparisons/features/[id]
 * Update a feature
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { data, error } = await supabase
      .from('comparison_features')
      .update({
        name: body.name,
        slug: body.slug,
        benefit_framing: body.benefit_framing,
        description: body.description,
        category_id: body.category_id,
        feature_type: body.feature_type,
        display_order: body.display_order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature:', error);
      return NextResponse.json(
        { error: 'Failed to update feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feature: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in PUT /api/admin/comparisons/features/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/comparisons/features/[id]
 * Delete a feature
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('comparison_features')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feature:', error);
      return NextResponse.json(
        { error: 'Failed to delete feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in DELETE /api/admin/comparisons/features/[id]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
