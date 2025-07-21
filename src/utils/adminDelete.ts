/**
 * Admin Delete Utility Functions
 * 
 * This file contains utility functions for comprehensive user deletion and data cleanup.
 * These functions are designed to be used by admin-only endpoints to properly clean up
 * all user-related data when a user is deleted from the system.
 * 
 * The cleanup process follows a specific order to respect foreign key constraints:
 * 1. Child tables (widgets, reviews, analytics, etc.)
 * 2. Junction tables (account_users)
 * 3. Parent tables (accounts, admins)
 * 4. Finally, the user from Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Interface for cleanup results
 */
interface CleanupResult {
  success: boolean;
  message: string;
  details?: {
    [tableName: string]: {
      deleted: number;
      error?: string;
    };
  };
}

/**
 * Get user ID by email address
 * @param email - The email address to look up
 * @returns Promise resolving to user ID or null if not found
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    // Use direct REST API call since admin.getUserByEmail is not available
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch user by email:', response.statusText);
      return null;
    }

    const users = await response.json();
    return users.length > 0 ? users[0].id : null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
}

/**
 * Get account ID for a user
 * @param userId - The user ID to look up
 * @returns Promise resolving to account ID or null if not found
 */
export async function getAccountIdForUser(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting account ID for user:', error);
      return null;
    }

    return data?.account_id || null;
  } catch (error) {
    console.error('Error getting account ID for user:', error);
    return null;
  }
}

/**
 * Clean up analytics events related to a user's widgets
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAnalyticsEvents(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    // First get all prompt_page_ids for this account
    const { data: promptPages, error: promptError } = await supabaseAdmin
      .from('prompt_pages')
      .select('id')
      .eq('account_id', accountId);

    if (promptError) {
      return { deleted: 0, error: `Failed to get prompt pages: ${promptError.message}` };
    }

    if (!promptPages || promptPages.length === 0) {
      return { deleted: 0 };
    }

    const promptPageIds = promptPages.map(p => p.id);
    
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .delete()
      .in('prompt_page_id', promptPageIds);

    if (error) {
      return { deleted: 0, error: `Failed to delete analytics events: ${error.message}` };
    }

    return { deleted: promptPageIds.length };
  } catch (error) {
    return { deleted: 0, error: `Exception in analytics cleanup: ${error}` };
  }
}

/**
 * Clean up AI usage records for a user
 * @param userId - The user ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAiUsage(userId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_usage')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { deleted: 0, error: `Failed to delete AI usage: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in AI usage cleanup: ${error}` };
  }
}

/**
 * Clean up widget reviews for a user's widgets
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupWidgetReviews(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    // First get all widget IDs for this account
    const { data: widgets, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('id')
      .eq('account_id', accountId);

    if (widgetError) {
      return { deleted: 0, error: `Failed to get widgets: ${widgetError.message}` };
    }

    if (!widgets || widgets.length === 0) {
      return { deleted: 0 };
    }

    const widgetIds = widgets.map(w => w.id);
    
    const { error } = await supabaseAdmin
      .from('widget_reviews')
      .delete()
      .in('widget_id', widgetIds);

    if (error) {
      return { deleted: 0, error: `Failed to delete widget reviews: ${error.message}` };
    }

    return { deleted: widgetIds.length };
  } catch (error) {
    return { deleted: 0, error: `Exception in widget reviews cleanup: ${error}` };
  }
}

/**
 * Clean up review submissions for a user's widgets
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupReviewSubmissions(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    // First get all widget IDs for this account
    const { data: widgets, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('id')
      .eq('account_id', accountId);

    if (widgetError) {
      return { deleted: 0, error: `Failed to get widgets: ${widgetError.message}` };
    }

    if (!widgets || widgets.length === 0) {
      return { deleted: 0 };
    }

    const widgetIds = widgets.map(w => w.id);
    
    const { error } = await supabaseAdmin
      .from('review_submissions')
      .delete()
      .in('widget_id', widgetIds);

    if (error) {
      return { deleted: 0, error: `Failed to delete review submissions: ${error.message}` };
    }

    return { deleted: widgetIds.length };
  } catch (error) {
    return { deleted: 0, error: `Exception in review submissions cleanup: ${error}` };
  }
}

/**
 * Clean up contacts for a user's businesses
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupContacts(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    // First get all business IDs for this account
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('account_id', accountId);

    if (businessError) {
      return { deleted: 0, error: `Failed to get businesses: ${businessError.message}` };
    }

    if (!businesses || businesses.length === 0) {
      return { deleted: 0 };
    }

    const businessIds = businesses.map(b => b.id);
    
    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .in('business_id', businessIds);

    if (error) {
      return { deleted: 0, error: `Failed to delete contacts: ${error.message}` };
    }

    return { deleted: businessIds.length };
  } catch (error) {
    return { deleted: 0, error: `Exception in contacts cleanup: ${error}` };
  }
}

/**
 * Clean up prompt pages for an account
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupPromptPages(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('prompt_pages')
      .delete()
      .eq('account_id', accountId);

    if (error) {
      return { deleted: 0, error: `Failed to delete prompt pages: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in prompt pages cleanup: ${error}` };
  }
}

/**
 * Clean up widgets for an account
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupWidgets(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('widgets')
      .delete()
      .eq('account_id', accountId);

    if (error) {
      return { deleted: 0, error: `Failed to delete widgets: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in widgets cleanup: ${error}` };
  }
}

/**
 * Clean up businesses for an account
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupBusinesses(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('account_id', accountId);

    if (error) {
      return { deleted: 0, error: `Failed to delete businesses: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in businesses cleanup: ${error}` };
  }
}

/**
 * Clean up account invitations for a user
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAccountInvitations(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { data: deletedInvitations, error } = await supabaseAdmin
      .from('account_invitations')
      .delete()
      .eq('account_id', accountId)
      .select('id');

    if (error) {
      return { deleted: 0, error: `Failed to delete account invitations: ${error.message}` };
    }

    return { deleted: deletedInvitations?.length || 0 };
  } catch (error) {
    return { deleted: 0, error: `Exception in account_invitations cleanup: ${error}` };
  }
}

/**
 * Clean up admin privileges for a user
 * @param userId - The user ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAdmins(userId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { deleted: 0, error: `Failed to delete admin privileges: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in admins cleanup: ${error}` };
  }
}

/**
 * Clean up account_users relationship
 * @param userId - The user ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAccountUsers(userId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('account_users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { deleted: 0, error: `Failed to delete account_users: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in account_users cleanup: ${error}` };
  }
}

/**
 * Clean up account record
 * @param accountId - The account ID to clean up
 * @returns Promise resolving to cleanup result
 */
