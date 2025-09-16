"use client";

import { useState } from "react";

export default function BrowserAuthTest() {
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: API Route Authentication
      addResult("Starting", true, "🧪 Starting browser-based authentication tests", null);

      try {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'nerves76@gmail.com',
            password: 'Prcamus9721!',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          addResult("API Authentication", false, `❌ API authentication failed: ${errorData.error}`, errorData);
          return;
        }

        const authResult = await response.json();
        addResult("API Authentication", true, `✅ API authentication successful for ${authResult.user.email}`, authResult);

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 2: Session Validation
        try {
          const sessionResponse = await fetch('/api/auth/session');

          if (!sessionResponse.ok) {
            addResult("Session Validation", false, `❌ Session validation request failed: ${sessionResponse.status}`, null);
            return;
          }

          const sessionData = await sessionResponse.json();

          if (sessionData.authenticated && sessionData.user) {
            addResult("Session Validation", true, `✅ Session validation successful for ${sessionData.user.email}`, sessionData);
          } else {
            addResult("Session Validation", false, `❌ Session validation failed`, sessionData);
          }

        } catch (sessionError) {
          addResult("Session Validation", false, `❌ Session validation request error: ${sessionError}`, null);
        }

        // Test 3: Dashboard Access
        try {
          const dashboardResponse = await fetch('/dashboard', {
            redirect: 'manual'
          });

          if (dashboardResponse.type === 'opaqueredirect' || dashboardResponse.status === 0) {
            // This indicates a redirect happened, which means we're not authenticated
            addResult("Dashboard Access", false, "❌ Dashboard redirects (middleware doesn't detect session)", null);
          } else if (dashboardResponse.status === 200) {
            addResult("Dashboard Access", true, "✅ Dashboard accessible (middleware detects session)", null);
          } else {
            addResult("Dashboard Access", false, `❌ Dashboard response: ${dashboardResponse.status}`, null);
          }

        } catch (dashboardError) {
          addResult("Dashboard Access", false, `❌ Dashboard test error: ${dashboardError}`, null);
        }

        // Test 4: Client-side Supabase Session
        try {
          const { supabase } = await import("@/auth/providers/supabase");
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            addResult("Client Session", false, `❌ Client session error: ${error.message}`, error);
          } else if (session && session.user) {
            addResult("Client Session", true, `✅ Client session valid for ${session.user.email}`, session);
          } else {
            addResult("Client Session", false, "❌ No client session found", null);
          }

        } catch (clientError) {
          addResult("Client Session", false, `❌ Client session test error: ${clientError}`, null);
        }

      } catch (authError) {
        addResult("API Authentication", false, `❌ API authentication error: ${authError}`, null);
      }

    } catch (error) {
      addResult("Test Suite", false, `❌ Test suite error: ${error}`, null);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? "✅" : "❌";
  };

  const getStatusColor = (success: boolean) => {
    return success ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔬 Browser Authentication Test Suite
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page tests the complete authentication flow using real browser cookie management.
              Unlike Node.js tests, this properly simulates how authentication works for real users.
            </p>
            
            <button
              onClick={runAuthTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg"
            >
              {isRunning ? "Running Tests..." : "🚀 Run Authentication Tests"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="border-l-4 border-gray-300 pl-4">
                    <div className="flex items-start space-x-2">
                      <span className={`text-lg ${getStatusColor(result.success)}`}>
                        {getStatusIcon(result.success)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{result.test}</span>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                        <p className={`text-sm ${getStatusColor(result.success)}`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What Each Test Validates:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>API Authentication:</strong> Server-side login API with cookie setting</li>
                  <li><strong>Session Validation:</strong> Server-side session validation with cookie reading</li>
                  <li><strong>Dashboard Access:</strong> Middleware authentication detection</li>
                  <li><strong>Client Session:</strong> Client-side Supabase session synchronization</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 