"use client";
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Advanced navigation debugger to identify what's causing navigation loops
 * Tracks all navigation attempts with detailed stack traces and component info
 */
export function NavigationDebugger() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationLogRef = useRef<any[]>([]);
  const lastPathnameRef = useRef(pathname);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔍 Navigation Debugger Active');
    
    // Create global navigation tracker
    (window as any).__navDebug = {
      logs: navigationLogRef.current,
      logNavigation: function(type: string, details: any) {
        const entry = {
          type,
          details,
          pathname: window.location.pathname,
          timestamp: new Date().toISOString(),
          stack: new Error().stack,
          component: getCurrentComponent()
        };
        
        this.logs.push(entry);
        if (this.logs.length > 100) this.logs.shift();
        
        // Color code by severity
        const color = type.includes('loop') ? 'color: red; font-weight: bold' :
                     type.includes('push') ? 'color: orange' :
                     type.includes('mount') ? 'color: green' :
                     'color: blue';
        
        console.log(`%c[NavDebug] ${type}`, color, {
          ...details,
          component: entry.component,
          pathname: entry.pathname
        });
        
        // Detect navigation loops
        const recentNavs = this.logs.slice(-10);
        const pathChanges = recentNavs.filter(l => l.type === 'pathname_change');
        if (pathChanges.length >= 4) {
          const paths = pathChanges.map(p => p.details.to);
          // Check for A->B->A pattern
          if (paths[paths.length-1] === paths[paths.length-3] &&
              paths[paths.length-2] === paths[paths.length-4]) {
            console.warn('⚠️ NAVIGATION LOOP DETECTED!', {
              pattern: paths.slice(-4).join(' → '),
              entries: pathChanges.slice(-4)
            });
          }
        }
      },
      getReport: function() {
        console.group('📊 Navigation Debug Report');
        
        // Count by type
        const byType = this.logs.reduce((acc: any, log: any) => {
          acc[log.type] = (acc[log.type] || 0) + 1;
          return acc;
        }, {});
        console.log('Navigation events by type:');
        console.table(byType);
        
        // Show navigation patterns
        const pathChanges = this.logs.filter(l => l.type === 'pathname_change');
        if (pathChanges.length > 0) {
          console.log('Path navigation sequence:');
          pathChanges.slice(-10).forEach(p => {
            console.log(`  ${p.timestamp}: ${p.details.from} → ${p.details.to}`);
          });
        }
        
        // Show recent router.push calls
        const pushCalls = this.logs.filter(l => l.type === 'router_push');
        if (pushCalls.length > 0) {
          console.log('Recent router.push calls:');
          pushCalls.slice(-5).forEach(p => {
            console.log(`  ${p.timestamp}: ${p.details.url} from ${p.component}`);
          });
        }
        
        console.groupEnd();
        return this.logs;
      }
    };
    
    // Helper to get current component name from stack
    function getCurrentComponent() {
      const stack = new Error().stack || '';
      const lines = stack.split('\\n');
      // Look for React component names in stack
      for (const line of lines) {
        if (line.includes('use') || line.includes('Component') || 
            line.includes('Page') || line.includes('Layout')) {
          const match = line.match(/at (\\w+)/);
          if (match) return match[1];
        }
      }
      return 'Unknown';
    }
    
    // Intercept router methods
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;
    const originalRefresh = router.refresh;
    
    (router as any).push = function(url: string, ...args: any[]) {
      (window as any).__navDebug.logNavigation('router_push', { 
        url, 
        args,
        caller: new Error().stack?.split('\\n')[2] 
      });
      return originalPush.call(router, url, ...args);
    };
    
    (router as any).replace = function(url: string, ...args: any[]) {
      (window as any).__navDebug.logNavigation('router_replace', { 
        url, 
        args,
        caller: new Error().stack?.split('\\n')[2]
      });
      return originalReplace.call(router, url, ...args);
    };
    
    (router as any).back = function(...args: any[]) {
      (window as any).__navDebug.logNavigation('router_back', {
        caller: new Error().stack?.split('\\n')[2]
      });
      return originalBack.call(router, ...args);
    };
    
    (router as any).forward = function(...args: any[]) {
      (window as any).__navDebug.logNavigation('router_forward', {
        caller: new Error().stack?.split('\\n')[2]
      });
      return originalForward.call(router, ...args);
    };
    
    (router as any).refresh = function(...args: any[]) {
      (window as any).__navDebug.logNavigation('router_refresh', {
        caller: new Error().stack?.split('\\n')[2]
      });
      return originalRefresh.call(router, ...args);
    };
    
    // Add console helper
    (window as any).navReport = () => (window as any).__navDebug.getReport();
    console.log('💡 Type "navReport()" in console for navigation debug report');
    
    return () => {
      // Restore original methods
      (router as any).push = originalPush;
      (router as any).replace = originalReplace;
      (router as any).back = originalBack;
      (router as any).forward = originalForward;
      (router as any).refresh = originalRefresh;
    };
  }, [router]);
  
  // Track pathname changes
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      (window as any).__navDebug?.logNavigation('pathname_change', {
        from: lastPathnameRef.current,
        to: pathname
      });
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);
  
  // Track component lifecycle
  useEffect(() => {
    (window as any).__navDebug?.logNavigation('component_mount', {
      component: 'NavigationDebugger',
      pathname
    });
    
    return () => {
      (window as any).__navDebug?.logNavigation('component_unmount', {
        component: 'NavigationDebugger',
        pathname
      });
    };
  }, []);
  
  return null;
}