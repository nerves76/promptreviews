/**
 * API Route: Initialize Onboarding Tasks
 * 
 * Creates default onboarding tasks for a new user account.
 * This endpoint uses the service role key to bypass RLS policies.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account ID for the user
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (accountError || !accountUser) {
      return NextResponse.json(
        { error: 'No account found for user' },
        { status: 404 }
      );
    }

    const accountId = accountUser.account_id;

    // Define default tasks
    const defaultTasks = [
      'business-profile',
      'style-prompt-pages', 
      'customize-universal',
      'create-prompt-page',
      'share'
    ];

    // Create task data
    const taskData = defaultTasks.map(taskId => ({
      account_id: accountId,
      task_id: taskId,
      completed: false,
      completed_at: null
    }));

    // Insert tasks using upsert to avoid duplicates
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .upsert(taskData, {
        onConflict: 'account_id,task_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('Error initializing default tasks:', error);
      return NextResponse.json(
        { error: 'Failed to initialize tasks' },
        { status: 500 }
      );
    }

    console.log(`Initialized ${defaultTasks.length} default tasks for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Initialized ${defaultTasks.length} default tasks`,
      taskCount: defaultTasks.length
    });

  } catch (error) {
    console.error('Error in initialize-onboarding-tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 