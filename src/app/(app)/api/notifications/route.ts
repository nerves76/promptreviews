/**
 * Notifications API
 *
 * GET: Fetch notifications for the current account (for bell icon)
 * POST: Mark notifications as read/dismissed
 *
 * Security improvements:
 * - Rate limiting (max 30 requests per minute)
 * - UUID validation for notificationIds
 * - User-specific notification filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Simple in-memory rate limiter (per user, resets every minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // Max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get query params with validation
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    // Clamp limit between 1 and 100
    const limit = Math.min(Math.max(limitParam, 1), 100);

    // Fetch notifications - filter by account AND (user_id is null OR user_id matches)
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('account_id', accountId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('read', false)
      .eq('dismissed', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (!action || !['mark_read', 'mark_all_read', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'mark_all_read') {
      // Mark all notifications as read for this account AND user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Validate notificationIds for mark_read and dismiss actions
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds required' }, { status: 400 });
    }

    // Limit batch size to prevent abuse
    if (notificationIds.length > 100) {
      return NextResponse.json({ error: 'Too many notification IDs (max 100)' }, { status: 400 });
    }

    // Validate each ID is a valid UUID
    const invalidIds = notificationIds.filter(id => !isValidUuid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: 'Invalid notification ID format' }, { status: 400 });
    }

    if (action === 'mark_read') {
      // FIX: Add user_id filter to prevent users from marking other users' notifications
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else if (action === 'dismiss') {
      // FIX: Add user_id filter to prevent users from dismissing other users' notifications
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .in('id', notificationIds);

      if (error) {
        console.error('Error dismissing:', error);
        return NextResponse.json({ error: 'Failed to dismiss notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
