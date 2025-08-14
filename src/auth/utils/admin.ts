/**
 * Admin utility functions for checking admin status and managing admin content
 * UPDATED: Now uses simple is_admin column in accounts table for better reliability
 */

import { createClient } from '../providers/supabase';

/**
 * Check if the current user is an admin using the simple is_admin column
 * @param userId - Optional user ID to check. If not provided, will get current user from auth.
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(userId?: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    let userToCheck = userId;
    
    if (!userToCheck) {
      const { data: { user }, error: authError } = await client.auth.getUser();

      if (authError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('isAdmin: Auth error, returning false:', authError.message);
        }
        return false;
      }
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('isAdmin: No user found, returning false');
        }
        return false;
      }
      userToCheck = user.id;
    }

    // Only log occasionally to reduce noise (20% of the time)
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.2) {
      console.log('isAdmin: Checking admin status for user ID:', userToCheck);
    }
    
    // Simple query: Check is_admin column in accounts table
    const { data: account, error } = await client
      .from('accounts')
      .select('is_admin')
      .eq('id', userToCheck)
      .maybeSingle();


    
    if (error) {
      console.error('isAdmin: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      // Return false on any database error to be safe
      return false;
    }
    
    const isAdminUser = !!(account?.is_admin);

    return isAdminUser;
    
  } catch (error) {
    console.error('isAdmin: Unexpected error:', {
      error: error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Set admin status for a user by email
 * @param email - User email
 * @param isAdminStatus - Whether to grant or revoke admin status
 * @param supabaseClient - Optional Supabase client instance
 */
