import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

/**
 * POST /api/work-manager/tasks/from-outline
 * Creates a task from a web page outline (page plan).
 * Auto-creates a board if none exists for the account.
 * Creates a wm_links entry pointing back to the page plan.
 * Returns: { task, board_id }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { outline_id } = body as { outline_id: string };

    if (!outline_id) {
      return NextResponse.json({ error: 'outline_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Get account ID from header
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the outline and verify it belongs to this account
    const { data: outline, error: outlineError } = await supabaseAdmin
      .from('web_page_outlines')
      .select('id, keyword_phrase, tone, page_purpose, business_name')
      .eq('id', outline_id)
      .eq('account_id', accountId)
      .single();

    if (outlineError || !outline) {
      return NextResponse.json({ error: 'Page plan not found' }, { status: 404 });
    }

    // Get or create board for this account
    let boardId: string;

    const { data: existingBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (existingBoard) {
      boardId = existingBoard.id;
    } else {
      // Get account info for default board name
      const { data: accountData } = await supabaseAdmin
        .from('accounts')
        .select(`
          id,
          businesses (
            name
          )
        `)
        .eq('id', accountId)
        .single();

      const business = (accountData as any)?.businesses?.[0];
      const defaultName = business?.name || null;

      // Create new board
      const { data: newBoard, error: createBoardError } = await supabaseAdmin
        .from('wm_boards')
        .insert({
          account_id: accountId,
          name: defaultName,
          status_labels: DEFAULT_WM_STATUS_LABELS,
          created_by: user.id,
        })
        .select()
        .single();

      if (createBoardError || !newBoard) {
        console.error('Error creating board:', createBoardError);
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
      }

      boardId = newBoard.id;
    }

    // Get max sort_order for backlog status
    const { data: maxOrderTask } = await supabaseAdmin
      .from('wm_tasks')
      .select('sort_order')
      .eq('board_id', boardId)
      .eq('status', 'backlog')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderTask?.sort_order ?? 0) + 1;

    // Build title and description
    const title = `Create page: ${outline.keyword_phrase}`;
    const descriptionParts: string[] = [];
    if (outline.page_purpose) {
      descriptionParts.push(`Page type: ${outline.page_purpose}`);
    }
    descriptionParts.push(`Tone: ${outline.tone}`);
    descriptionParts.push(`Business: ${outline.business_name}`);
    const description = descriptionParts.join('\n');

    // Create the task
    const { data: newTask, error: createTaskError } = await supabaseAdmin
      .from('wm_tasks')
      .insert({
        board_id: boardId,
        account_id: accountId,
        title,
        description,
        status: 'backlog',
        priority: 'medium',
        due_date: null,
        assigned_to: null,
        sort_order: nextSortOrder,
        created_by: user.id,
        source_type: 'web_page_outline',
        source_reference: outline_id,
      })
      .select()
      .single();

    if (createTaskError || !newTask) {
      console.error('Error creating task:', createTaskError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Create a wm_links entry pointing back to the page plan
    await supabaseAdmin.from('wm_links').insert({
      task_id: newTask.id,
      name: outline.keyword_phrase,
      url: `/dashboard/web-page-outlines/${outline_id}`,
      created_by: user.id,
    });

    // Log the creation action
    await supabaseAdmin.from('wm_task_actions').insert({
      task_id: newTask.id,
      account_id: accountId,
      activity_type: 'created',
      content: `Task created from page plan: "${outline.keyword_phrase}"`,
      metadata: {
        status: 'backlog',
        priority: 'medium',
        source_type: 'web_page_outline',
        source_reference: outline_id,
      },
      created_by: user.id,
    });

    return NextResponse.json({
      task: newTask,
      board_id: boardId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/tasks/from-outline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
