/**
 * Community Post Reactions API
 *
 * POST /api/community/posts/:id/react - Toggle reaction on post
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../utils/auth';
import { createServiceClient } from '../../../utils/supabase';
import { validateReaction, ReactionType } from '../../../utils/validation';

/**
 * POST /api/community/posts/:id/react
 * Toggles a reaction on a post (add if doesn't exist, remove if exists)
 */
export async function POST(
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

    // Verify post exists and is not deleted
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', id)
      .eq('user_id', userId)
      .eq('reaction', body.reaction)
      .maybeSingle();

    if (existingReaction) {
      // Remove reaction (unlike)
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', id)
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
        .from('post_reactions')
        .insert({
          post_id: id,
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
    console.error('Post reaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
