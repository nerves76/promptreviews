"use client";
import { useEffect, useRef } from 'react';

/**
 * Guard against unwanted page refreshes and navigation
 * Monitors and prevents various types of refresh triggers
 */
export function useRefreshGuard(componentName: string) {
  const mountTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);
  const lastPathRef = useRef(typeof window !== 'undefined' ? window.location.pathname : '');
  
  useEffect(() => {
    renderCountRef.current++;
    const renderCount = renderCountRef.current;
    const timeSinceMount = Date.now() - mountTimeRef.current;
    
    // Log render information
    
    // Detect rapid re-renders (more than 10 in 500ms - more reasonable threshold)
    if (renderCount > 10 && timeSinceMount < 500) {
    }
    
    // Monitor for path changes
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPathRef.current) {
        lastPathRef.current = currentPath;
      }
    }
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Intercept and log history changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      return originalPushState.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      return originalReplaceState.apply(window.history, args);
    };
    
    // Monitor for beforeunload events
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    };
    
    // Monitor popstate events (back/forward navigation)
    const handlePopState = (e: PopStateEvent) => {
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [componentName]);
  
  return {
    renderCount: renderCountRef.current,
    timeSinceMount: Date.now() - mountTimeRef.current
  };
}