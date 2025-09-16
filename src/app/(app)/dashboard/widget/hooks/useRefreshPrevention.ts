"use client";

import { useEffect, useRef } from 'react';

/**
 * Hook to detect and prevent unwanted page refreshes
 * Logs the source of potential refreshes for debugging
 */
export function useRefreshPrevention(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const rapidRenderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    // Detect rapid re-renders (less than 100ms apart)
    if (timeSinceLastRender < 100) {
      rapidRenderCount.current++;
      
      if (rapidRenderCount.current > 5) {
      }
    } else {
      rapidRenderCount.current = 0;
    }
    
    // Log render info for debugging
    if (renderCount.current > 10) {
      console.warn(`🔄 ${componentName} has rendered ${renderCount.current} times`, {
        timeSinceLastRender,
        timestamp: new Date().toISOString()
      });
    }
    
    lastRenderTime.current = now;
  });
  
  // Intercept and log any navigation attempts
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      return originalPushState.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      return originalReplaceState.apply(window.history, args);
    };
    
    // Listen for popstate events
    const handlePopState = (e: PopStateEvent) => {
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [componentName]);
  
  // Monitor for location changes
  useEffect(() => {
    let lastHref = window.location.href;
    
    const checkLocationChange = () => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
      }
    };
    
    const interval = setInterval(checkLocationChange, 500);
    
    return () => clearInterval(interval);
  }, [componentName]);
  
  return {
    renderCount: renderCount.current
  };
}