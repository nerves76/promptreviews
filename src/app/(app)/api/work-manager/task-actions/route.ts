import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { WMActionType } from '@/types/workManager';
import { sendMentionNotificationEmail } from '@/lib/email/mentionNotification';

/**
 * GET /api/work-manager/task-actions?taskId=xxx
 * Returns activity log for a task
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

    // Fetch the task to verify access
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', task.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch actions
    const { data: actions, error: actionsError } = await supabaseAdmin
      .from('wm_task_actions')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (actionsError) {
      console.error('Error fetching task actions:', actionsError);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    // Get user info for creators from user_profiles
    const creatorIds = [...new Set(actions?.map(a => a.created_by).filter(Boolean) || [])];
    let usersMap: Record<string, any> = {};

    if (creatorIds.length > 0) {
      // Get profiles
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', creatorIds);

      // Get emails from auth
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

      // Add users without profiles (just email)
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

    // Transform actions with creator info
    const transformedActions = actions?.map(action => ({
      ...action,
      creator: action.created_by ? usersMap[action.created_by] || null : null,
    })) || [];

    return NextResponse.json({ actions: transformedActions });
  } catch (error) {
    console.error('Error in GET /api/work-manager/task-actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/work-manager/task-actions
 * Creates a new action (typically a note)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, activity_type, content, metadata, mentioned_user_ids } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 });
    }

    // Validate activity_type
    const validTypes: WMActionType[] = [
      'note',
      'status_change',
      'assignment_change',
      'priority_change',
      'due_date_change',
      'created',
      'updated',
    ];
    if (!validTypes.includes(activity_type)) {
      return NextResponse.json({ error: 'Invalid activity_type' }, { status: 400 });
    }

    // For notes, content is required
    if (activity_type === 'note' && (!content || content.trim().length === 0)) {
      return NextResponse.json({ error: 'content is required for notes' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch the task to verify access
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', task.account_id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the action
    const { data: newAction, error: createError } = await supabaseAdmin
      .from('wm_task_actions')
      .insert({
        task_id,
        account_id: task.account_id,
        activity_type,
        content: content?.trim() || null,
        metadata: metadata || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task action:', createError);
      return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
    }

    // Get creator info from user_profiles
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

    // Send mention notifications asynchronously (don't block response)
    if (mentioned_user_ids && Array.isArray(mentioned_user_ids) && mentioned_user_ids.length > 0) {
      // Fetch task details for the notification
      const { data: taskDetails } = await supabaseAdmin
        .from('wm_tasks')
        .select('title, board_id')
        .eq('id', task_id)
        .single();

      // Fetch board details
      const { data: boardDetails } = await supabaseAdmin
        .from('wm_boards')
        .select('name, business_name')
        .eq('id', taskDetails?.board_id)
        .single();

      // Get mentioned users' emails and names
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) || []);

      // Get profiles for names
      const { data: mentionedProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', mentioned_user_ids);

      const profileMap = new Map(mentionedProfiles?.map((p: any) => [p.id, p]) || []);

      // Send notifications (fire and forget)
      const creatorName = creator.first_name
        ? `${creator.first_name} ${creator.last_name || ''}`.trim()
        : creator.email || 'Someone';

      for (const mentionedUserId of mentioned_user_ids) {
        // Don't notify yourself
        if (mentionedUserId === user.id) continue;

        const mentionedEmail = emailMap.get(mentionedUserId);
        const mentionedProfile = profileMap.get(mentionedUserId);
        const mentionedName = mentionedProfile?.first_name
          ? `${mentionedProfile.first_name} ${mentionedProfile.last_name || ''}`.trim()
          : undefined;

        if (mentionedEmail) {
          sendMentionNotificationEmail({
            to: mentionedEmail,
            mentionedUserName: mentionedName,
            mentionerName: creatorName,
            taskTitle: taskDetails?.title || 'a task',
            taskId: task_id,
            boardId: taskDetails?.board_id,
            businessName: boardDetails?.business_name || boardDetails?.name,
            commentContent: content?.trim() || '',
          }).catch((err) => {
            console.error('Failed to send mention notification:', err);
          });
        }
      }
    }

    return NextResponse.json({
      action: {
        ...newAction,
        creator,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/task-actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
