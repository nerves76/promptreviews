import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

/**
 * GET /api/work-manager/boards
 * Returns all boards the current user has access to (across all their accounts)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all accounts the user has access to
    const supabaseAdmin = createServiceRoleClient();
    const { data: accountUsers, error: accountsError } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id);

    if (accountsError) {
      console.error('Error fetching user accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    const accountIds = accountUsers?.map(au => au.account_id) || [];

    if (accountIds.length === 0) {
      return NextResponse.json({ boards: [] });
    }

    // Fetch all boards for these accounts with task counts and account info
    const { data: boards, error: boardsError } = await supabaseAdmin
      .from('wm_boards')
      .select(`
        id,
        account_id,
        name,
        status_labels,
        created_at,
        updated_at,
        accounts!inner (
          id,
          first_name,
          last_name,
          businesses (
            name
          )
        )
      `)
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (boardsError) {
      console.error('Error fetching boards:', boardsError);
      return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
    }

    // Get task counts for each board
    const boardIds = boards?.map(b => b.id) || [];
    let taskCounts: Record<string, number> = {};

    if (boardIds.length > 0) {
      const { data: counts, error: countsError } = await supabaseAdmin
        .from('wm_tasks')
        .select('board_id')
        .in('board_id', boardIds);

      if (!countsError && counts) {
        taskCounts = counts.reduce((acc, task) => {
          acc[task.board_id] = (acc[task.board_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Transform the data
    const transformedBoards = boards?.map(board => {
      const account = board.accounts as any;
      const business = account?.businesses?.[0];

      return {
        id: board.id,
        account_id: board.account_id,
        name: board.name,
        status_labels: board.status_labels || DEFAULT_WM_STATUS_LABELS,
        account_name: account ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        business_name: business?.name || null,
        task_count: taskCounts[board.id] || 0,
        created_at: board.created_at,
        updated_at: board.updated_at,
      };
    }) || [];

    return NextResponse.json({ boards: transformedBoards });
  } catch (error) {
    console.error('Error in GET /api/work-manager/boards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/work-manager/boards
 * Creates a new board for an account
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { account_id, name } = body;

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 });
    }

    // Verify user has access to this account
    const supabaseAdmin = createServiceRoleClient();
    const { data: accountUser, error: accessError } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', account_id)
      .single();

    if (accessError || !accountUser) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 });
    }

    // Check if board already exists for this account
    const { data: existingBoard } = await supabaseAdmin
      .from('wm_boards')
      .select('id')
      .eq('account_id', account_id)
      .single();

    if (existingBoard) {
      return NextResponse.json({ error: 'Board already exists for this account' }, { status: 409 });
    }

    // Create the board
    const { data: newBoard, error: createError } = await supabaseAdmin
      .from('wm_boards')
      .insert({
        account_id,
        name: name || null,
        status_labels: DEFAULT_WM_STATUS_LABELS,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating board:', createError);
      return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
    }

    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/boards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
