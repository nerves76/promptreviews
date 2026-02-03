/**
 * Work Manager Resources API
 *
 * GET  - List resources for a board
 * POST - Create a new resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { WMResourceCategory, WMTaskPriority } from '@/types/workManager';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify board belongs to the selected account
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', boardId)
      .eq('account_id', accountId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Fetch resources with links and linked tasks
    const { data: resources, error: resourcesError } = await supabaseAdmin
      .from('wm_resources')
      .select(`
        *,
        wm_links (id, name, url, created_at),
        wm_task_resource_links (
          id,
          task_id,
          wm_tasks (id, title, status, priority)
        )
      `)
      .eq('board_id', boardId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    // Get unique user IDs for creators
    const userIds = new Set<string>();
    resources?.forEach(resource => {
      if (resource.created_by) userIds.add(resource.created_by);
    });

    // Fetch user info
    let usersMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));

      if (users) {
        usersMap = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Transform resources
    const transformedResources = resources?.map(resource => ({
      ...resource,
      creator: resource.created_by ? usersMap[resource.created_by] || null : null,
      links: resource.wm_links || [],
      linked_tasks: (resource.wm_task_resource_links || []).map((link: any) => ({
        id: link.id,
        task_id: link.task_id,
        resource_id: resource.id,
        task: link.wm_tasks,
      })),
      wm_links: undefined,
      wm_task_resource_links: undefined,
    })) || [];

    return NextResponse.json({ resources: transformedResources });
  } catch (error) {
    console.error('Error in GET /api/work-manager/resources:', error);
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
    const {
      board_id,
      title,
      description,
      category = 'general',
      priority = 'medium',
      tags = [],
    } = body;

    if (!board_id) {
      return NextResponse.json({ error: 'board_id is required' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Validate category
    const validCategories: WMResourceCategory[] = ['general', 'documentation', 'tool', 'reference', 'template', 'guide'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate priority
    const validPriorities: WMTaskPriority[] = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify board belongs to the selected account
    const { data: board, error: boardError } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id')
      .eq('id', board_id)
      .eq('account_id', accountId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get max sort_order
    const { data: maxOrderResource } = await supabaseAdmin
      .from('wm_resources')
      .select('sort_order')
      .eq('board_id', board_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderResource?.sort_order ?? 0) + 1;

    // Create the resource
    const { data: newResource, error: createError } = await supabaseAdmin
      .from('wm_resources')
      .insert({
        board_id,
        account_id: board.account_id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        priority,
        tags: Array.isArray(tags) ? tags : [],
        sort_order: nextSortOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating resource:', createError);
      return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }

    return NextResponse.json({ resource: newResource }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
