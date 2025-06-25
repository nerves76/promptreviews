/**
 * Admin utility functions for checking admin status and managing admin content
 * This file contains functions to check if a user is an admin and manage admin-only features
 */

import { supabase } from './supabase';

/**
 * Check if the current user is an admin
 * @param userId - Optional user ID to check. If not provided, will get current user from auth.
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(userId?: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    let userToCheck = userId;
    
    if (!userToCheck) {
      const { data: { user } } = await client.auth.getUser();
      console.log('isAdmin: Current user:', user?.id, user?.email);
      if (!user) return false;
      userToCheck = user.id;
    }

    console.log('isAdmin: Checking admin status for user ID:', userToCheck);
    
    const { data: admin, error } = await client
      .from('admins')
      .select('id')
      .eq('account_id', userToCheck)
      .single();

    console.log('isAdmin: Admin query result:', { admin, error });
    
    if (error) {
      console.error('isAdmin: Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    
    return !!admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current active announcement
 * @param supabaseClient - Optional Supabase client instance. If not provided, uses shared client.
 * @returns Promise<string | null> - the active announcement message or null if none
 */
export async function getActiveAnnouncement(supabaseClient?: any): Promise<string | null> {
  try {
    const client = supabaseClient || supabase;
    
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
    console.log('createAnnouncement: Starting with message:', message);
    
    const { data: { user } } = await client.auth.getUser();
    console.log('createAnnouncement: User check result:', { user: user?.id, email: user?.email });
    if (!user) {
      console.error('createAnnouncement: No user found');
      return false;
    }

    // Get admin record
    const { data: admin, error: adminError } = await client
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    console.log('createAnnouncement: Admin check result:', { admin, error: adminError });
    if (!admin) {
      console.error('createAnnouncement: No admin record found for user');
      return false;
    }

    // Deactivate all existing announcements
    const { error: deactivateError } = await client
      .from('announcements')
      .update({ is_active: false })
      .eq('is_active', true);

    console.log('createAnnouncement: Deactivate existing announcements result:', { error: deactivateError });

    // Prepare announcement data
    let announcementData: string;
    if (buttonText && buttonUrl) {
      // Store as JSON with button info
      announcementData = JSON.stringify({
        message,
        button_text: buttonText,
        button_url: buttonUrl
      });
    } else {
      // Store as plain message
      announcementData = message;
    }

    console.log('createAnnouncement: Prepared announcement data:', announcementData);

    // Create new announcement
    const { error: insertError } = await client
      .from('announcements')
      .insert({
        message: announcementData,
        is_active: true,
        created_by: admin.id
      });

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
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('createQuote: No user found');
      return false;
    }

    // Get admin record
    const { data: admin } = await client
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!admin) {
      console.error('createQuote: No admin record found for user');
      return false;
    }

    // Prepare quote data with button fields
    const quoteData: any = {
      text,
      author,
      is_active: true,
      created_by: admin.id
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
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
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('deleteQuote: No user found');
      return false;
    }

    // Get admin record
    const { data: admin } = await client
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!admin) {
      console.error('deleteQuote: No admin record found for user');
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
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('updateQuote: No user found');
      return false;
    }

    // Get admin record
    const { data: admin } = await client
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!admin) {
      console.error('updateQuote: No admin record found for user');
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
    const client = supabaseClient || supabase;
    
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
    const client = supabaseClient || supabase;
    
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