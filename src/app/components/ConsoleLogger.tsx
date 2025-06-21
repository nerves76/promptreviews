"use client";

import React, { useState, useEffect, useRef } from 'react';

// A component to capture and display console.log messages
// This is useful for debugging on devices where devtools are not available
export default function ConsoleLogger() {
  const [logs, setLogs] = useState<string[]>([]);
  const pendingLogsRef = useRef<string[]>([]);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const originalLog = console.log;

    const processQueue = () => {
      if (pendingLogsRef.current.length > 0) {
        const newLogs = [...pendingLogsRef.current];
        pendingLogsRef.current = [];
        setLogs(prevLogs => [...prevLogs, ...newLogs]);
      }
      setTimeout(processQueue, 500); // Process queue every 500ms
    };

    const timeoutId = setTimeout(processQueue, 500);

    console.log = (...args) => {
      originalLog.apply(console, args);
      
      // Prevent capturing logs during initial server render or before mount
      if (!isMountedRef.current) {
        return;
      }

      try {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return 'Unserializable Object';
            }
          }
          return String(arg);
        }).join(' ');

        pendingLogsRef.current.push(message);

      } catch (error) {
        // Fallback for any unexpected error
        pendingLogsRef.current.push('Error formatting log message.');
      }
    };

    return () => {
      console.log = originalLog;
      clearTimeout(timeoutId);
      isMountedRef.current = false;
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        width: 'calc(100% - 20px)',
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>Dev Console</span>
        <button 
          onClick={() => setLogs([])}
          style={{ background: 'none', border: '1px solid #333', color: '#0f0', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
      {logs.length === 0 && <div style={{ color: '#888' }}>No logs yet...</div>}
      {logs.map((log, index) => (
        <div key={index} style={{ borderBottom: '1px solid #222', padding: '2px 0' }}>
          {log}
        </div>
      ))}
    </div>
  );
} 