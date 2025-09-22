/**
 * Token Manager Service
 * 
 * Handles token refresh operations outside of React context to prevent
 * unnecessary re-renders during TOKEN_REFRESHED events.
 * 
 * This service manages:
 * - Silent token refreshes
 * - Token storage and retrieval
 * - Token expiry monitoring
 * 
 * IMPORTANT: This is a singleton service that operates independently
 * of React's render cycle to prevent cascading updates.
 */

import { createClient } from '@/auth/providers/supabase';
import { Session } from '@supabase/supabase-js';

class TokenManager {
  private static instance: TokenManager;
  private session: Session | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private supabase = createClient();
  private isRefreshing = false;
  
  // Event callbacks for critical updates only
  private onSessionExpired?: () => void;
  private onUserChanged?: (userId: string | null) => void;
  
  private constructor() {
    this.initializeTokenManagement();
  }
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  private async initializeTokenManagement() {
    // Get initial session
    const { data: { session } } = await this.supabase.auth.getSession();
    this.session = session;
    
    // Set up auth state listener for critical events only
    this.supabase.auth.onAuthStateChange((event, newSession) => {
      
      // Handle token refresh silently
      if (event === 'TOKEN_REFRESHED' && newSession) {
        this.handleTokenRefresh(newSession);
        return; // Don't trigger any UI updates
      }
      
      // Handle user changes (sign in/out)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const oldUserId = this.session?.user?.id;
        const newUserId = newSession?.user?.id;
        
        this.session = newSession;
        
        // Only notify if user actually changed
        if (oldUserId !== newUserId) {
          this.onUserChanged?.(newUserId || null);
        }
      }
      
      // Handle session expiry
      if (event === 'USER_UPDATED' && !newSession) {
        this.session = null;
        this.onSessionExpired?.();
      }
    });
    
    // Set up proactive refresh timer
    this.scheduleTokenRefresh();
  }
  
  private handleTokenRefresh(newSession: Session) {
    // Update session without triggering React re-renders
    this.session = newSession;
    // Reschedule next refresh
    this.scheduleTokenRefresh();
  }
  
  private scheduleTokenRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.session) return;

    // Calculate time until token expires (with 5 minute buffer)
    const expiresAt = this.session.expires_at;
    if (!expiresAt) return;

    const expiresIn = (expiresAt * 1000) - Date.now();
    const refreshIn = Math.max(expiresIn - (5 * 60 * 1000), 10000); // At least 10 seconds

    console.log(`⏱️ TokenManager: Scheduling token refresh`, {
      refreshInSeconds: Math.round(refreshIn / 1000),
      refreshInMinutes: Math.round(refreshIn / 60000),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      now: new Date().toISOString()
    });

    // Add debugging for unexpectedly short refresh times
    if (refreshIn < 60000) { // Less than 1 minute
      console.error('⚠️ TokenManager: WARNING - Refresh scheduled in less than 1 minute!', {
        refreshInSeconds: refreshIn / 1000,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        now: new Date().toISOString(),
        expiresIn: expiresIn / 1000,
        bufferUsed: '55 minutes'
      });
    }

    this.refreshTimer = setTimeout(() => {
      console.log('🔄 TokenManager: Starting proactive token refresh');
      this.refreshTokenProactively();
    }, refreshIn);
  }
  
  private async refreshTokenProactively() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ TokenManager: Refresh failed:', error);
        this.onSessionExpired?.();
        return;
      }
      
      if (data.session) {
        console.log('✅ TokenManager: Token refreshed successfully');
        this.session = data.session;
        this.scheduleTokenRefresh();
      }
    } finally {
      this.isRefreshing = false;
    }
  }
  
  /**
   * Get current access token for API calls
   * This is the main method components should use
   */
  async getAccessToken(): Promise<string | null> {
    // If we have a valid session, return its token
    if (this.session && this.isSessionValid()) {
      return this.session.access_token;
    }
    
    // Try to refresh if needed
    if (!this.isRefreshing) {
      await this.refreshTokenProactively();
    }
    
    return this.session?.access_token || null;
  }
  
  /**
   * Get current session (if needed for user info)
   */
  getSession(): Session | null {
    return this.session;
  }
  
  /**
   * Update session (called after sign in/sign up)
   */
  updateSession(session: Session | null) {
    this.session = session;
    if (session) {
      this.scheduleTokenRefresh();
    } else {
      // Clear refresh timer if signing out
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }
  
  /**
   * Check if current session is valid
   */
  private isSessionValid(): boolean {
    if (!this.session) return false;
    
    const expiresAt = this.session.expires_at;
    if (!expiresAt) return false;
    
    // Check if token expires in more than 1 minute
    return (expiresAt * 1000) > (Date.now() + 60000);
  }
  
  /**
   * Set callback for session expiry
   */
  onSessionExpire(callback: () => void) {
    this.onSessionExpired = callback;
  }
  
  /**
   * Set callback for user changes
   */
  onUserChange(callback: (userId: string | null) => void) {
    this.onUserChanged = callback;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();

// Export hook for React components
export function useTokenManager() {
  return tokenManager;
}