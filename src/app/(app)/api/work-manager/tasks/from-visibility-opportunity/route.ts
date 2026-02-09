import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS, WMTaskPriority } from '@/types/workManager';

interface VisibilityOpportunityBody {
  url?: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
  concepts: string[];
  providers: string[];
  frequency: number;
}

const DIFFICULTY_TO_PRIORITY: Record<string, WMTaskPriority> = {
  easy: 'low',
  medium: 'medium',
  hard: 'high',
};

/**
 * POST /api/work-manager/tasks/from-visibility-opportunity
 * Creates a task from an AI research source visibility opportunity.
 * Auto-creates a board if none exists for the account.
 * Creates a wm_links entry attaching the source URL to the task.
 * Returns: { task, board_id }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: VisibilityOpportunityBody = await request.json();
    const { url, domain, difficulty, siteType, strategy, concepts, providers, frequency } = body;

    if (!domain || !difficulty || !strategy) {
      return NextResponse.json({ error: 'domain, difficulty, and strategy are required' }, { status: 400 });
    }

    // Get account ID from header
    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
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

    // Map difficulty to priority
    const priority: WMTaskPriority = DIFFICULTY_TO_PRIORITY[difficulty] || 'medium';

    // Build title: "Get listed on {domain} ({Difficulty})"
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const title = `Get listed on ${domain} (${difficultyLabel})`;

    // Build description
    const descriptionParts: string[] = [
      `**Strategy:** ${strategy}`,
      '',
      `**URL:** ${url || `https://${domain}`}`,
      `**Page type:** ${siteType}`,
    ];
    if (concepts.length > 0) {
      descriptionParts.push(`**Related concepts:** ${concepts.join(', ')}`);
    }
    if (frequency > 0) {
      descriptionParts.push(`**Frequency in AI results:** ${frequency} appearances`);
    }
    const description = descriptionParts.join('\n');

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

    // Create the task
    const { data: newTask, error: createTaskError } = await supabaseAdmin
      .from('wm_tasks')
      .insert({
        board_id: boardId,
        account_id: accountId,
        title,
        description,
        status: 'backlog',
        priority,
        due_date: null,
        assigned_to: null,
        sort_order: nextSortOrder,
        created_by: user.id,
        source_type: 'visibility_opportunity',
        source_reference: url || domain,
        metadata: {
          providers: providers || [],
          concepts: concepts || [],
          sourceUrl: url || null,
          sourceDomain: domain,
          difficulty,
          siteType,
        },
      })
      .select()
      .single();

    if (createTaskError || !newTask) {
      console.error('Error creating task:', createTaskError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Create a wm_links entry attaching the URL to the task
    const linkUrl = url || `https://${domain}`;
    await supabaseAdmin.from('wm_links').insert({
      task_id: newTask.id,
      name: domain,
      url: linkUrl,
      created_by: user.id,
    });

    // Log the creation action
    await supabaseAdmin.from('wm_task_actions').insert({
      task_id: newTask.id,
      account_id: accountId,
      activity_type: 'created',
      content: `Task created from visibility opportunity: "${domain}"`,
      metadata: {
        status: 'backlog',
        priority,
        source_type: 'visibility_opportunity',
        source_reference: url || domain,
        difficulty,
        siteType,
        providers,
        concepts,
      },
      created_by: user.id,
    });

    return NextResponse.json({
      task: newTask,
      board_id: boardId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/tasks/from-visibility-opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
