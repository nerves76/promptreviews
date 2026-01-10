import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { WMLibraryTask } from '@/types/workManager';

/**
 * GET /api/work-manager/library/tasks
 * Returns all active library tasks with optional filtering.
 *
 * Query params:
 * - category: Filter by category
 * - pack_id: Filter by pack (returns tasks in that pack)
 * - difficulty: Filter by difficulty
 * - time_estimate: Filter by time estimate
 * - goal: Filter by goal (partial match in array)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const packId = searchParams.get('pack_id');
    const difficulty = searchParams.get('difficulty');
    const timeEstimate = searchParams.get('time_estimate');
    const goal = searchParams.get('goal');

    const supabaseAdmin = createServiceRoleClient();

    // If filtering by pack, get task IDs from junction table first
    let packTaskIds: string[] | null = null;
    if (packId) {
      const { data: packTasks, error: packError } = await supabaseAdmin
        .from('wm_library_pack_tasks')
        .select('task_id')
        .eq('pack_id', packId)
        .order('sort_order', { ascending: true });

      if (packError) {
        console.error('Error fetching pack tasks:', packError);
        return NextResponse.json({ error: 'Failed to fetch pack tasks' }, { status: 500 });
      }

      packTaskIds = packTasks?.map(pt => pt.task_id) || [];

      // If pack has no tasks, return empty array
      if (packTaskIds.length === 0) {
        return NextResponse.json({ tasks: [] });
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('wm_library_tasks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Apply filters
    if (packTaskIds) {
      query = query.in('id', packTaskIds);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (timeEstimate) {
      query = query.eq('time_estimate', timeEstimate);
    }
    if (goal) {
      // Use array contains for goal filtering
      query = query.contains('goals', [goal]);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching library tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch library tasks' }, { status: 500 });
    }

    // If filtering by pack, maintain pack order
    let orderedTasks: WMLibraryTask[] = tasks || [];
    if (packTaskIds && tasks) {
      orderedTasks = packTaskIds
        .map(id => tasks.find(t => t.id === id))
        .filter(Boolean) as WMLibraryTask[];
    }

    return NextResponse.json({ tasks: orderedTasks });
  } catch (error) {
    console.error('Error in GET /api/work-manager/library/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
