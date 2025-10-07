/**
 * Community Comment Reactions API
 *
 * POST /api/community/comments/:id/react - Toggle reaction on comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../utils/auth';
import { createServiceClient } from '../../../utils/supabase';
import { validateReaction } from '../../../utils/validation';

/**
 * POST /api/community/comments/:id/react
 * Toggles a reaction on a comment (add if doesn't exist, remove if exists)
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();

    // Validate reaction type
    const validation = validateReaction(body.reaction);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify comment exists and is not deleted
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('id')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('comment_reactions')
      .select('*')
      .eq('comment_id', params.id)
      .eq('user_id', userId)
      .eq('reaction', body.reaction)
      .maybeSingle();

    if (existingReaction) {
      // Remove reaction (unlike)
      const { error: deleteError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', params.id)
        .eq('user_id', userId)
        .eq('reaction', body.reaction);

      if (deleteError) {
        console.error('Error removing reaction:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove reaction', code: 'SERVER_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({ action: 'removed', reaction: body.reaction });
    } else {
      // Add reaction (like)
      const { error: insertError } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: params.id,
          user_id: userId,
          reaction: body.reaction
        });

      if (insertError) {
        console.error('Error adding reaction:', insertError);
        return NextResponse.json(
          { error: 'Failed to add reaction', code: 'SERVER_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({ action: 'added', reaction: body.reaction }, { status: 201 });
    }

  } catch (error) {
    console.error('Comment reaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
