"use client";
import React, { useState, useEffect, useRef } from 'react';
import { FaBug, FaCopy, FaTimes, FaPlay, FaStop } from 'react-icons/fa';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any[];
}

export default function ConsoleLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsoleRef = useRef<{
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
  } | null>(null);
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(false);

  // Mark as mounted after initial render
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCapturing) {
      scrollToBottom();
    }
  }, [logs, isCapturing]);

  useEffect(() => {
    // Load logs from localStorage on mount
    const savedLogs = localStorage.getItem('consoleLoggerLogs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
      } catch (error) {
        console.warn('Failed to parse saved logs:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save logs to localStorage whenever they change
    if (logs.length > 0) {
      localStorage.setItem('consoleLoggerLogs', JSON.stringify(logs));
    }
  }, [logs]);

  // Process pending logs
  const processPendingLogs = () => {
    if (isProcessingRef.current || pendingLogsRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    
    // Use setTimeout to ensure we're not in a render cycle
    setTimeout(() => {
      const pendingLogs = [...pendingLogsRef.current];
      pendingLogsRef.current = [];
      
      setLogs(prev => [...prev, ...pendingLogs]);
      isProcessingRef.current = false;
      
      // Process any new logs that came in while we were processing
      if (pendingLogsRef.current.length > 0) {
        processPendingLogs();
      }
    }, 0);
  };

  const startCapturing = () => {
    setIsCapturing(true);
    
    // Store original console methods
    originalConsoleRef.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    console.log = (...args) => {
      originalConsoleRef.current?.log.apply(console, args);
      addLog('log', ...args);
    };

    console.warn = (...args) => {
      originalConsoleRef.current?.warn.apply(console, args);
      addLog('warn', ...args);
    };

    console.error = (...args) => {
      originalConsoleRef.current?.error.apply(console, args);
      addLog('error', ...args);
    };

    console.info = (...args) => {
      originalConsoleRef.current?.info.apply(console, args);
      addLog('info', ...args);
    };

    // Add initial log to confirm capture is working
    addLog('info', 'Console capture started - all console output will be logged here');
  };

  const stopCapturing = () => {
    setIsCapturing(false);
    
    // Restore original console methods
    if (originalConsoleRef.current) {
      console.log = originalConsoleRef.current.log;
      console.warn = originalConsoleRef.current.warn;
      console.error = originalConsoleRef.current.error;
      console.info = originalConsoleRef.current.info;
      originalConsoleRef.current = null;
    }

    addLog('info', 'Console capture stopped');
  };

  const addLog = (level: LogEntry['level'], ...args: any[]) => {
    // Don't capture logs during initial render
    if (!isMountedRef.current) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    const newLog: LogEntry = {
      timestamp,
      level,
      message,
      data: args
    };

    // Add to pending logs and process them
    pendingLogsRef.current.push(newLog);
    processPendingLogs();
  };

  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      alert('Logs copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy logs:', err);
      alert('Failed to copy logs. Please try again.');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('consoleLoggerLogs');
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-800';
    }
  };

  const getLogLevelBg = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-50';
      case 'warn': return 'bg-yellow-50';
      case 'info': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-colors ${
          isCapturing 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-slateblue text-white hover:bg-slateblue/90'
        }`}
        title={`Debug Console Logger - ${isCapturing ? 'Capturing' : 'Not Capturing'}`}
      >
        <FaBug size={20} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Console Logger
              </h2>
              <div className="flex items-center space-x-2">
                {!isCapturing ? (
                  <button
                    onClick={startCapturing}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
                  >
                    <FaPlay size={12} />
                    Start Capturing
                  </button>
                ) : (
                  <button
                    onClick={stopCapturing}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center gap-1"
                  >
                    <FaStop size={12} />
                    Stop Capturing
                  </button>
                )}
                <button
                  onClick={copyLogs}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                  disabled={logs.length === 0}
                >
                  <FaCopy size={12} />
                  Copy
                </button>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  disabled={logs.length === 0}
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* Logs Display */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {isCapturing ? 'Waiting for console logs...' : 'No logs captured yet. Click "Start Capturing" to begin.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${getLogLevelBg(log.level)}`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className={`text-xs font-mono ${getLogLevelColor(log.level)}`}>
                          [{log.timestamp}]
                        </span>
                        <span className={`text-xs font-semibold ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-sm text-gray-800 whitespace-pre-wrap">
                        {log.message}
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {isCapturing ? '🟢 Capturing logs...' : '🔴 Not capturing'}
                </span>
                <span>
                  {logs.length} log{logs.length !== 1 ? 's' : ''} captured
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 