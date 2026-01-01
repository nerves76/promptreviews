/**
 * Community Comment Detail API
 *
 * PATCH /api/community/comments/:id - Update comment (author only)
 * DELETE /api/community/comments/:id - Soft delete comment (author or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, canModifyComment } from '../../utils/auth';
import { createServiceClient } from '../../utils/supabase';

/**
 * PATCH /api/community/comments/:id
 * Updates a comment (author only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Check ownership
    const canModify = await canModifyComment(userId!, id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'You can only update your own comments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate body
    if (!body.body || typeof body.body !== 'string') {
      return NextResponse.json(
        { error: 'Comment body is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (body.body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment body cannot be empty', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (body.body.length > 10000) {
      return NextResponse.json(
        { error: 'Comment body must be 10,000 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update comment
    const supabase = createServiceClient();
    const { data: comment, error } = await supabase
      .from('post_comments')
      .update({
        body: body.body.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: comment });

  } catch (error) {
    console.error('Comment update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/comments/:id
 * Soft deletes a comment (author or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Check ownership or admin status
    const canModify = await canModifyComment(userId!, id);
    if (!canModify) {
      return NextResponse.json(
        { error: 'You can only delete your own comments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Soft delete (set deleted_at timestamp)
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('post_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Comment delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
