/**
 * API Route: Initialize Onboarding Tasks
 * 
 * Creates default onboarding tasks for a new user account.
 * This endpoint uses the service role key to bypass RLS policies.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create a service role client for database operations
    const serviceClient = createServiceRoleClient();

    // Get the account ID using the standard method (respects account switcher)
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found for user.' },
        { status: 404 }
      );
    }

    // Define default tasks
    const defaultTasks = [
      'business-profile',
      'style-prompt-pages',
      'prompt-page-settings', 
      'customize-universal',
      'create-prompt-page',
      'share'
    ];

    // Prepare task data
    const taskData = defaultTasks.map(taskId => ({
      account_id: accountId,
      task_id: taskId,
      completed: false,
      completed_at: null
    }));

    // Insert tasks using service role client (bypasses RLS)
    const { error: insertError } = await serviceClient
      .from('onboarding_tasks')
      .upsert(taskData, {
        onConflict: 'account_id,task_id',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('Error initializing default tasks:', insertError);
      return NextResponse.json(
        { error: 'Failed to initialize onboarding tasks' },
        { status: 500 }
      );
    }



    return NextResponse.json({
      success: true,
      message: `Initialized ${defaultTasks.length} onboarding tasks`,
      tasks: defaultTasks
    });

  } catch (error) {
    console.error('❌ Error in initialize-onboarding-tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 