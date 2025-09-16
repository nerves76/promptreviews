"use client";
import { useEffect } from 'react';

/**
 * Global component to monitor and log all refresh/reload causes app-wide
 * Mount this in your root layout to track issues across the entire app
 */
export function GlobalRefreshMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔍 Global Refresh Monitor Active');
    
    // Create a global object to track refresh causes
    (window as any).__refreshMonitor = {
      events: [],
      logEvent: function(type: string, details: any) {
        const event = {
          type,
          details,
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          stack: new Error().stack
        };
        this.events.push(event);
        
        // Keep only last 50 events
        if (this.events.length > 50) {
          this.events.shift();
        }
        
        // Log to console with color coding
        const color = type.includes('reload') ? 'color: red' : 
                      type.includes('navigation') ? 'color: orange' : 
                      'color: blue';
        console.log(`%c[RefreshMonitor] ${type}`, color, details);
        
        // Store in localStorage for persistence
        try {
          localStorage.setItem('__refresh_monitor_events', JSON.stringify(this.events));
        } catch (e) {
          // Ignore storage errors
        }
      },
      getReport: function() {
        console.group('📊 Refresh Monitor Report');
        console.log('Total events:', this.events.length);
        
        // Group by type
        const byType = this.events.reduce((acc: any, e: any) => {
          acc[e.type] = (acc[e.type] || 0) + 1;
          return acc;
        }, {});
        console.table(byType);
        
        // Show last 10 events
        console.log('Last 10 events:');
        this.events.slice(-10).forEach((e: any) => {
          console.log(`  ${e.timestamp} - ${e.type} at ${e.path}`);
        });
        
        console.groupEnd();
        return this.events;
      }
    };
    
    // Load previous events from localStorage
    try {
      const stored = localStorage.getItem('__refresh_monitor_events');
      if (stored) {
        (window as any).__refreshMonitor.events = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    // Monitor window.location changes
    let lastLocation = window.location.href;
    let checkInterval = setInterval(() => {
      const currentLocation = window.location.href;
      if (currentLocation !== lastLocation) {
        (window as any).__refreshMonitor.logEvent('location_change', {
          from: lastLocation,
          to: currentLocation
        });
        lastLocation = currentLocation; // Update the last location after logging
      }
    }, 500); // Check less frequently to reduce overhead
    
    // Try to intercept window.location methods (may fail in some browsers)
    try {
      const originalReload = window.location.reload.bind(window.location);
      Object.defineProperty(window.location, 'reload', {
        value: function(...args: any) {
          (window as any).__refreshMonitor.logEvent('location.reload', {
            args,
            caller: new Error().stack
          });
          return originalReload.apply(location, args as any);
        },
        configurable: true
      });
    } catch (e) {
      // Some browsers don't allow overriding location.reload
      console.log('Could not override location.reload - skipping');
    }
    
    // Monitor MutationObserver for DOM replacements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && 
            mutation.target === document.body && 
            mutation.removedNodes.length > 10) {
          (window as any).__refreshMonitor.logEvent('large_dom_replacement', {
            removedNodes: mutation.removedNodes.length,
            addedNodes: mutation.addedNodes.length
          });
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: false
    });
    
    // Add console helper
    (window as any).refreshReport = () => (window as any).__refreshMonitor.getReport();
    console.log('💡 Type "refreshReport()" in console to see refresh event report');
    
    return () => {
      clearInterval(checkInterval);
      // Don't try to restore reload as it may be read-only
      observer.disconnect();
    };
  }, []);
  
  return null;
}