import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * GET /api/work-manager/library/tasks/[taskId]
 * Returns a single library task with full details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();

    const { data: task, error: taskError } = await supabaseAdmin
      .from('wm_library_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_active', true)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error fetching library task:', taskError);
      return NextResponse.json({ error: 'Failed to fetch library task' }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error in GET /api/work-manager/library/tasks/[taskId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
