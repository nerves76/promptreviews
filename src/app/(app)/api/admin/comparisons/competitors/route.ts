import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/comparisons/competitors
 * List all competitors
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('competitors')
      .select(`
        *,
        features:competitor_features(
          feature_id,
          has_feature,
          value_text,
          value_number,
          is_limited,
          notes,
          feature:comparison_features(id, name, slug)
        )
      `)
      .order('display_order', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch competitors' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      active: data?.filter((c) => c.status === 'active').length || 0,
      archived: data?.filter((c) => c.status === 'archived').length || 0,
    };

    const response = NextResponse.json({ competitors: data, stats });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/admin/comparisons/competitors:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/comparisons/competitors
 * Create a new competitor
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
      .from('competitors')
      .select('slug')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A competitor with this slug already exists' },
        { status: 409 }
      );
    }

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('competitors')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('competitors')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        pricing_description: body.pricing_description || null,
        logo_url: body.logo_url || null,
        website_url: body.website_url || null,
        pricing: body.pricing || {},
        status: body.status || 'active',
        display_order: (maxOrder?.display_order ?? -1) + 1,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating competitor:', error);
      return NextResponse.json(
        { error: 'Failed to create competitor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competitor: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/admin/comparisons/competitors:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
