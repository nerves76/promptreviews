/**
 * Session Management Context
 * Handles session state and timing
 */

import { useMemo } from 'react';
import { Session } from '@supabase/supabase-js';

export interface SessionState {
  sessionExpiry: Date | null;
  sessionTimeRemaining: number;
  isSessionExpiringSoon: boolean;
}

/**
 * Calculate session state from Supabase session
 */
export function useSessionState(session: Session | null): SessionState {
  const sessionExpiry = useMemo(() => {
    if (!session?.expires_at) return null;
    return new Date(session.expires_at * 1000);
  }, [session]);
  
  const sessionTimeRemaining = useMemo(() => {
    if (!sessionExpiry) return 0;
    const now = new Date();
    const remaining = sessionExpiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }, [sessionExpiry]);
  
  const isSessionExpiringSoon = useMemo(() => {
    return sessionTimeRemaining > 0 && sessionTimeRemaining < 300; // 5 minutes
  }, [sessionTimeRemaining]);
  
  return {
    sessionExpiry,
    sessionTimeRemaining,
    isSessionExpiringSoon
  };
}