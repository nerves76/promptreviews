import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { resolveTaskWithAgencyAccess } from '@/app/(app)/api/utils/resolveTaskWithAgencyAccess';

/**
 * GET /api/work-manager/time-entries?taskId=xxx
 * Returns all time entries for a task, ordered by entry_date DESC
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify task belongs to the selected account (or agency manages the task's account)
    const task = await resolveTaskWithAgencyAccess(supabaseAdmin, taskId, accountId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch time entries
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('wm_time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching time entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
    }

    // Get creator info
    const creatorIds = [...new Set((entries || []).map(e => e.created_by).filter(Boolean))];
    let usersMap: Record<string, any> = {};

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', creatorIds);

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) || []);

      if (profiles) {
        usersMap = profiles.reduce((acc, p) => {
          acc[p.id] = {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            avatar_url: p.avatar_url,
            email: emailMap.get(p.id) || null,
          };
          return acc;
        }, {} as Record<string, any>);
      }

      creatorIds.forEach((id) => {
        if (!usersMap[id]) {
          usersMap[id] = {
            id,
            first_name: null,
            last_name: null,
            avatar_url: null,
            email: emailMap.get(id) || null,
          };
        }
      });
    }

    // Transform entries with creator info
    const transformedEntries = (entries || []).map(entry => ({
      ...entry,
      creator: entry.created_by ? usersMap[entry.created_by] || null : null,
    }));

    // Calculate total minutes
    const total_minutes = (entries || []).reduce((sum, e) => sum + e.duration_minutes, 0);

    return NextResponse.json({ entries: transformedEntries, total_minutes });
  } catch (error) {
    console.error('Error in GET /api/work-manager/time-entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/work-manager/time-entries
 * Creates a new time entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, duration_minutes, entry_date, note } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    if (!duration_minutes || typeof duration_minutes !== 'number' || duration_minutes <= 0) {
      return NextResponse.json({ error: 'duration_minutes must be a positive number' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify task belongs to the selected account (or agency manages the task's account)
    const task = await resolveTaskWithAgencyAccess(supabaseAdmin, task_id, accountId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create the entry
    const { data: newEntry, error: createError } = await supabaseAdmin
      .from('wm_time_entries')
      .insert({
        task_id,
        account_id: task.account_id,
        duration_minutes,
        entry_date: entry_date || new Date().toISOString().split('T')[0],
        note: note?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating time entry:', createError);
      return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
    }

    // Get creator info
    const { data: creatorProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', user.id)
      .single();

    const creator = {
      id: user.id,
      email: user.email,
      first_name: creatorProfile?.first_name || null,
      last_name: creatorProfile?.last_name || null,
      avatar_url: creatorProfile?.avatar_url || null,
    };

    return NextResponse.json({
      entry: { ...newEntry, creator },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/time-entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/work-manager/time-entries?entryId=xxx
 * Deletes a time entry (own entries only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch entry and verify ownership + account (including agency access)
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('wm_time_entries')
      .select('id, account_id, created_by, task_id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Verify access: entry's account matches or agency manages the account
    const task = await resolveTaskWithAgencyAccess(supabaseAdmin, entry.task_id, accountId);
    if (!task) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    if (entry.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own time entries' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('wm_time_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) {
      console.error('Error deleting time entry:', deleteError);
      return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/time-entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
