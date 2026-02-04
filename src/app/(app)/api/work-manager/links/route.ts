/**
 * Work Manager Links API
 *
 * GET    - Fetch links for a task or resource
 * POST   - Create a link (for task or resource)
 * PATCH  - Update a link
 * DELETE - Delete a link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const resourceId = searchParams.get('resourceId');

    // Validate that exactly one is provided
    if ((!taskId && !resourceId) || (taskId && resourceId)) {
      return NextResponse.json(
        { error: 'Exactly one of taskId or resourceId must be provided' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify the parent belongs to the account and fetch links
    if (taskId) {
      const { data: task, error: taskError } = await supabaseAdmin
        .from('wm_tasks')
        .select('id, account_id')
        .eq('id', taskId)
        .eq('account_id', accountId)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const { data: links, error: linksError } = await supabaseAdmin
        .from('wm_links')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('Error fetching links:', linksError);
        return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
      }

      return NextResponse.json({ links: links || [] });
    }

    if (resourceId) {
      const { data: resource, error: resourceError } = await supabaseAdmin
        .from('wm_resources')
        .select('id, account_id')
        .eq('id', resourceId)
        .eq('account_id', accountId)
        .single();

      if (resourceError || !resource) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      const { data: links, error: linksError } = await supabaseAdmin
        .from('wm_links')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('Error fetching links:', linksError);
        return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
      }

      return NextResponse.json({ links: links || [] });
    }

    return NextResponse.json({ links: [] });
  } catch (error) {
    console.error('Error in GET /api/work-manager/links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, resource_id, name, url } = body;

    // Validate that exactly one of task_id or resource_id is provided
    if ((!task_id && !resource_id) || (task_id && resource_id)) {
      return NextResponse.json(
        { error: 'Exactly one of task_id or resource_id must be provided' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!url || url.trim().length === 0) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify the task or resource belongs to the account
    if (task_id) {
      const { data: task, error: taskError } = await supabaseAdmin
        .from('wm_tasks')
        .select('id, account_id')
        .eq('id', task_id)
        .eq('account_id', accountId)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    }

    if (resource_id) {
      const { data: resource, error: resourceError } = await supabaseAdmin
        .from('wm_resources')
        .select('id, account_id')
        .eq('id', resource_id)
        .eq('account_id', accountId)
        .single();

      if (resourceError || !resource) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
    }

    // Create the link
    const { data: newLink, error: createError } = await supabaseAdmin
      .from('wm_links')
      .insert({
        task_id: task_id || null,
        resource_id: resource_id || null,
        name: name.trim(),
        url: url.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating link:', createError);
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }

    return NextResponse.json({ link: newLink }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { link_id, name, url } = body;

    if (!link_id) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!url || url.trim().length === 0) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the link to verify ownership
    const { data: link, error: linkError } = await supabaseAdmin
      .from('wm_links')
      .select('id, task_id, resource_id')
      .eq('id', link_id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify the parent (task or resource) belongs to the account
    if (link.task_id) {
      const { data: task, error: taskError } = await supabaseAdmin
        .from('wm_tasks')
        .select('id, account_id')
        .eq('id', link.task_id)
        .eq('account_id', accountId)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }
    }

    if (link.resource_id) {
      const { data: resource, error: resourceError } = await supabaseAdmin
        .from('wm_resources')
        .select('id, account_id')
        .eq('id', link.resource_id)
        .eq('account_id', accountId)
        .single();

      if (resourceError || !resource) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await supabaseAdmin
      .from('wm_links')
      .update({
        name: name.trim(),
        url: url.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', link_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating link:', updateError);
      return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
    }

    return NextResponse.json({ link: updatedLink });
  } catch (error) {
    console.error('Error in PATCH /api/work-manager/links:', error);
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

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the link to verify ownership
    const { data: link, error: linkError } = await supabaseAdmin
      .from('wm_links')
      .select('id, task_id, resource_id')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify the parent (task or resource) belongs to the account
    if (link.task_id) {
      const { data: task, error: taskError } = await supabaseAdmin
        .from('wm_tasks')
        .select('id, account_id')
        .eq('id', link.task_id)
        .eq('account_id', accountId)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }
    }

    if (link.resource_id) {
      const { data: resource, error: resourceError } = await supabaseAdmin
        .from('wm_resources')
        .select('id, account_id')
        .eq('id', link.resource_id)
        .eq('account_id', accountId)
        .single();

      if (resourceError || !resource) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }
    }

    // Delete the link
    const { error: deleteError } = await supabaseAdmin
      .from('wm_links')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
