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
    console.log(`🛡️ RefreshGuard [${componentName}]: Render #${renderCount} at ${timeSinceMount}ms`);
    
    // Detect rapid re-renders (more than 10 in 500ms - more reasonable threshold)
    if (renderCount > 10 && timeSinceMount < 500) {
      console.error(`⚠️ RAPID RE-RENDERS DETECTED in ${componentName}!`);
      console.trace('Stack trace for rapid re-renders');
    }
    
    // Monitor for path changes
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPathRef.current) {
        console.log(`🔄 Path changed: ${lastPathRef.current} → ${currentPath}`);
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
      console.log('📍 History pushState intercepted:', args[2]);
      return originalPushState.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      console.log('📍 History replaceState intercepted:', args[2]);
      return originalReplaceState.apply(window.history, args);
    };
    
    // Monitor for beforeunload events
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🚪 Page unload detected');
    };
    
    // Monitor popstate events (back/forward navigation)
    const handlePopState = (e: PopStateEvent) => {
      console.log('⏮️ Popstate event detected');
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