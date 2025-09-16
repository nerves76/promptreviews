"use client";
import { useEffect, useRef } from 'react';

/**
 * Ultimate Refresh Debugger - Catches ALL refresh triggers
 * This enhanced debugger will identify the exact cause of unexpected refreshes
 */
export function UltimateRefreshDebugger() {
  const startTime = useRef(Date.now());
  const refreshCount = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize ultimate debugger
    (window as any).__ultimateDebugger = {
      startTime: startTime.current,
      refreshTriggers: [],
      timers: new Map(),
      intervals: new Map(),
      
      recordTrigger: function(type: string, details: any, stack?: string) {
        const trigger = {
          type,
          details,
          timestamp: Date.now(),
          timeSinceStart: Date.now() - this.startTime,
          stack: stack || new Error().stack
        };
        
        this.refreshTriggers.push(trigger);
        
        // Alert on critical events
        if (type.includes('RELOAD') || type.includes('REFRESH')) {
          console.error('%c🚨 REFRESH TRIGGER DETECTED!', 'color: red; font-size: 20px');
          console.error('Type:', type);
          console.error('Time since page load:', Math.round(trigger.timeSinceStart / 1000), 'seconds');
          console.error('Details:', details);
          console.trace();
          
          // Store for persistence
          try {
            const history = JSON.parse(localStorage.getItem('refresh_history') || '[]');
            history.push({
              ...trigger,
              url: window.location.href,
              userAgent: navigator.userAgent
            });
            localStorage.setItem('refresh_history', JSON.stringify(history.slice(-20)));
          } catch (e) {}
        }
      },
      
      analyzePattern: function() {
        console.group('%c🔬 Refresh Pattern Analysis', 'color: purple; font-size: 16px');
        
        // Calculate intervals between triggers
        const intervals: number[] = [];
        for (let i = 1; i < this.refreshTriggers.length; i++) {
          intervals.push(this.refreshTriggers[i].timestamp - this.refreshTriggers[i-1].timestamp);
        }
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          console.log('Average interval between events:', Math.round(avgInterval / 1000), 'seconds');
          console.log('Min interval:', Math.round(Math.min(...intervals) / 1000), 'seconds');
          console.log('Max interval:', Math.round(Math.max(...intervals) / 1000), 'seconds');
        }
        
        // Group by type
        const byType = this.refreshTriggers.reduce((acc: any, t: any) => {
          acc[t.type] = (acc[t.type] || 0) + 1;
          return acc;
        }, {});
        
        console.table(byType);
        
        // Show timing pattern
        console.log('Event timeline:');
        this.refreshTriggers.forEach((t: any) => {
          const minutes = Math.floor(t.timeSinceStart / 60000);
          const seconds = Math.floor((t.timeSinceStart % 60000) / 1000);
          console.log(`  ${minutes}:${seconds.toString().padStart(2, '0')} - ${t.type}`);
        });
        
        console.groupEnd();
      },
      
      showHistory: function() {
        try {
          const history = JSON.parse(localStorage.getItem('refresh_history') || '[]');
          console.group('%c📜 Refresh History (Last 20)', 'color: blue; font-size: 14px');
          history.forEach((h: any, i: number) => {
            console.log(`${i + 1}. ${new Date(h.timestamp).toLocaleString()} - ${h.type}`);
            console.log('   URL:', h.url);
            console.log('   Time on page:', Math.round(h.timeSinceStart / 1000), 'seconds');
          });
          console.groupEnd();
        } catch (e) {
          console.log('No history available');
        }
      }
    };

    // Intercept ALL timer functions
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalClearInterval = window.clearInterval;
    
    window.setTimeout = function(...args: any[]) {
      const stack = new Error().stack;
      const id = originalSetTimeout.apply(window, args as any);
      
      // Track timers that might cause refresh
      const delay = args[1] || 0;
      if (delay > 60000) { // Track timers > 1 minute
        (window as any).__ultimateDebugger.timers.set(id, {
          delay,
          stack,
          created: Date.now()
        });
        
        (window as any).__ultimateDebugger.recordTrigger('TIMER_SET', {
          delay: Math.round(delay / 1000) + ' seconds',
          id
        }, stack);
      }
      
      return id;
    };
    
    window.setInterval = function(...args: any[]) {
      const stack = new Error().stack;
      const id = originalSetInterval.apply(window, args as any);
      
      const interval = args[1] || 0;
      (window as any).__ultimateDebugger.intervals.set(id, {
        interval,
        stack,
        created: Date.now()
      });
      
      (window as any).__ultimateDebugger.recordTrigger('INTERVAL_SET', {
        interval: Math.round(interval / 1000) + ' seconds',
        id
      }, stack);
      
      return id;
    };
    
    window.clearTimeout = function(id: any) {
      if ((window as any).__ultimateDebugger.timers.has(id)) {
        (window as any).__ultimateDebugger.recordTrigger('TIMER_CLEARED', { id });
        (window as any).__ultimateDebugger.timers.delete(id);
      }
      return originalClearTimeout(id);
    };
    
    window.clearInterval = function(id: any) {
      if ((window as any).__ultimateDebugger.intervals.has(id)) {
        (window as any).__ultimateDebugger.recordTrigger('INTERVAL_CLEARED', { id });
        (window as any).__ultimateDebugger.intervals.delete(id);
      }
      return originalClearInterval(id);
    };

    // Intercept location.reload
    const descriptor = Object.getOwnPropertyDescriptor(window.location, 'reload');
    if (!descriptor || descriptor.configurable !== false) {
      try {
        const originalReload = window.location.reload.bind(window.location);
        Object.defineProperty(window.location, 'reload', {
          value: function(...args: any[]) {
            (window as any).__ultimateDebugger.recordTrigger('LOCATION_RELOAD', {
              args,
              caller: new Error().stack
            });
            return originalReload.apply(window.location, args);
          },
          configurable: true
        });
      } catch (e) {
        console.log('Could not intercept location.reload');
      }
    }

    // Monitor auth events
    if ((window as any).supabase) {
      const supabase = (window as any).supabase;
      const originalOnAuthStateChange = supabase.auth.onAuthStateChange;
      
      supabase.auth.onAuthStateChange = function(callback: any) {
        const wrappedCallback = (event: string, session: any) => {
          (window as any).__ultimateDebugger.recordTrigger('AUTH_EVENT', {
            event,
            hasSession: !!session,
            userId: session?.user?.id
          });
          return callback(event, session);
        };
        return originalOnAuthStateChange.call(supabase.auth, wrappedCallback);
      };
    }

    // Add console commands
    (window as any).ultimateDebug = () => (window as any).__ultimateDebugger.analyzePattern();
    (window as any).refreshHistory = () => (window as any).__ultimateDebugger.showHistory();
    (window as any).clearRefreshHistory = () => {
      localStorage.removeItem('refresh_history');
      console.log('History cleared');
    };

    console.log('%c🚀 Ultimate Refresh Debugger Active', 'color: green; font-size: 16px');
    console.log('Commands:');
    console.log('  ultimateDebug() - Analyze refresh patterns');
    console.log('  refreshHistory() - Show historical refreshes');
    console.log('  clearRefreshHistory() - Clear history');

    // Check for previous refresh
    const lastRefresh = sessionStorage.getItem('last_refresh_time');
    if (lastRefresh) {
      const timeSinceLast = Date.now() - parseInt(lastRefresh);
      console.warn('%c⚠️ Page refreshed', 'color: orange', Math.round(timeSinceLast / 1000), 'seconds ago');
    }
    sessionStorage.setItem('last_refresh_time', Date.now().toString());

  }, []);

  return null;
}