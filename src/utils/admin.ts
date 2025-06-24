/**
 * Admin utility functions for checking admin status and managing admin content
 * This file contains functions to check if a user is an admin and manage admin-only features
 */

import { supabase } from './supabase';

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    return !!admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current active announcement
 * @returns Promise<string | null> - the active announcement message or null if none
 */
export async function getActiveAnnouncement(): Promise<string | null> {
  try {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return announcement?.message || null;
  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return null;
  }
}

/**
 * Get a random active quote
 * @returns Promise<{text: string, author?: string} | null> - the quote or null if none
 */
export async function getRandomQuote(): Promise<{text: string, author?: string} | null> {
  try {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('text, author')
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
 * Create a new announcement (admin only)
 * @param message - the announcement message
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function createAnnouncement(message: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get admin record
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!admin) return false;

    // Deactivate all existing announcements
    await supabase
      .from('announcements')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new announcement
    const { error } = await supabase
      .from('announcements')
      .insert({
        message,
        is_active: true,
        created_by: admin.id
      });

    return !error;
  } catch (error) {
    console.error('Error creating announcement:', error);
    return false;
  }
}

/**
 * Create a new quote (admin only)
 * @param text - the quote text
 * @param author - the quote author (optional)
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function createQuote(text: string, author?: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get admin record
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!admin) return false;

    // Create new quote
    const { error } = await supabase
      .from('quotes')
      .insert({
        text,
        author,
        is_active: true,
        created_by: admin.id
      });

    return !error;
  } catch (error) {
    console.error('Error creating quote:', error);
    return false;
  }
}

/**
 * Get all announcements (admin only)
 * @returns Promise<Array> - array of all announcements
 */
export async function getAllAnnouncements() {
  try {
    const { data: announcements } = await supabase
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
 * @returns Promise<Array> - array of all quotes
 */
export async function getAllQuotes() {
  try {
    const { data: quotes } = await supabase
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
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function toggleAnnouncement(id: string, isActive: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
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
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function toggleQuote(id: string, isActive: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ is_active: isActive })
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error toggling quote:', error);
    return false;
  }
} 