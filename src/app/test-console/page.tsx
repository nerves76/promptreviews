"use client";
import React, { useEffect } from 'react';

export default function TestConsolePage() {
  useEffect(() => {
    console.log('=== TEST CONSOLE PAGE RENDERING ===');
    console.log('This should not cause a setState during render error');
    console.warn('This is a test warning');
    console.error('This is a test error');
    console.info('This is a test info message');
  }, []);

  const handleTestLog = () => {
    console.log('Button clicked - this should be captured by ConsoleLogger');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Console Logger Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open the Console Logger by clicking the debug button in the bottom right</li>
            <li>Click "Start Capturing" in the Console Logger modal</li>
            <li>Click the button below to generate test logs</li>
            <li>Verify that logs are captured without errors</li>
          </ol>
          
          <button
            onClick={handleTestLog}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Test Logs
          </button>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>No "setState during render" errors should appear</li>
            <li>Console logs should be captured by the ConsoleLogger component</li>
            <li>The page should render without freezing or crashing</li>
            <li>All console methods (log, warn, error, info) should work</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 