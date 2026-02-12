/**
 * Agency Work Manager Board API
 *
 * GET - Get or create the agency's own work manager board,
 *       returning tasks with linked client task data joined in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';
import { SupabaseClient } from '@supabase/supabase-js';

// Default SEO resources to add to new boards
const DEFAULT_RESOURCES = [
  {
    title: "Beginner's Guide to SEO",
    description: "A comprehensive guide to SEO fundamentals by Moz - perfect for learning the basics of search engine optimization.",
    category: 'guide',
    priority: 'medium',
    tags: ['seo', 'learning', 'fundamentals'],
    sort_order: 1,
    link: { name: "Moz Beginner's Guide to SEO", url: 'https://moz.com/beginners-guide-to-seo' },
  },
  {
    title: 'Search Engine Journal',
    description: 'Leading SEO and digital marketing publication with news, guides, and industry insights.',
    category: 'reference',
    priority: 'medium',
    tags: ['seo', 'news', 'publication'],
    sort_order: 2,
    link: { name: 'Search Engine Journal', url: 'https://www.searchenginejournal.com' },
  },
  {
    title: 'Search Engine Land',
    description: 'Industry news source covering SEO, SEM, and search marketing topics.',
    category: 'reference',
    priority: 'medium',
    tags: ['seo', 'news', 'publication'],
    sort_order: 3,
    link: { name: 'Search Engine Land', url: 'https://searchengineland.com' },
  },
];

async function createDefaultResources(supabase: SupabaseClient, boardId: string, accountId: string) {
  try {
    for (const resource of DEFAULT_RESOURCES) {
      const { data: newResource, error: resourceError } = await supabase
        .from('wm_resources')
        .insert({
          board_id: boardId,
          account_id: accountId,
          title: resource.title,
          description: resource.description,
          category: resource.category,
          priority: resource.priority,
          tags: resource.tags,
          sort_order: resource.sort_order,
        })
        .select('id')
        .single();

      if (resourceError) {
        console.error('Error creating default resource:', resourceError);
        continue;
      }

      if (newResource && resource.link) {
        const { error: linkError } = await supabase
          .from('wm_links')
          .insert({
            resource_id: newResource.id,
            name: resource.link.name,
            url: resource.link.url,
          });

        if (linkError) {
          console.error('Error creating default link:', linkError);
        }
      }
    }
  } catch (error) {
    console.error('Error creating default resources:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Verify this is an agency account
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id, is_agncy, business_name')
      .eq('id', accountId)
      .single();

    if (!account?.is_agncy) {
      return NextResponse.json({ error: 'Not an agency account' }, { status: 403 });
    }

    // Get or create board
    let { data: board } = await supabaseAdmin
      .from('wm_boards')
      .select('id, account_id, name, status_labels, show_time_to_client, created_at, updated_at')
      .eq('account_id', accountId)
      .single();

    if (!board) {
      const { data: newBoard, error: createError } = await supabaseAdmin
        .from('wm_boards')
        .insert({
          account_id: accountId,
          name: account.business_name || 'Agency Board',
          status_labels: DEFAULT_WM_STATUS_LABELS,
          created_by: user.id,
        })
        .select('id, account_id, name, status_labels, show_time_to_client, created_at, updated_at')
        .single();

      if (createError || !newBoard) {
        console.error('Error creating agency board:', createError);
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
      }
      board = newBoard;

      // Add default SEO resources for new boards
      await createDefaultResources(supabaseAdmin, newBoard.id, accountId);
    }

    // Fetch agency tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('wm_tasks')
      .select(`
        id, board_id, account_id, title, description, status, priority,
        due_date, assigned_to, sort_order, created_by, created_at, updated_at,
        source_type, source_reference, linked_task_id, linked_account_id
      `)
      .eq('board_id', board.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Error fetching agency tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // For linked tasks, fetch the client task data + client name + client board status labels
    const linkedTaskIds = (tasks || [])
      .filter(t => t.linked_task_id)
      .map(t => t.linked_task_id as string);

    const linkedAccountIds = (tasks || [])
      .filter(t => t.linked_account_id)
      .map(t => t.linked_account_id as string);

    let linkedTaskMap = new Map<string, {
      title: string;
      description: string | null;
      priority: string;
      due_date: string | null;
      status: string;
    }>();
    let clientNameMap = new Map<string, string | null>();
    let clientBoardLabelsMap = new Map<string, Record<string, string> | null>();

    if (linkedTaskIds.length > 0) {
      // Fetch linked client tasks
      const { data: linkedTasks } = await supabaseAdmin
        .from('wm_tasks')
        .select('id, title, description, priority, due_date, status')
        .in('id', linkedTaskIds);

      if (linkedTasks) {
        linkedTasks.forEach(lt => {
          linkedTaskMap.set(lt.id, {
            title: lt.title,
            description: lt.description,
            priority: lt.priority,
            due_date: lt.due_date,
            status: lt.status,
          });
        });
      }
    }

    if (linkedAccountIds.length > 0) {
      const uniqueAccountIds = [...new Set(linkedAccountIds)];

      // Fetch client names
      const { data: clientAccounts } = await supabaseAdmin
        .from('accounts')
        .select('id, business_name')
        .in('id', uniqueAccountIds);

      if (clientAccounts) {
        clientAccounts.forEach(ca => {
          clientNameMap.set(ca.id, ca.business_name);
        });
      }

      // Fetch client board status labels
      const { data: clientBoards } = await supabaseAdmin
        .from('wm_boards')
        .select('account_id, status_labels')
        .in('account_id', uniqueAccountIds);

      if (clientBoards) {
        clientBoards.forEach(cb => {
          clientBoardLabelsMap.set(cb.account_id, cb.status_labels);
        });
      }
    }

    // Fetch assignee info
    const assigneeIds = [...new Set((tasks || []).filter(t => t.assigned_to).map(t => t.assigned_to as string))];
    let assigneeMap = new Map<string, { first_name: string | null; last_name: string | null; email: string }>();

    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', assigneeIds);

      if (profiles) {
        profiles.forEach(p => {
          assigneeMap.set(p.id, { first_name: p.first_name, last_name: p.last_name, email: p.email });
        });
      }
    }

    // Aggregate time spent per task
    const allTaskIds = (tasks || []).map(t => t.id);
    const timeSpentMap = new Map<string, number>();

    if (allTaskIds.length > 0) {
      const { data: timeEntries } = await supabaseAdmin
        .from('wm_time_entries')
        .select('task_id, duration_minutes')
        .in('task_id', allTaskIds);

      if (timeEntries) {
        for (const entry of timeEntries) {
          const current = timeSpentMap.get(entry.task_id) || 0;
          timeSpentMap.set(entry.task_id, current + entry.duration_minutes);
        }
      }
    }

    // Build response tasks with linked data
    const enrichedTasks = (tasks || []).map(task => {
      const linkedData = task.linked_task_id ? linkedTaskMap.get(task.linked_task_id) : null;
      const clientName = task.linked_account_id ? clientNameMap.get(task.linked_account_id) : null;
      const clientLabels = task.linked_account_id ? clientBoardLabelsMap.get(task.linked_account_id) : null;
      const assignee = task.assigned_to ? assigneeMap.get(task.assigned_to) : null;

      return {
        ...task,
        total_time_spent_minutes: timeSpentMap.get(task.id) || 0,
        assignee: assignee ? {
          id: task.assigned_to,
          first_name: assignee.first_name,
          last_name: assignee.last_name,
          email: assignee.email,
        } : null,
        linked_task: linkedData ? {
          title: linkedData.title,
          description: linkedData.description,
          priority: linkedData.priority,
          due_date: linkedData.due_date,
          status: linkedData.status,
          client_name: clientName ?? null,
          client_board_status_labels: clientLabels ?? null,
        } : null,
      };
    });

    return NextResponse.json({
      board: {
        id: board.id,
        account_id: board.account_id,
        name: board.name,
        status_labels: board.status_labels || DEFAULT_WM_STATUS_LABELS,
        show_time_to_client: (board as any).show_time_to_client ?? false,
        business_name: account.business_name,
        created_at: board.created_at,
        updated_at: board.updated_at,
      },
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error('Error in GET /api/agency/work-manager/board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
