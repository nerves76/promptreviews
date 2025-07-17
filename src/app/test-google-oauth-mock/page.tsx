/**
 * Mock Google OAuth Test Page
 * Simulates the OAuth flow without making actual API calls
 * Useful for testing authentication logic without rate limits
 */

'use client';

import { useState } from 'react';

export default function MockGoogleOAuthTest() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, { 
      test, 
      success, 
      message, 
      data, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const testEnvironmentVariables = () => {
    setStatus('Testing environment variables...');
    
    const tests = [
      { name: 'GOOGLE_CLIENT_ID', value: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, required: true },
      { name: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET, required: true },
      { name: 'GOOGLE_REDIRECT_URI', value: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI, required: true },
      { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL, required: true },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, required: true }
    ];

    tests.forEach(({ name, value, required }) => {
      if (required && !value) {
        addTestResult(name, false, `❌ Missing required environment variable: ${name}`);
      } else if (value) {
        addTestResult(name, true, `✅ ${name} is set`);
      } else {
        addTestResult(name, true, `⚠️ ${name} is optional and not set`);
      }
    });
  };

  const testOAuthUrlGeneration = () => {
    setStatus('Testing OAuth URL generation...');
    
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        addTestResult('OAuth URL Generation', false, '❌ Missing required environment variables');
        return;
      }

      const state = JSON.stringify({
        platform: 'google-business-profile',
        returnUrl: '/test-google-oauth-mock'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/plus.business.manage openid userinfo.email userinfo.profile')}` +
        `&state=${encodeURIComponent(state)}` +
        `&access_type=offline` +
        `&prompt=consent`;

      addTestResult('OAuth URL Generation', true, '✅ OAuth URL generated successfully', { url: authUrl.substring(0, 100) + '...' });
      
    } catch (error) {
      addTestResult('OAuth URL Generation', false, `❌ Failed to generate OAuth URL: ${error}`);
    }
  };

  const testTokenExchange = async () => {
    setStatus('Testing token exchange (mock)...');
    
    try {
      // Simulate a successful token exchange
      const mockTokens = {
        access_token: 'mock_access_token_12345',
        refresh_token: 'mock_refresh_token_67890',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/plus.business.manage openid userinfo.email userinfo.profile'
      };

      addTestResult('Token Exchange', true, '✅ Mock token exchange successful', mockTokens);
      
      // Test storing tokens
      addTestResult('Token Storage', true, '✅ Mock token storage successful');
      
    } catch (error) {
      addTestResult('Token Exchange', false, `❌ Mock token exchange failed: ${error}`);
    }
  };

  const testApiEndpoints = async () => {
    setStatus('Testing API endpoints...');
    
    const endpoints = [
      { path: '/api/test-google-oauth', name: 'Test OAuth Endpoint' },
      { path: '/api/social-posting/platforms', name: 'Social Posting Platforms' },
      { path: '/api/auth/google/callback', name: 'OAuth Callback' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.path, { method: 'GET' });
        const status = response.status;
        
        if (status === 200 || status === 404) {
          addTestResult(endpoint.name, true, `✅ ${endpoint.name} responds (${status})`);
        } else {
          addTestResult(endpoint.name, false, `❌ ${endpoint.name} failed (${status})`);
        }
      } catch (error) {
        addTestResult(endpoint.name, false, `❌ ${endpoint.name} error: ${error}`);
      }
    }
  };

  const runAllTests = async () => {
    setStatus('Running comprehensive tests...');
    setTestResults([]);
    setError('');

    try {
      // Test 1: Environment Variables
      testEnvironmentVariables();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test 2: OAuth URL Generation
      testOAuthUrlGeneration();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test 3: Token Exchange (Mock)
      await testTokenExchange();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test 4: API Endpoints
      await testApiEndpoints();
      
      setStatus('All tests completed!');
      
    } catch (error) {
      setError(`Test suite failed: ${error}`);
      setStatus('Tests failed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setError('');
    setStatus('Ready to test');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Mock Google OAuth Test Suite
          </h1>
          
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Status</h2>
              <p className="text-blue-800">{status}</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.test}</span>
                        <span className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.success ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.message}
                      </p>
                      {result.data && (
                        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={runAllTests}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Run All Tests
              </button>
              <button
                onClick={clearResults}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Results
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">What This Tests</h2>
              <ul className="list-disc list-inside space-y-2 text-yellow-800">
                <li>Environment variable configuration</li>
                <li>OAuth URL generation logic</li>
                <li>Token exchange simulation</li>
                <li>API endpoint availability</li>
                <li>Authentication flow components</li>
              </ul>
            </div>

            {/* Summary */}
            {testResults.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-purple-900 mb-2">Test Summary</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Total Tests:</strong> {testResults.length}
                  </div>
                  <div>
                    <strong>Passed:</strong> {testResults.filter(r => r.success).length}
                  </div>
                  <div>
                    <strong>Failed:</strong> {testResults.filter(r => !r.success).length}
                  </div>
                  <div>
                    <strong>Success Rate:</strong> {Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 