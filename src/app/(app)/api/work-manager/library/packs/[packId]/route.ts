import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * GET /api/work-manager/library/packs/[packId]
 * Returns a single library pack with its tasks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packId } = await params;

    if (!packId) {
      return NextResponse.json({ error: 'Pack ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    // Fetch pack
    const { data: pack, error: packError } = await supabaseAdmin
      .from('wm_library_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (packError) {
      if (packError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
      }
      console.error('Error fetching library pack:', packError);
      return NextResponse.json({ error: 'Failed to fetch library pack' }, { status: 500 });
    }

    // Fetch tasks in this pack
    const { data: packTasks, error: packTasksError } = await supabaseAdmin
      .from('wm_library_pack_tasks')
      .select('task_id, sort_order')
      .eq('pack_id', packId)
      .order('sort_order', { ascending: true });

    if (packTasksError) {
      console.error('Error fetching pack tasks:', packTasksError);
      return NextResponse.json({ error: 'Failed to fetch pack tasks' }, { status: 500 });
    }

    const taskIds = packTasks?.map(pt => pt.task_id) || [];

    let tasks: any[] = [];
    if (taskIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabaseAdmin
        .from('wm_library_tasks')
        .select('*')
        .in('id', taskIds)
        .eq('is_active', true);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
      }

      // Order tasks according to pack order
      tasks = taskIds
        .map(id => tasksData?.find(t => t.id === id))
        .filter(Boolean);
    }

    // Add task count to pack
    pack.task_count = tasks.length;

    return NextResponse.json({ pack, tasks });
  } catch (error) {
    console.error('Error in GET /api/work-manager/library/packs/[packId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
