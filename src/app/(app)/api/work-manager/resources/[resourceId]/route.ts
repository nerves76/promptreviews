/**
 * Work Manager Resource API
 *
 * GET    - Get a single resource
 * PATCH  - Update a resource
 * DELETE - Delete a resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { resolveResourceWithAgencyAccess } from '@/app/(app)/api/utils/resolveResourceWithAgencyAccess';
import { WMResourceCategory, WMTaskPriority } from '@/types/workManager';

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify resource belongs to the account (or agency manages it)
    const resolvedResource = await resolveResourceWithAgencyAccess(supabaseAdmin, resourceId, accountId);

    if (!resolvedResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Fetch resource with links and linked tasks
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('wm_resources')
      .select(`
        *,
        wm_links (id, name, url, created_by, created_at),
        wm_task_resource_links (
          id,
          task_id,
          created_at,
          wm_tasks (id, title, status, priority)
        )
      `)
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Get creator info
    let creator = null;
    if (resource.created_by) {
      const { data: creatorData } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('id', resource.created_by)
        .single();
      creator = creatorData;
    }

    // Transform response
    const transformedResource = {
      ...resource,
      creator,
      links: resource.wm_links || [],
      linked_tasks: (resource.wm_task_resource_links || []).map((link: any) => ({
        id: link.id,
        task_id: link.task_id,
        resource_id: resource.id,
        created_at: link.created_at,
        task: link.wm_tasks,
      })),
      wm_links: undefined,
      wm_task_resource_links: undefined,
    };

    return NextResponse.json({ resource: transformedResource });
  } catch (error) {
    console.error('Error in GET /api/work-manager/resources/[resourceId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, priority, tags } = body;

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify resource belongs to the account (or agency manages it)
    const existingResource = await resolveResourceWithAgencyAccess(supabaseAdmin, resourceId, accountId);

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, any> = {};

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (category !== undefined) {
      const validCategories: WMResourceCategory[] = ['general', 'documentation', 'tool', 'reference', 'template', 'guide'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updateData.category = category;
    }

    if (priority !== undefined) {
      const validPriorities: WMTaskPriority[] = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
      updateData.priority = priority;
    }

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    // Update the resource
    const { data: updatedResource, error: updateError } = await supabaseAdmin
      .from('wm_resources')
      .update(updateData)
      .eq('id', resourceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating resource:', updateError);
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }

    return NextResponse.json({ resource: updatedResource });
  } catch (error) {
    console.error('Error in PATCH /api/work-manager/resources/[resourceId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify resource belongs to the account (or agency manages it)
    const existingResource = await resolveResourceWithAgencyAccess(supabaseAdmin, resourceId, accountId);

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Delete the resource (cascade will handle links and task-resource-links)
    const { error: deleteError } = await supabaseAdmin
      .from('wm_resources')
      .delete()
      .eq('id', resourceId);

    if (deleteError) {
      console.error('Error deleting resource:', deleteError);
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work-manager/resources/[resourceId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
