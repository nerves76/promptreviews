"use client";
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guard against unwanted page refreshes and navigation
 * Monitors and prevents various types of refresh triggers
 */
export function useRefreshGuard(componentName: string) {
  const router = useRouter();
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
      console.trace('Stack trace for pushState');
      return originalPushState.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      console.log('📍 History replaceState intercepted:', args[2]);
      console.trace('Stack trace for replaceState');
      return originalReplaceState.apply(window.history, args);
    };
    
    // Monitor for beforeunload events
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🚪 Page unload detected');
      console.trace('Stack trace for unload');
      
      // In development, you might want to prevent unload to debug
      if (process.env.NODE_ENV === 'development') {
        // Uncomment to prevent page unload during debugging
        // e.preventDefault();
        // e.returnValue = '';
      }
    };
    
    // Monitor popstate events (back/forward navigation)
    const handlePopState = (e: PopStateEvent) => {
      console.log('⏮️ Popstate event detected');
      console.trace('Stack trace for popstate');
    };
    
    // Monitor visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Page hidden');
      } else {
        console.log('👁️ Page visible');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Monkey patch router methods to track navigation
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalRefresh = router.refresh;
    
    (router as any).push = function(...args: any[]) {
      console.log('🚀 Router.push intercepted:', args[0]);
      console.trace('Stack trace for router.push');
      return originalPush.apply(router, args);
    };
    
    (router as any).replace = function(...args: any[]) {
      console.log('🔁 Router.replace intercepted:', args[0]);
      console.trace('Stack trace for router.replace');
      return originalReplace.apply(router, args);
    };
    
    (router as any).refresh = function(...args: any[]) {
      console.log('🔄 Router.refresh intercepted');
      console.trace('Stack trace for router.refresh');
      return originalRefresh.apply(router, args);
    };
    
    return () => {
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      (router as any).push = originalPush;
      (router as any).replace = originalReplace;
      (router as any).refresh = originalRefresh;
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [componentName, router]);
  
  return {
    renderCount: renderCountRef.current,
    timeSinceMount: Date.now() - mountTimeRef.current
  };
}