/**
 * Notifications API
 *
 * GET: Fetch notifications for the current account (for bell icon)
 *      For agencies: supports aggregated view across all managed accounts
 * POST: Mark notifications as read/dismissed
 *
 * Security improvements:
 * - Rate limiting (max 30 requests per minute)
 * - UUID validation for notificationIds
 * - User-specific notification filtering
 * - Per-user dismissals (dismissing doesn't affect other users)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
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
    const supabaseAdmin = createServiceRoleClient();
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
    const limit = Math.min(Math.max(limitParam, 1), 100);

    // Agency aggregated view params
    const agencyView = searchParams.get('agency_view') === 'true';
    const filterAccount = searchParams.get('filter_account'); // 'all' or specific account ID

    // Check if this is an agency account requesting aggregated view
    let accountIds: string[] = [accountId];
    let accountsMap: Record<string, { id: string; name: string }> = {};

    if (agencyView) {
      // Check if current account is an agency
      const { data: currentAccount } = await supabase
        .from('accounts')
        .select('id, is_agncy, business_name')
        .eq('id', accountId)
        .single();

      if (currentAccount?.is_agncy) {
        // Get all managed client accounts
        const { data: clientAccess } = await supabaseAdmin
          .from('agncy_client_access')
          .select('client_account_id, accounts!agncy_client_access_client_account_id_fkey(id, business_name)')
          .eq('agency_account_id', accountId)
          .eq('status', 'active');

        // Build accounts map for display
        accountsMap[accountId] = {
          id: accountId,
          name: currentAccount.business_name || 'Your agency'
        };

        if (clientAccess && clientAccess.length > 0) {
          const clientAccountIds = clientAccess.map((ca: any) => ca.client_account_id);

          // If filtering by specific account
          if (filterAccount && filterAccount !== 'all' && isValidUuid(filterAccount)) {
            // Verify the filter account is either the agency or a managed client
            if (filterAccount === accountId || clientAccountIds.includes(filterAccount)) {
              accountIds = [filterAccount];
            }
          } else {
            // Include all accounts (agency + clients)
            accountIds = [accountId, ...clientAccountIds];
          }

          // Add client accounts to map
          clientAccess.forEach((ca: any) => {
            const acc = ca.accounts;
            if (acc) {
              accountsMap[ca.client_account_id] = {
                id: ca.client_account_id,
                name: acc.business_name || 'Unnamed client'
              };
            }
          });
        }
      }
    }

    // Get user's dismissed notification IDs
    const { data: dismissedData } = await supabase
      .from('notification_dismissals')
      .select('notification_id')
      .eq('user_id', user.id);

    const dismissedIds = (dismissedData || []).map(d => d.notification_id);

    // Fetch notifications - filter by account(s) AND (user_id is null OR user_id matches)
    // Also exclude notifications the user has dismissed
    let query = supabase
      .from('notifications')
      .select('*')
      .in('account_id', accountIds)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Exclude dismissed notifications (both legacy dismissed column and new per-user dismissals)
    // Legacy: dismissed column on notification itself (for backwards compatibility)
    query = query.eq('dismissed', false);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Filter out user-dismissed notifications
    const filteredNotifications = (notifications || []).filter(
      n => !dismissedIds.includes(n.id)
    );

    // Enrich notifications with account info if agency view
    const enrichedNotifications = filteredNotifications.map(notification => ({
      ...notification,
      account_name: agencyView ? (accountsMap[notification.account_id]?.name || 'Unknown') : undefined
    }));

    // Get unread count (across all relevant accounts, excluding user-dismissed)
    const { data: unreadNotifications } = await supabase
      .from('notifications')
      .select('id')
      .in('account_id', accountIds)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('read', false)
      .eq('dismissed', false);

    const unreadCount = (unreadNotifications || []).filter(
      n => !dismissedIds.includes(n.id)
    ).length;

    // Get per-account unread counts for agency view
    let accountUnreadCounts: Record<string, number> = {};
    if (agencyView && accountIds.length > 1) {
      for (const accId of accountIds) {
        const { data: accUnread } = await supabase
          .from('notifications')
          .select('id')
          .eq('account_id', accId)
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .eq('read', false)
          .eq('dismissed', false);

        accountUnreadCounts[accId] = (accUnread || []).filter(
          n => !dismissedIds.includes(n.id)
        ).length;
      }
    }

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount: unreadCount,
      // Agency-specific data
      ...(agencyView && {
        accounts: Object.values(accountsMap),
        accountUnreadCounts,
        isAgencyView: true
      })
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createServiceRoleClient();
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
    const { action, notificationIds, agencyView } = body;

    if (!action || !['mark_read', 'mark_all_read', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // For agency view, get all managed account IDs
    let accountIds: string[] = [accountId];
    if (agencyView) {
      const { data: currentAccount } = await supabase
        .from('accounts')
        .select('id, is_agncy')
        .eq('id', accountId)
        .single();

      if (currentAccount?.is_agncy) {
        const { data: clientAccess } = await supabaseAdmin
          .from('agncy_client_access')
          .select('client_account_id')
          .eq('agency_account_id', accountId)
          .eq('status', 'active');

        if (clientAccess && clientAccess.length > 0) {
          accountIds = [accountId, ...clientAccess.map((ca: any) => ca.client_account_id)];
        }
      }
    }

    if (action === 'mark_all_read') {
      // Mark all notifications as read for relevant account(s) AND user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('account_id', accountIds)
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
      // For agency view, allow marking notifications from any managed account
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('account_id', accountIds)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else if (action === 'dismiss') {
      // Per-user dismissal: insert into notification_dismissals table
      // This only affects the current user, not other users viewing the same notification
      const dismissals = notificationIds.map(notificationId => ({
        notification_id: notificationId,
        user_id: user.id,
      }));

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('notification_dismissals')
        .upsert(dismissals, {
          onConflict: 'notification_id,user_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error dismissing notifications:', error);
        return NextResponse.json({ error: 'Failed to dismiss notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
