/**
 * Community Comments API
 *
 * GET /api/community/posts/:id/comments - List comments for a post
 * POST /api/community/posts/:id/comments - Create comment on post
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../utils/auth';
import { createServiceClient } from '../../../utils/supabase';
import { validateCommentData, validatePagination } from '../../../utils/validation';

/**
 * GET /api/community/posts/:id/comments
 * Returns paginated list of comments for a post
 */
export async function GET(
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const { limit, offset } = validatePagination({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    // Fetch comments
    const supabase = createServiceClient();
    const { data: comments, error, count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: comments || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/posts/:id/comments
 * Creates a new comment on a post
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

    // Validate input
    const validation = validateCommentData(body);
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

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        author_id: userId,
        body: body.body.trim()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating comment:', createError);
      return NextResponse.json(
        { error: 'Failed to create comment', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    // Parse mentions from comment body
    const { data: mentionedUsernames } = await supabase
      .rpc('parse_mentions', { p_content: body.body });

    // Create mention records if any found
    if (mentionedUsernames && mentionedUsernames.length > 0) {
      await supabase.rpc('create_mention_records', {
        p_source_type: 'comment',
        p_source_id: comment.id,
        p_author_id: userId,
        p_mentioned_usernames: mentionedUsernames
      });
    }

    return NextResponse.json({ data: comment }, { status: 201 });

  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
