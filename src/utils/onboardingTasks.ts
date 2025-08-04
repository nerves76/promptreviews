/**
 * Onboarding Tasks Utility
 * 
 * Manages user onboarding task completion status in the database.
 * Provides functions to fetch, mark as complete, and check completion status.
 */

import { createClient } from '@/utils/supabaseClient';

const supabase = createClient();
import { getAccountIdForUser } from './accountUtils';

export interface OnboardingTask {
  id: string;
  account_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletionStatus {
  [taskId: string]: boolean;
}

/**
 * Fetch all onboarding tasks for a user
 */
export async function fetchOnboardingTasks(userId: string): Promise<TaskCompletionStatus> {
  try {
    const accountId = await getAccountIdForUser(userId, supabase);
    if (!accountId) {
      return {};
    }

    let data, error;

    // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
      console.log('🔧 DEV MODE: Using API endpoint to fetch onboarding tasks');
      try {
        const response = await fetch(`/api/onboarding-tasks?account_id=${accountId}`);
        const apiResult = await response.json();
        if (response.ok) {
          data = apiResult.tasks || [];
          error = null;
        } else {
          data = [];
          error = { message: apiResult.error || 'API error' };
        }
      } catch (err) {
        data = [];
        error = { message: err instanceof Error ? err.message : 'Unknown error' };
      }
    } else {
      // Normal mode: Use Supabase client directly
      const result = await supabase
        .from('onboarding_tasks')
        .select('task_id, completed')
        .eq('account_id', accountId);
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching onboarding tasks:', error);
      return {};
    }

    // Convert to a simple object mapping task_id to completion status
    const taskStatus: TaskCompletionStatus = {};
    data?.forEach(task => {
      taskStatus[task.task_id] = task.completed;
    });

    return taskStatus;
  } catch (error) {
    console.error('Error in fetchOnboardingTasks:', error);
    return {};
  }
}

/**
 * Mark a specific onboarding task as completed
 */
export async function markTaskAsCompleted(userId: string, taskId: string): Promise<boolean> {
  try {
    const accountId = await getAccountIdForUser(userId, supabase);
    if (!accountId) {
      console.error('No account found for user');
      return false;
    }

    let error;

    // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
      console.log('🔧 DEV MODE: Using API endpoint to mark task as completed');
      try {
        const response = await fetch('/api/onboarding-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: accountId,
            task_id: taskId,
            completed: true,
            completed_at: new Date().toISOString()
          })
        });
        const apiResult = await response.json();
        if (!response.ok) {
          error = { message: apiResult.error || 'API error' };
        } else {
          error = null;
        }
      } catch (err) {
        error = { message: err instanceof Error ? err.message : 'Unknown error' };
      }
    } else {
      // Normal mode: Use Supabase client directly
      const result = await supabase
        .from('onboarding_tasks')
        .upsert({
          account_id: accountId,
          task_id: taskId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'account_id,task_id'
        });
      error = result.error;
    }

    if (error) {
      console.error('Error marking task as completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markTaskAsCompleted:', error);
    return false;
  }
}

/**
 * Mark a specific onboarding task as incomplete
 */
export async function markTaskAsIncomplete(userId: string, taskId: string): Promise<boolean> {
  try {
    const accountId = await getAccountIdForUser(userId, supabase);
    if (!accountId) {
      console.error('No account found for user');
      return false;
    }

    let error;

    // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
      console.log('🔧 DEV MODE: Using API endpoint to mark task as incomplete');
      try {
        const response = await fetch('/api/onboarding-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: accountId,
            task_id: taskId,
            completed: false,
            completed_at: null
          })
        });
        const apiResult = await response.json();
        if (!response.ok) {
          error = { message: apiResult.error || 'API error' };
        } else {
          error = null;
        }
      } catch (err) {
        error = { message: err instanceof Error ? err.message : 'Unknown error' };
      }
    } else {
      // Normal mode: Use Supabase client directly
      const result = await supabase
        .from('onboarding_tasks')
        .upsert({
          account_id: accountId,
          task_id: taskId,
          completed: false,
          completed_at: null
        }, {
          onConflict: 'account_id,task_id'
        });
      error = result.error;
    }

    if (error) {
      console.error('Error marking task as incomplete:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markTaskAsIncomplete:', error);
    return false;
  }
}

/**
 * Check if a specific task is completed
 */
export async function isTaskCompleted(userId: string, taskId: string): Promise<boolean> {
  try {
    const taskStatus = await fetchOnboardingTasks(userId);
    return taskStatus[taskId] || false;
  } catch (error) {
    console.error('Error checking task completion:', error);
    return false;
  }
}

/**
 * Get completion percentage for all tasks
 */
export async function getOnboardingCompletionPercentage(userId: string, totalTasks: number): Promise<number> {
  try {
    const taskStatus = await fetchOnboardingTasks(userId);
    const completedTasks = Object.values(taskStatus).filter(completed => completed).length;
    return Math.round((completedTasks / totalTasks) * 100);
  } catch (error) {
    console.error('Error calculating completion percentage:', error);
    return 0;
  }
}

/**
 * Initialize default tasks for a new user
 */
export async function initializeDefaultTasks(userId: string): Promise<boolean> {
  try {
    const accountId = await getAccountIdForUser(userId, supabase);
    if (!accountId) {
      console.error('No account found for user');
      return false;
    }

    const defaultTasks = [
      'business-profile',
      'style-prompt-pages', 
      'customize-universal',
      'create-prompt-page',
      'share'
    ];

    const taskData = defaultTasks.map(taskId => ({
      account_id: accountId,
      task_id: taskId,
      completed: false,
      completed_at: null
    }));

    const { error } = await supabase
      .from('onboarding_tasks')
      .upsert(taskData, {
        onConflict: 'account_id,task_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('Error initializing default tasks:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in initializeDefaultTasks:', error);
    return false;
  }
} 