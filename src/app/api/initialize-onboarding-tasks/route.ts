/**
 * API Route: Initialize Onboarding Tasks
 * 
 * Creates default onboarding tasks for a new user account.
 * This endpoint uses the service role key to bypass RLS policies.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/utils/supabaseClient';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let user;
    let supabase;

    // Try to get user from cookies first (browser requests)
    try {
      supabase = createRouteHandlerClient({ cookies });
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && cookieUser) {
        user = cookieUser;
        console.log('Using cookie-based authentication');
      }
    } catch (error) {
      console.log('Cookie-based auth failed, trying header-based auth');
    }

    // If no user from cookies, try header-based authentication (API requests)
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Create a new Supabase client for header-based auth
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: headerUser }, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError || !headerUser) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }

      user = headerUser;
      console.log('Using header-based authentication');
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Create a service role client for database operations
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the account ID for the user
    const { data: accountUsers, error: accountError } = await serviceClient
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (accountError || !accountUsers) {
      console.error('Error getting account for user:', accountError);
      return NextResponse.json(
        { error: 'Account not found for user' },
        { status: 404 }
      );
    }

    const accountId = accountUsers.account_id;

    // Define default tasks
    const defaultTasks = [
      'business-profile',
      'style-prompt-pages', 
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

    console.log(`Successfully initialized ${defaultTasks.length} default tasks for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Initialized ${defaultTasks.length} onboarding tasks`,
      tasks: defaultTasks
    });

  } catch (error) {
    console.error('Error in initialize-onboarding-tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 