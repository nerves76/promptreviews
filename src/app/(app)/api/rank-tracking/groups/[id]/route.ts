import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/rank-tracking/groups/[id]
 * Get a single keyword group with summary stats.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get group with keyword count
    const { data: group, error: groupError } = await serviceSupabase
      .from('rank_keyword_groups')
      .select(`
        *,
        keyword_count:rank_group_keywords(count)
      `)
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (groupError && groupError.code !== 'PGRST116') {
      console.error('❌ [RankTracking] Failed to fetch group:', groupError);
      return NextResponse.json(
        { error: 'Failed to fetch group' },
        { status: 500 }
      );
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get latest check summary for this group
    const { data: latestChecks } = await serviceSupabase
      .from('rank_checks')
      .select('position, keyword_id')
      .eq('group_id', groupId)
      .order('checked_at', { ascending: false })
      .limit(100);

    // Calculate summary stats
    let avgPosition = null;
    let keywordsInTop10 = 0;
    let keywordsRanking = 0;

    if (latestChecks && latestChecks.length > 0) {
      // Group by keyword_id to get latest position per keyword
      const latestByKeyword = new Map<string, number | null>();
      for (const check of latestChecks) {
        if (!latestByKeyword.has(check.keyword_id)) {
          latestByKeyword.set(check.keyword_id, check.position);
        }
      }

      const positions = Array.from(latestByKeyword.values());
      keywordsRanking = positions.filter((p) => p !== null).length;
      keywordsInTop10 = positions.filter((p) => p !== null && p <= 10).length;

      const validPositions = positions.filter((p) => p !== null) as number[];
      if (validPositions.length > 0) {
        avgPosition = validPositions.reduce((a, b) => a + b, 0) / validPositions.length;
      }
    }

    return NextResponse.json({
      group: {
        id: group.id,
        accountId: group.account_id,
        name: group.name,
        device: group.device,
        locationCode: group.location_code,
        locationName: group.location_name,
        scheduleFrequency: group.schedule_frequency,
        scheduleDayOfWeek: group.schedule_day_of_week,
        scheduleDayOfMonth: group.schedule_day_of_month,
        scheduleHour: group.schedule_hour,
        nextScheduledAt: group.next_scheduled_at,
        lastScheduledRunAt: group.last_scheduled_run_at,
        lastCheckedAt: group.last_checked_at,
        isEnabled: group.is_enabled,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        keywordCount: Array.isArray(group.keyword_count) ? group.keyword_count.length : 0,
        summary: {
          avgPosition,
          keywordsInTop10,
          keywordsRanking,
        },
      },
    });
  } catch (error) {
    console.error('❌ [RankTracking] Group GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rank-tracking/groups/[id]
 * Update a keyword group.
 *
 * Body:
 * - name: string (optional)
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null (optional)
 * - scheduleDayOfWeek: number (0-6, for weekly)
 * - scheduleDayOfMonth: number (1-28, for monthly)
 * - scheduleHour: number (0-23)
 * - isEnabled: boolean (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: existing } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour,
      isEnabled,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (scheduleFrequency !== undefined) {
      if (scheduleFrequency !== null && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
        return NextResponse.json(
          { error: 'scheduleFrequency must be "daily", "weekly", "monthly", or null' },
          { status: 400 }
        );
      }
      updates.schedule_frequency = scheduleFrequency;

      // Recalculate next scheduled time if frequency is being set
      if (scheduleFrequency) {
        const now = new Date();
        const targetHour = scheduleHour ?? 9;

        if (scheduleFrequency === 'daily') {
          const next = new Date(now);
          next.setHours(targetHour, 0, 0, 0);
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
          updates.next_scheduled_at = next.toISOString();
        } else if (scheduleFrequency === 'weekly') {
          const targetDay = scheduleDayOfWeek ?? 1;
          const next = new Date(now);
          next.setHours(targetHour, 0, 0, 0);
          const daysUntilTarget = (targetDay - next.getDay() + 7) % 7;
          next.setDate(next.getDate() + (daysUntilTarget || 7));
          updates.next_scheduled_at = next.toISOString();
        } else if (scheduleFrequency === 'monthly') {
          const targetDay = scheduleDayOfMonth ?? 1;
          const next = new Date(now);
          next.setHours(targetHour, 0, 0, 0);
          next.setDate(targetDay);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
          updates.next_scheduled_at = next.toISOString();
        }
      } else {
        updates.next_scheduled_at = null;
      }
    }

    if (scheduleDayOfWeek !== undefined) {
      updates.schedule_day_of_week = scheduleDayOfWeek;
    }

    if (scheduleDayOfMonth !== undefined) {
      updates.schedule_day_of_month = scheduleDayOfMonth;
    }

    if (scheduleHour !== undefined) {
      updates.schedule_hour = scheduleHour;
    }

    if (isEnabled !== undefined) {
      updates.is_enabled = isEnabled;
    }

    // Update group
    const { data: group, error: updateError } = await serviceSupabase
      .from('rank_keyword_groups')
      .update(updates)
      .eq('id', groupId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [RankTracking] Failed to update group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Updated group: ${group.name} (${group.id})`);

    return NextResponse.json({
      group: {
        id: group.id,
        accountId: group.account_id,
        name: group.name,
        device: group.device,
        locationCode: group.location_code,
        locationName: group.location_name,
        scheduleFrequency: group.schedule_frequency,
        scheduleDayOfWeek: group.schedule_day_of_week,
        scheduleDayOfMonth: group.schedule_day_of_month,
        scheduleHour: group.schedule_hour,
        nextScheduledAt: group.next_scheduled_at,
        lastScheduledRunAt: group.last_scheduled_run_at,
        lastCheckedAt: group.last_checked_at,
        isEnabled: group.is_enabled,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      },
      updated: true,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Group PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rank-tracking/groups/[id]
 * Delete a keyword group (cascades to keywords and checks).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: existing } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id, name')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Delete group (cascade will delete related keywords and checks)
    const { error: deleteError } = await serviceSupabase
      .from('rank_keyword_groups')
      .delete()
      .eq('id', groupId)
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('❌ [RankTracking] Failed to delete group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Deleted group: ${existing.name} (${groupId})`);

    return NextResponse.json({ success: true, deleted: groupId });
  } catch (error) {
    console.error('❌ [RankTracking] Group DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
