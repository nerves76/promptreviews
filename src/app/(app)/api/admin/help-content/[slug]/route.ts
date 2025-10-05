import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/help-content/[slug]
 * Get a single article by slug (including drafts)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { slug } = params;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching article:', error);
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data });
  } catch (error: any) {
    console.error('Error in GET /api/admin/help-content/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/help-content/[slug]
 * Update an article
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { slug } = params;
    const body = await request.json();

    // Get existing article
    const { data: existing, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // If slug is being changed, check if new slug exists
    if (body.slug && body.slug !== slug) {
      const { data: slugCheck } = await supabase
        .from('articles')
        .select('slug')
        .eq('slug', body.slug)
        .single();

      if (slugCheck) {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Set published_at if changing to published
      if (body.status === 'published' && existing.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
      // Clear published_at if unpublishing
      if (body.status !== 'published' && existing.status === 'published') {
        updateData.published_at = null;
      }
    }

    // Update article
    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error updating article:', error);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/help-content/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/help-content/[slug]
 * Delete an article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { slug } = params;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting article:', error);
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/help-content/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
