import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_WM_STATUS_LABELS } from '@/types/workManager';

/**
 * POST /api/work-manager/boards/ensure
 * Ensures a board exists for the selected account.
 * Creates one if it doesn't exist, returns existing one if it does.
 * Returns: { board: WMBoard, created: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID from header
    const supabaseAdmin = createServiceRoleClient();
    const accountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check if board already exists
    const { data: existingBoard, error: fetchError } = await supabaseAdmin
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
      .eq('account_id', accountId)
      .single();

    if (existingBoard && !fetchError) {
      // Board exists, return it
      const account = existingBoard.accounts as any;
      const business = account?.businesses?.[0];

      return NextResponse.json({
        board: {
          id: existingBoard.id,
          account_id: existingBoard.account_id,
          name: existingBoard.name,
          status_labels: existingBoard.status_labels || DEFAULT_WM_STATUS_LABELS,
          account_name: account ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          business_name: business?.name || null,
          created_at: existingBoard.created_at,
          updated_at: existingBoard.updated_at,
        },
        created: false,
      });
    }

    // Get account info for default board name
    const { data: accountData } = await supabaseAdmin
      .from('accounts')
      .select(`
        id,
        first_name,
        last_name,
        businesses (
          name
        )
      `)
      .eq('id', accountId)
      .single();

    const business = (accountData as any)?.businesses?.[0];
    const defaultName = business?.name || null;

    // Create new board
    const { data: newBoard, error: createError } = await supabaseAdmin
      .from('wm_boards')
      .insert({
        account_id: accountId,
        name: defaultName,
        status_labels: DEFAULT_WM_STATUS_LABELS,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating board:', createError);
      return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
    }

    return NextResponse.json({
      board: {
        id: newBoard.id,
        account_id: newBoard.account_id,
        name: newBoard.name,
        status_labels: newBoard.status_labels || DEFAULT_WM_STATUS_LABELS,
        account_name: accountData ? `${accountData.first_name || ''} ${accountData.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        business_name: business?.name || null,
        created_at: newBoard.created_at,
        updated_at: newBoard.updated_at,
      },
      created: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-manager/boards/ensure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
