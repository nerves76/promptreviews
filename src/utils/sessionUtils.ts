/**
 * Session Management Utilities
 * 
 * Utilities for managing user sessions and preventing session timeouts
 * that can cause frequent user deletion issues.
 */

import { createClient } from './supabaseClient';

/**
 * Refresh the user session if it's close to expiring
 * This helps prevent session timeouts that cause user deletion
 */
export async function refreshSessionIfNeeded() {
  try {
    const { data: { session }, error } = await createClient().auth.getSession();
    
    if (error) {
      console.log('Session refresh check failed:', error.message);
      return false;
    }

    if (!session) {
      console.log('No active session found');
      return false;
    }

    // Check if session expires within the next 5 minutes
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && (expiresAt - now) < fiveMinutes) {
      console.log('Session expiring soon, refreshing...');
      const { data, error: refreshError } = await createClient().auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        return false;
      }
      
      console.log('Session refreshed successfully');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error in refreshSessionIfNeeded:', error);
    return false;
  }
}

/**
 * Check if the current session is valid and not expired
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await createClient().auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Check if session is expired
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    return expiresAt ? expiresAt > now : true;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Get the current user with session validation
 */
export async function getCurrentUser() {
  try {
    // First check if session is valid
    const sessionValid = await isSessionValid();
    if (!sessionValid) {
      console.log('Session is not valid, attempting refresh...');
      await refreshSessionIfNeeded();
    }

    const { data: { user }, error } = await createClient().auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Set up automatic session refresh interval
 * This should be called once when the app initializes
 */
export function setupSessionRefresh() {
  // Only set up in browser environment
  if (typeof window === 'undefined') return;

  // Refresh session every 4 minutes to prevent timeouts
  const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

  const intervalId = setInterval(async () => {
    try {
      await refreshSessionIfNeeded();
    } catch (error) {
      console.error('Automatic session refresh failed:', error);
    }
  }, REFRESH_INTERVAL);

  // Clean up interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });

  return intervalId;
} 