async function cleanupAccount(accountId: string): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      return { deleted: 0, error: `Failed to delete account: ${error.message}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in account cleanup: ${error}` };
  }
}

/**
 * Delete user from Supabase Auth
 * @param userId - The user ID to delete
 * @returns Promise resolving to cleanup result
 */
async function deleteUserFromAuth(userId: string): Promise<{ deleted: number; error?: string }> {
  try {
    // Use direct REST API call to delete user
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return { deleted: 0, error: `Failed to delete user from auth: ${response.statusText}` };
    }

    return { deleted: 1 };
  } catch (error) {
    return { deleted: 0, error: `Exception in auth user deletion: ${error}` };
  }
}

/**
 * Comprehensive user deletion function
 * This function performs a complete cleanup of all user-related data
 * @param email - The email address of the user to delete
 * @returns Promise resolving to cleanup result
 */
export async function deleteUserCompletely(email: string): Promise<CleanupResult> {
  console.log(`Starting comprehensive deletion for user: ${email}`);
  
  try {
    // Step 1: Get user ID by email
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      return {
        success: false,
        message: `User not found with email: ${email}`,
        details: {}
      };
    }

    console.log(`Found user ID: ${userId}`);

    // Step 2: Get account ID for the user
    const accountId = await getAccountIdForUser(userId);
    if (!accountId) {
      return {
        success: false,
        message: `No account found for user: ${email}`,
        details: {}
      };
    }

    console.log(`Found account ID: ${accountId}`);

    // Step 3: Perform cleanup in proper order (child tables first)
    const cleanupResults: { [tableName: string]: { deleted: number; error?: string } } = {};

    // Clean up analytics events
    console.log('Cleaning up analytics events...');
    cleanupResults.analytics_events = await cleanupAnalyticsEvents(accountId);

    // Clean up AI usage
    console.log('Cleaning up AI usage...');
    cleanupResults.ai_usage = await cleanupAiUsage(userId);

    // Clean up widget reviews
    console.log('Cleaning up widget reviews...');
    cleanupResults.widget_reviews = await cleanupWidgetReviews(accountId);

    // Clean up review submissions
    console.log('Cleaning up review submissions...');
    cleanupResults.review_submissions = await cleanupReviewSubmissions(accountId);

    // Clean up contacts
    console.log('Cleaning up contacts...');
    cleanupResults.contacts = await cleanupContacts(accountId);

    // Clean up prompt pages
    console.log('Cleaning up prompt pages...');
    cleanupResults.prompt_pages = await cleanupPromptPages(accountId);

    // Clean up widgets
    console.log('Cleaning up widgets...');
    cleanupResults.widgets = await cleanupWidgets(accountId);

    // Clean up businesses
    console.log('Cleaning up businesses...');
    cleanupResults.businesses = await cleanupBusinesses(accountId);

    // Clean up account invitations
    console.log('Cleaning up account invitations...');
    cleanupResults.account_invitations = await cleanupAccountInvitations(accountId);

    // Clean up admin privileges
    console.log('Cleaning up admin privileges...');
    cleanupResults.admins = await cleanupAdmins(userId);

    // Clean up account_users relationship
    console.log('Cleaning up account_users...');
    cleanupResults.account_users = await cleanupAccountUsers(userId);

    // Clean up account
    console.log('Cleaning up account...');
    cleanupResults.accounts = await cleanupAccount(accountId);

    // Finally, delete user from auth
    console.log('Deleting user from auth...');
    cleanupResults.auth_user = await deleteUserFromAuth(userId);

    // Check for any errors
    const errors = Object.entries(cleanupResults)
      .filter(([_, result]) => result.error)
      .map(([table, result]) => `${table}: ${result.error}`);

    if (errors.length > 0) {
      return {
        success: false,
        message: `Deletion completed with errors: ${errors.join(', ')}`,
        details: cleanupResults
      };
    }

    console.log(`Successfully deleted user: ${email}`);
    return {
      success: true,
      message: `Successfully deleted user: ${email}`,
      details: cleanupResults
    };

  } catch (error) {
    console.error('Error in comprehensive user deletion:', error);
    return {
      success: false,
      message: `Unexpected error during deletion: ${error}`,
      details: {}
    };
  }
} 