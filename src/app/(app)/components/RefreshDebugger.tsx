"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Enhanced Refresh Debugger to track down unexpected page refreshes
 * This component logs all potential refresh triggers with stack traces
 */
export function RefreshDebugger() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('%c🔍 Refresh Debugger Active', 'color: #ff6b6b; font-weight: bold', {
      path: pathname,
      timestamp: new Date().toISOString()
    });

    // Create global refresh tracker
    if (!(window as any).__refreshDebugger) {
      (window as any).__refreshDebugger = {
        suspiciousEvents: [],
        lastActivity: Date.now(),
        
        logSuspiciousEvent: function(eventType: string, details: any) {
          const event = {
            type: eventType,
            details,
            timestamp: new Date().toISOString(),
            path: window.location.pathname,
            timeSinceLastActivity: Date.now() - this.lastActivity,
            stack: new Error().stack
          };
          
          this.suspiciousEvents.push(event);
          this.lastActivity = Date.now();
          
          // Alert on potential refresh triggers
          if (eventType.includes('refresh') || eventType.includes('reload')) {
            console.error('%c⚠️ REFRESH DETECTED!', 'color: red; font-size: 16px; font-weight: bold');
            console.error('Event:', event);
            console.trace('Stack trace:');
            
            // Store in sessionStorage for persistence across refresh
            try {
              sessionStorage.setItem('last_refresh_trigger', JSON.stringify(event));
            } catch (e) {}
          }
          
          // Keep only last 100 events
          if (this.suspiciousEvents.length > 100) {
            this.suspiciousEvents.shift();
          }
        },
        
        getReport: function() {
          console.group('%c📊 Refresh Debugger Report', 'color: #ff6b6b; font-weight: bold');
          console.log('Total suspicious events:', this.suspiciousEvents.length);
          
          // Group by type
          const byType = this.suspiciousEvents.reduce((acc: any, e: any) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
          }, {});
          console.table(byType);
          
          // Show events with short time gaps (potential rapid refreshes)
          const rapidEvents = this.suspiciousEvents.filter((e: any) => e.timeSinceLastActivity < 1000);
          if (rapidEvents.length > 0) {
            console.log('%cRapid events (< 1 second):', 'color: orange');
            rapidEvents.forEach((e: any) => {
              console.log(`  ${e.timestamp} - ${e.type} (${e.timeSinceLastActivity}ms)`);
            });
          }
          
          console.groupEnd();
          return this.suspiciousEvents;
        }
      };
    }

    // Check for last refresh trigger from previous session
    try {
      const lastTrigger = sessionStorage.getItem('last_refresh_trigger');
      if (lastTrigger) {
        const trigger = JSON.parse(lastTrigger);
        console.warn('%c⚠️ Previous refresh detected:', 'color: orange; font-weight: bold');
        console.warn(trigger);
        sessionStorage.removeItem('last_refresh_trigger');
      }
    } catch (e) {}

    // Monitor auth state changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      if (key.includes('auth') || key.includes('account') || key.includes('session')) {
        (window as any).__refreshDebugger.logSuspiciousEvent('localStorage_auth_change', {
          key,
          valueLength: value?.length,
          preview: value?.substring(0, 100)
        });
      }
      return originalSetItem.call(localStorage, key, value);
    };

    // Monitor history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      (window as any).__refreshDebugger.logSuspiciousEvent('history.pushState', {
        url: args[2],
        state: args[0]
      });
      return originalPushState.apply(history, args);
    };
    
    history.replaceState = function(...args) {
      (window as any).__refreshDebugger.logSuspiciousEvent('history.replaceState', {
        url: args[2],
        state: args[0]
      });
      return originalReplaceState.apply(history, args);
    };

    // Monitor popstate (browser back/forward)
    window.addEventListener('popstate', (event) => {
      (window as any).__refreshDebugger.logSuspiciousEvent('popstate', {
        state: event.state
      });
    });

    // Monitor beforeunload (page about to refresh/close)
    window.addEventListener('beforeunload', (event) => {
      (window as any).__refreshDebugger.logSuspiciousEvent('beforeunload', {
        returnValue: event.returnValue
      });
    });

    // Monitor visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        (window as any).__refreshDebugger.logSuspiciousEvent('tab_became_visible', {
          hiddenDuration: Date.now() - (window as any).__refreshDebugger.lastActivity
        });
      }
    });

    // Add console commands
    (window as any).refreshDebugReport = () => (window as any).__refreshDebugger.getReport();
    (window as any).clearRefreshDebug = () => {
      (window as any).__refreshDebugger.suspiciousEvents = [];
      console.log('Refresh debug history cleared');
    };

    console.log('%c💡 Commands available:', 'color: #4ecdc4');
    console.log('  refreshDebugReport() - Show suspicious event report');
    console.log('  clearRefreshDebug() - Clear event history');
    console.log('  refreshReport() - Show global refresh monitor report');

    return () => {
      // Restore original functions on cleanup
      localStorage.setItem = originalSetItem;
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [pathname]);

  return null;
}