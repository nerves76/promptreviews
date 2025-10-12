import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/help-content/[...slug]
 * Get a single article by slug (including drafts)
 * Supports multi-segment slugs like 'google-business/scheduling'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string | string[] } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Handle both single and multi-segment slugs
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

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
 * PUT /api/admin/help-content/[...slug]
 * Update an article
 * Supports multi-segment slugs like 'google-business/scheduling'
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string | string[] } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Handle both single and multi-segment slugs
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
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

    // If title changed, update navigation entries that link to this article
    if (body.title && body.title !== existing.title) {
      const articleHref = `/${slug}`;
      await supabase
        .from('navigation')
        .update({
          title: body.title,
          updated_at: new Date().toISOString()
        })
        .eq('href', articleHref);
    }

    // Revalidate docs cache to reflect changes immediately
    revalidatePath('/api/docs/navigation');
    revalidatePath(`/api/docs/articles/${slug}`);
    if (body.slug && body.slug !== slug) {
      // Also revalidate the new slug if it changed
      revalidatePath(`/api/docs/articles/${body.slug}`);
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
 * DELETE /api/admin/help-content/[...slug]
 * Delete an article
 * Supports multi-segment slugs like 'google-business/scheduling'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string | string[] } }
) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Handle both single and multi-segment slugs
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

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

    // Revalidate docs cache to remove deleted article from navigation
    revalidatePath('/api/docs/navigation');
    revalidatePath(`/api/docs/articles/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/help-content/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
