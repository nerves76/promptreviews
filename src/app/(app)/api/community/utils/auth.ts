/**
 * Community API - Authentication Helpers
 *
 * Provides auth verification utilities for community routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from './supabase';

export interface AuthResult {
  success: boolean;
  userId?: string;
  token?: string;
  error?: NextResponse;
}

/**
 * Verify authentication from request headers
 * Returns user ID and token if authenticated, or error response
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  // Get authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }

  const token = authHeader.substring(7);

  // Verify token with Supabase
  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    };
  }

  return {
    success: true,
    userId: user.id,
    token
  };
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: adminRecord } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  return !!adminRecord;
}

/**
 * Verify user owns a post or is admin
 */
export async function canModifyPost(userId: string, postId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // Check if user is admin
  if (await isAdmin(userId)) {
    return true;
  }

  // Check if user is author
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .maybeSingle();

  return post?.author_id === userId;
}

/**
 * Verify user owns a comment or is admin
 */
export async function canModifyComment(userId: string, commentId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // Check if user is admin
  if (await isAdmin(userId)) {
    return true;
  }

  // Check if user is author
  const { data: comment } = await supabase
    .from('post_comments')
    .select('author_id')
    .eq('id', commentId)
    .maybeSingle();

  return comment?.author_id === userId;
}
