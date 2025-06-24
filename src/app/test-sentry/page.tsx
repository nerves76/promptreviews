/**
 * Test page for Sentry client-side integration
 * This page allows testing Sentry error reporting from the browser
 */

'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { addBreadcrumb, captureError, captureMessage, setUserContext } from '../../utils/sentry';

export default function TestSentryPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBreadcrumb = () => {
    addBreadcrumb('Test breadcrumb added', 'test', { source: 'test-page' });
    addResult('Breadcrumb added successfully');
  };

  const testMessage = () => {
    captureMessage('Test message from client', 'info', {
      test: {
        source: 'test-page',
        timestamp: new Date().toISOString(),
      },
    });
    addResult('Message captured successfully');
  };

  const testError = () => {
    const testError = new Error('Test error from client');
    captureError(testError, {
      test: {
        source: 'test-page',
        purpose: 'testing',
      },
    }, {
      test: 'true',
      component: 'TestSentryPage',
    });
    addResult('Error captured successfully');
  };

  const testUserContext = () => {
    setUserContext({
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
    addResult('User context set successfully');
  };

  const testAPI = async () => {
    try {
      const response = await fetch('/api/test-sentry');
      const data = await response.json();
      addResult(`API test: ${data.message}`);
    } catch (error) {
      addResult(`API test failed: ${error}`);
    }
  };

  const testAPIWithData = async () => {
    try {
      const response = await fetch('/api/test-sentry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data', timestamp: new Date().toISOString() }),
      });
      const data = await response.json();
      addResult(`API POST test: ${data.message}`);
    } catch (error) {
      addResult(`API POST test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Sentry Integration Test
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Client Tests</h2>
              
              <button
                onClick={testBreadcrumb}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Test Breadcrumb
              </button>
              
              <button
                onClick={testMessage}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Test Message
              </button>
              
              <button
                onClick={testError}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Test Error
              </button>
              
              <button
                onClick={testUserContext}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
              >
                Test User Context
              </button>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">API Tests</h2>
              
              <button
                onClick={testAPI}
                className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
              >
                Test API GET
              </button>
              
              <button
                onClick={testAPIWithData}
                className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600"
              >
                Test API POST
              </button>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
              <button
                onClick={clearResults}
                className="bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Run some tests above!</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono text-gray-700">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Run the tests above to verify Sentry integration</li>
              <li>• Check your Sentry dashboard for captured events</li>
              <li>• Make sure you've added your Sentry DSN to .env.local</li>
              <li>• Errors are only sent in production mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 