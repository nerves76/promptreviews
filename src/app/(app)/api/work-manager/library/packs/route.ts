import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * GET /api/work-manager/library/packs
 * Returns all active library packs with task counts.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch packs
    const { data: packs, error: packsError } = await supabaseAdmin
      .from('wm_library_packs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (packsError) {
      console.error('Error fetching library packs:', packsError);
      return NextResponse.json({ error: 'Failed to fetch library packs' }, { status: 500 });
    }

    // Get task counts for each pack
    const packIds = packs?.map(p => p.id) || [];

    if (packIds.length > 0) {
      const { data: taskCounts, error: countsError } = await supabaseAdmin
        .from('wm_library_pack_tasks')
        .select('pack_id')
        .in('pack_id', packIds);

      if (!countsError && taskCounts) {
        // Count tasks per pack
        const countsMap: Record<string, number> = {};
        taskCounts.forEach(tc => {
          countsMap[tc.pack_id] = (countsMap[tc.pack_id] || 0) + 1;
        });

        // Add task_count to each pack
        packs?.forEach(pack => {
          pack.task_count = countsMap[pack.id] || 0;
        });
      }
    }

    return NextResponse.json({ packs: packs || [] });
  } catch (error) {
    console.error('Error in GET /api/work-manager/library/packs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
