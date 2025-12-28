import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/comparisons/competitors/[slug]
 * Get a single competitor with all feature values
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('competitors')
      .select(`
        *,
        features:competitor_features(
          id,
          feature_id,
          has_feature,
          value_text,
          value_number,
          is_limited,
          notes,
          feature:comparison_features(id, name, slug, category_id)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ competitor: data });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/competitors/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/comparisons/competitors/[slug]
 * Update a competitor and their feature values
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    // First get the competitor ID
    const { data: existing } = await supabase
      .from('competitors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Update competitor
    const { data, error } = await supabase
      .from('competitors')
      .update({
        name: body.name,
        slug: body.slug,
        logo_url: body.logo_url,
        website_url: body.website_url,
        pricing: body.pricing || {},
        status: body.status,
        display_order: body.display_order,
        updated_by: userId,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating competitor:', error);
      return NextResponse.json(
        { error: 'Failed to update competitor' },
        { status: 500 }
      );
    }

    // Update feature values if provided
    if (body.features && Array.isArray(body.features)) {
      for (const featureValue of body.features) {
        // Upsert feature value
        await supabase
          .from('competitor_features')
          .upsert({
            competitor_id: existing.id,
            feature_id: featureValue.feature_id,
            has_feature: featureValue.has_feature ?? false,
            value_text: featureValue.value_text || null,
            value_number: featureValue.value_number || null,
            is_limited: featureValue.is_limited ?? false,
            notes: featureValue.notes || null,
          }, {
            onConflict: 'competitor_id,feature_id',
          });
      }
    }

    return NextResponse.json({ competitor: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in PUT /api/admin/comparisons/competitors/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/comparisons/competitors/[slug]
 * Delete a competitor
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAccess();
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting competitor:', error);
      return NextResponse.json(
        { error: 'Failed to delete competitor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in DELETE /api/admin/comparisons/competitors/[slug]:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
