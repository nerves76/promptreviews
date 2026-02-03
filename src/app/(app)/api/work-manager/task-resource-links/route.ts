/**
 * Work Manager Task-Resource Links API
 *
 * POST   - Link a task to a resource
 * DELETE - Unlink a task from a resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, resource_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    if (!resource_id) {
      return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify task belongs to the account
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id, title, status, priority')
      .eq('id', task_id)
      .eq('account_id', accountId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify resource belongs to the account
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('wm_resources')
      .select('id, account_id, title, category')
      .eq('id', resource_id)
      .eq('account_id', accountId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if link already exists
    const { data: existingLink } = await supabaseAdmin
      .from('wm_task_resource_links')
      .select('id')
      .eq('task_id', task_id)
      .eq('resource_id', resource_id)
      .single();

    if (existingLink) {
      return NextResponse.json({ error: 'Task is already linked to this resource' }, { status: 409 });
    }

    // Create the link
    const { data: newLink, error: createError } = await supabaseAdmin
      .from('wm_task_resource_links')
      .insert({
        task_id,
        resource_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task-resource link:', createError);
      return NextResponse.json({ error: 'Failed to link task to resource' }, { status: 500 });
    }

    // Return the link with task and resource info
    return NextResponse.json({
      link: {
        ...newLink,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
        resource: {
          id: resource.id,
          title: resource.title,
          category: resource.category,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/task-resource-links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    const taskId = searchParams.get('taskId');
    const resourceId = searchParams.get('resourceId');

    // Allow deletion by linkId OR by task_id+resource_id combo
    if (!linkId && (!taskId || !resourceId)) {
      return NextResponse.json(
        { error: 'Either linkId or both taskId and resourceId are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('wm_task_resource_links')
      .select('id, task_id, resource_id');

    if (linkId) {
      query = query.eq('id', linkId);
    } else {
      query = query.eq('task_id', taskId!).eq('resource_id', resourceId!);
    }

    const { data: link, error: linkError } = await query.single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify task belongs to the account (this also verifies ownership)
    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_tasks')
      .select('id, account_id')
      .eq('id', link.task_id)
      .eq('account_id', accountId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Delete the link
    const { error: deleteError } = await supabaseAdmin
      .from('wm_task_resource_links')
      .delete()
      .eq('id', link.id);

    if (deleteError) {
      console.error('Error deleting task-resource link:', deleteError);
      return NextResponse.json({ error: 'Failed to unlink task from resource' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/task-resource-links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
