/**
 * Community Posts API
 *
 * GET /api/community/posts - List posts with pagination
 * POST /api/community/posts - Create new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../utils/auth';
import { createServiceClient } from '../utils/supabase';
import { validatePostData, validatePagination } from '../utils/validation';

/**
 * GET /api/community/posts
 * Returns paginated list of posts, optionally filtered by channel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');
    const { limit, offset } = validatePagination({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    // Build query
    const supabase = createServiceClient();
    let query = supabase
      .from('posts')
      .select('*, author:author_id(id)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply channel filter if provided
    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: posts || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/posts
 * Creates a new post and automatically parses mentions
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validatePostData(body);
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

    // Create post
    const { data: post, error: createError } = await supabase
      .from('posts')
      .insert({
        channel_id: body.channel_id,
        author_id: userId,
        title: body.title.trim(),
        body: body.body?.trim() || null,
        external_url: body.external_url || null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating post:', createError);
      return NextResponse.json(
        { error: 'Failed to create post', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    // Parse mentions from title and body
    const content = `${body.title} ${body.body || ''}`;
    const { data: mentionedUsernames } = await supabase
      .rpc('parse_mentions', { p_content: content });

    // Create mention records if any found
    if (mentionedUsernames && mentionedUsernames.length > 0) {
      await supabase.rpc('create_mention_records', {
        p_source_type: 'post',
        p_source_id: post.id,
        p_author_id: userId,
        p_mentioned_usernames: mentionedUsernames
      });
    }

    return NextResponse.json({ data: post }, { status: 201 });

  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
