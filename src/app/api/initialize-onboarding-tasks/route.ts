/**
 * API Route: Initialize Onboarding Tasks
 * 
 * Creates default onboarding tasks for a new user account.
 * This endpoint uses the service role key to bypass RLS policies.
 */

import { createServiceRoleClient } from '@/utils/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 🔧 CONSOLIDATION: Shared server client creation for API routes
// This replaces the mixed authentication approaches with standard server client pattern
async function createAuthenticatedSupabaseClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, // No-op for API route
        remove: () => {}, // No-op for API route
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 🔧 CONSOLIDATED: Use standard server client authentication
    // This replaces the complex cookie/header logic with the standard pattern
    const supabase = await createAuthenticatedSupabaseClient();
    
    // Get authenticated user using standard server client pattern
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    

    // Create a service role client for database operations
    const serviceClient = createServiceRoleClient();

    // Get the account ID for the user (using accounts table directly)
    // Add retry logic to handle race conditions during account creation
    let account = null;
    let accountError = null;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await serviceClient
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        accountError = error;
        console.log(`Account fetch attempt ${attempt + 1} failed:`, error);
        
        // Wait before retrying (except on last attempt)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        account = data;
        break;
      }
    }

    if (accountError || !account) {
      console.error('Error getting account for user after retries:', {
        message: accountError?.message,
        code: accountError?.code,
        details: accountError?.details,
        hint: accountError?.hint,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Account not found for user. Please try again in a moment.' },
        { status: 404 }
      );
    }

    const accountId = account.id;

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