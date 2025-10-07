/**
 * Community Post Detail API
 *
 * GET /api/community/posts/:id - Get single post
 * PATCH /api/community/posts/:id - Update post (author only)
 * DELETE /api/community/posts/:id - Soft delete post (author or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, canModifyPost } from '../../utils/auth';
import { createServiceClient } from '../../utils/supabase';
import { validatePostData } from '../../utils/validation';

/**
 * GET /api/community/posts/:id
 * Returns single post with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const supabase = createServiceClient();
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });

  } catch (error) {
    console.error('Post detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/community/posts/:id
 * Updates a post (author only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Check ownership
    const canModify = await canModifyPost(userId!, params.id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'You can only update your own posts', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update object (only allow certain fields)
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      if (body.title.length > 200) {
        return NextResponse.json(
          { error: 'Title must be 200 characters or less', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.body !== undefined) {
      if (body.body && body.body.length > 10000) {
        return NextResponse.json(
          { error: 'Body must be 10,000 characters or less', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updates.body = body.body?.trim() || null;
    }

    if (body.external_url !== undefined) {
      if (body.external_url && !body.external_url.match(/^https?:\/\/.+/i)) {
        return NextResponse.json(
          { error: 'External URL must be a valid HTTP/HTTPS URL', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updates.external_url = body.external_url || null;
    }

    // Update post
    const supabase = createServiceClient();
    const { data: post, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', params.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return NextResponse.json(
        { error: 'Failed to update post', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: post });

  } catch (error) {
    console.error('Post update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/posts/:id
 * Soft deletes a post (author or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Check ownership or admin status
    const canModify = await canModifyPost(userId!, params.id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'You can only delete your own posts', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Soft delete (set deleted_at timestamp)
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .is('deleted_at', null);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json(
        { error: 'Failed to delete post', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Post delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
