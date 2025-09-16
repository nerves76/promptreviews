import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

/**
 * GET /api/onboarding-tasks?account_id=xxx - Fetch onboarding tasks for an account
 * POST /api/onboarding-tasks - Create/update onboarding task
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account_id = searchParams.get('account_id');

    if (!account_id) {
      return NextResponse.json(
        { error: "account_id parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    
    
    const { data: tasks, error } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('account_id', account_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ONBOARDING_TASKS] Error fetching tasks:', error);
      return NextResponse.json(
        { error: "Failed to fetch onboarding tasks", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('[ONBOARDING_TASKS] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_id, task_id, completed, completed_at } = body;

    if (!account_id || !task_id || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: "account_id, task_id, and completed are required" },
        { status: 400 }
      );
    }


    const supabase = createServiceRoleClient();

    const taskData = {
      account_id,
      task_id,
      completed,
      completed_at: completed ? (completed_at || new Date().toISOString()) : null,
    };

    const { data, error } = await supabase
      .from('onboarding_tasks')
      .upsert(taskData, {
        onConflict: 'account_id,task_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[ONBOARDING_TASKS] Error upserting task:', error);
      return NextResponse.json(
        { error: "Failed to update onboarding task", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error('[ONBOARDING_TASKS] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}