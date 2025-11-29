/**
 * Notification Preferences API
 *
 * GET: Fetch notification preferences for the current account
 * PUT: Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get or create notification preferences
    let { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No preferences exist, create default ones
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ account_id: accountId })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating notification preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      preferences = newPrefs;
    } else if (error) {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error in notification preferences API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();

    // Allowed fields to update
    const allowedFields = [
      'in_app_gbp_changes',
      'in_app_new_reviews',
      'in_app_team_updates',
      'in_app_subscription_updates',
      'in_app_announcements',
      'email_gbp_changes',
      'email_new_reviews',
      'email_team_updates',
      'email_subscription_updates',
      'email_announcements',
      'email_digest_frequency'
    ];

    // Filter to only allowed fields
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Upsert preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        account_id: accountId,
        ...updates
      }, {
        onConflict: 'account_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    // Also sync email_new_reviews to the legacy accounts.email_review_notifications field
    if (updates.email_new_reviews !== undefined) {
      await supabase
        .from('accounts')
        .update({ email_review_notifications: updates.email_new_reviews })
        .eq('id', accountId);
    }

    return NextResponse.json({ success: true, preferences });

  } catch (error) {
    console.error('Error in notification preferences API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