export async function setAdminStatus(
  email: string, 
  isAdminStatus: boolean, 
  supabaseClient?: any
): Promise<{ success: boolean; message: string }> {
  try {
    const client = supabaseClient || createClient();
    
    console.log(`Setting admin status for ${email} to ${isAdminStatus}`);
    
    // Update the is_admin column
    const { data, error } = await client
      .from('accounts')
      .update({ is_admin: isAdminStatus })
      .eq('email', email)
      .select('id, email, is_admin');

    if (error) {
      console.error('setAdminStatus: Database error:', error);
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: `No account found with email: ${email}`
      };
    }

    return {
      success: true,
      message: `Successfully ${isAdminStatus ? 'granted' : 'revoked'} admin status for ${email}`
    };
    
  } catch (error) {
    console.error('setAdminStatus: Unexpected error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * List all admin users
 * @param supabaseClient - Optional Supabase client instance
 */
export async function listAdmins(supabaseClient?: any): Promise<{
  success: boolean;
  admins?: Array<{ id: string; email: string; first_name?: string; last_name?: string }>;
  message?: string;
}> {
  try {
    const client = supabaseClient || createClient();
    
    const { data, error } = await client
      .from('accounts')
      .select('id, email, first_name, last_name')
      .eq('is_admin', true)
      .order('email');

    if (error) {
      console.error('listAdmins: Database error:', error);
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    return {
      success: true,
      admins: data || []
    };
    
  } catch (error) {
    console.error('listAdmins: Unexpected error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * DEPRECATED: Legacy function for backwards compatibility
 * This function is no longer needed with the new simple admin system
 * @deprecated Use isAdmin() instead
 */
export async function ensureAdminForEmail(user: { id: string, email: string }, supabaseClient?: any): Promise<void> {
  // Get admin emails from environment (fallback for transition period)
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!user?.email) return;
  if (!adminEmails.includes(user.email.toLowerCase())) return;

  console.log(`ensureAdminForEmail: Auto-granting admin status for ${user.email}`);
  await setAdminStatus(user.email, true, supabaseClient);
}

/**
 * Get the current active announcement
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<string | null> - the active announcement message or null if none
 */
export async function getActiveAnnouncement(supabaseClient?: any): Promise<string | null> {
  try {
    const client = supabaseClient || createClient();
    
    const { data: announcement, error } = await client
      .from('announcements')
      .select('message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching active announcement:', error);
    }

    return announcement?.message || null;
  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return null;
  }
}

/**
 * Get a random active quote
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<{text: string, author?: string, button_text?: string, button_url?: string} | null> - the quote or null if none
 */
export async function getRandomQuote(supabaseClient?: any): Promise<{text: string, author?: string, button_text?: string, button_url?: string} | null> {
  try {
    const client = supabaseClient || createClient();
    const { data: quotes } = await client
      .from('quotes')
      .select('text, author, button_text, button_url')
      .eq('is_active', true);

    if (!quotes || quotes.length === 0) return null;

    // Get a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  } catch (error) {
    console.error('Error fetching random quote:', error);
    return null;
  }
}

/**
 * Get all active quotes for cycling
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<Array> - array of all active quotes
 */
export async function getAllActiveQuotes(supabaseClient?: any) {
  try {
    const client = supabaseClient || createClient();
    const { data: quotes } = await client
      .from('quotes')
      .select('id, text, author, button_text, button_url, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return quotes || [];
  } catch (error) {
    console.error('Error fetching all active quotes:', error);
    return [];
  }
}

/**
 * Create a new announcement (admin only)
 * @param message - the announcement message
 * @param buttonText - optional button text
 * @param buttonUrl - optional button URL
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function createAnnouncement(message: string, buttonText?: string, buttonUrl?: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    console.log('createAnnouncement: Starting with message:', message);
    
    const { data: { user } } = await client.auth.getUser();
    console.log('createAnnouncement: User check result:', { user: user?.id, email: user?.email });
    if (!user) {
      console.error('createAnnouncement: No user found');
      return false;
    }

    // Check if user is admin using the reliable isAdmin function
    const adminStatus = await isAdmin(user.id, client);
    console.log('createAnnouncement: Admin status check result:', adminStatus);
    if (!adminStatus) {
      console.error('createAnnouncement: User is not an admin');
      return false;
    }

    // Deactivate all existing announcements
    const { error: deactivateError } = await client
      .from('announcements')
      .update({ is_active: false })
      .eq('is_active', true);

    console.log('createAnnouncement: Deactivate existing announcements result:', { error: deactivateError });

    // Prepare announcement data
    const announcementData: any = {
      message,
      is_active: true,
      created_by: user.id  // Use user.id directly instead of admin.id
    };

    // Add button fields if provided
    if (buttonText && buttonText.trim()) {
      announcementData.button_text = buttonText.trim();
    }
    if (buttonUrl && buttonUrl.trim()) {
      announcementData.button_url = buttonUrl.trim();
    }

    console.log('createAnnouncement: Prepared announcement data:', announcementData);

    // Create new announcement
    const { error: insertError } = await client
      .from('announcements')
      .insert(announcementData);

    console.log('createAnnouncement: Insert result:', { error: insertError });
    return !insertError;
  } catch (error) {
    console.error('Error creating announcement:', error);
    return false;
  }
}

/**
 * Create a new quote (admin only)
 * @param text - the quote text
 * @param author - the quote author (optional)
 * @param buttonText - optional button text
 * @param buttonUrl - optional button URL
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function createQuote(text: string, author?: string, buttonText?: string, buttonUrl?: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('createQuote: No user found');
      return false;
    }

    // Check if user is admin using the reliable isAdmin function
    const adminStatus = await isAdmin(user.id, client);
    if (!adminStatus) {
      console.error('createQuote: User is not an admin');
      return false;
    }

    // Prepare quote data with button fields
    const quoteData: any = {
      text,
      author,
      is_active: true,
      created_by: user.id  // Use user.id directly instead of admin.id
    };

    // Add button fields if provided
    if (buttonText && buttonText.trim()) {
      quoteData.button_text = buttonText.trim();
    }
    if (buttonUrl && buttonUrl.trim()) {
      quoteData.button_url = buttonUrl.trim();
    }

    console.log('createQuote: Inserting quote data:', quoteData);

    // Create new quote
    const { error } = await client
      .from('quotes')
      .insert(quoteData);

    if (error) {
      console.error('createQuote: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('createQuote: Quote created successfully');
    return true;
  } catch (error) {
    console.error('Error creating quote:', error);
    return false;
  }
}

/**
 * Get all announcements (admin only)
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<Array> - array of all announcements
 */
export async function getAllAnnouncements(supabaseClient?: any) {
  try {
    const client = supabaseClient || createClient();
    const { data: announcements } = await client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    return announcements || [];
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    return [];
  }
}

/**
 * Get all quotes (admin only)
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<Array> - array of all quotes
 */
export async function getAllQuotes(supabaseClient?: any) {
  try {
    const client = supabaseClient || createClient();
    const { data: quotes } = await client
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    return quotes || [];
  } catch (error) {
    console.error('Error fetching all quotes:', error);
    return [];
  }
}

/**
 * Toggle announcement active status (admin only)
 * @param id - announcement id
 * @param isActive - new active status
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function toggleAnnouncement(id: string, isActive: boolean, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    const { error } = await client
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error toggling announcement:', error);
    return false;
  }
}

/**
 * Toggle quote active status (admin only)
 * @param id - quote id
 * @param isActive - new active status
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function toggleQuote(id: string, isActive: boolean, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    const { error } = await client
      .from('quotes')
      .update({ is_active: isActive })
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error toggling quote:', error);
    return false;
  }
}

/**
 * Delete a quote (admin only)
 * @param id - quote id
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function deleteQuote(id: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('deleteQuote: No user found');
      return false;
    }

    // Check if user is admin using the reliable isAdmin function
    const adminStatus = await isAdmin(user.id, client);
    if (!adminStatus) {
      console.error('deleteQuote: User is not an admin');
      return false;
    }

    console.log('deleteQuote: Deleting quote with ID:', id);

    // Delete the quote
    const { error } = await client
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteQuote: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('deleteQuote: Quote deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting quote:', error);
    return false;
  }
}

/**
 * Update an existing quote (admin only)
 * @param id - quote id
 * @param text - the quote text
 * @param author - the quote author (optional)
 * @param buttonText - optional button text
 * @param buttonUrl - optional button URL
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function updateQuote(id: string, text: string, author?: string, buttonText?: string, buttonUrl?: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('updateQuote: No user found');
      return false;
    }

    // Check if user is admin using the reliable isAdmin function
    const adminStatus = await isAdmin(user.id, client);
    if (!adminStatus) {
      console.error('updateQuote: User is not an admin');
      return false;
    }

    // Prepare update data with button fields
    const updateData: any = {
      text,
      author,
      updated_at: new Date().toISOString()
    };

    // Add button fields if provided
    if (buttonText && buttonText.trim()) {
      updateData.button_text = buttonText.trim();
    } else {
      updateData.button_text = null; // Clear if empty
    }
    if (buttonUrl && buttonUrl.trim()) {
      updateData.button_url = buttonUrl.trim();
    } else {
      updateData.button_url = null; // Clear if empty
    }

    console.log('updateQuote: Updating quote with ID:', id, 'Data:', updateData);

    // Update the quote
    const { error } = await client
      .from('quotes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('updateQuote: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('updateQuote: Quote updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating quote:', error);
    return false;
  }
}

/**
 * Get all feedback submissions (admin only)
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<Array> - array of all feedback submissions
 */
export async function getAllFeedback(supabaseClient?: any) {
  try {
    const client = supabaseClient || createClient();
    
    // First check if user is admin
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('getAllFeedback: No user found');
      return [];
    }

    console.log('getAllFeedback: Checking admin status for user:', user.id);
    const adminStatus = await isAdmin(user.id, client);
    console.log('getAllFeedback: Admin status:', adminStatus);

    if (!adminStatus) {
      console.error('getAllFeedback: User is not admin');
      return [];
    }

    console.log('getAllFeedback: Fetching feedback data...');
    const { data: feedback, error } = await client
      .from('feedback')
      .select(`
        id,
        user_id,
        category,
        message,
        email,
        is_read,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAllFeedback: Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      return [];
    }

    console.log('getAllFeedback: Successfully fetched feedback:', feedback?.length || 0, 'items');
    return feedback || [];
  } catch (error) {
    console.error('getAllFeedback: Unexpected error:', error);
    return [];
  }
}

/**
 * Mark feedback as read (admin only)
 * @param feedbackId - the feedback ID to mark as read
 * @param isRead - whether to mark as read or unread
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function markFeedbackAsRead(feedbackId: string, isRead: boolean, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    
    const { error } = await client
      .from('feedback')
      .update({ is_read: isRead })
      .eq('id', feedbackId);

    if (error) {
      console.error('Error marking feedback as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking feedback as read:', error);
    return false;
  }
}

/**
 * Delete feedback submission (admin only)
 * @param feedbackId - the feedback ID to delete
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function deleteFeedback(feedbackId: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || createClient();
    
    // First check if user is admin
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('deleteFeedback: No user found');
      return false;
    }

    console.log('deleteFeedback: Checking admin status for user:', user.id);
    const adminStatus = await isAdmin(user.id, client);
    console.log('deleteFeedback: Admin status:', adminStatus);

    if (!adminStatus) {
      console.error('deleteFeedback: User is not admin');
      return false;
    }

    console.log('deleteFeedback: Deleting feedback with ID:', feedbackId);

    const { error } = await client
      .from('feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      console.error('deleteFeedback: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('deleteFeedback: Feedback deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
} 