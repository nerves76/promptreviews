/**
 * Simple Google OAuth Test Page
 * Tests the OAuth flow without making API calls to avoid rate limiting
 */

'use client';

import { useState, useEffect } from 'react';

export default function SimpleGoogleOAuthTest() {
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

  const testEnvironmentVariables = async () => {
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      
      if (data.success) {
        addTestResult('Environment Variables', true, 'All environment variables are set', data.envVars);
        return true;
      } else {
        addTestResult('Environment Variables', false, data.message, data.envVars);
        return false;
      }
    } catch (error) {
      addTestResult('Environment Variables', false, `Failed to check environment variables: ${error}`);
      return false;
    }
  };

  const testOAuthUrlGeneration = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '');
      const scope = encodeURIComponent('https://www.googleapis.com/auth/plus.business.manage openid email profile');
      const responseType = 'code';
      const state = encodeURIComponent(JSON.stringify({ 
        platform: 'google-business-profile',
        returnUrl: '/test-google-oauth-simple'
      }));

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;

      addTestResult('OAuth URL Generation', true, 'OAuth URL generated successfully', { url: googleAuthUrl });
      return true;
    } catch (error) {
      addTestResult('OAuth URL Generation', false, `Failed to generate OAuth URL: ${error}`);
      return false;
    }
  };

  const testOAuthCallback = async () => {
    try {
      const response = await fetch('/api/auth/google/callback?test=true');
      const success = response.ok;
      const message = success ? 'OAuth callback responds (200)' : `OAuth callback failed (${response.status})`;
      
      addTestResult('OAuth Callback', success, message);
      return success;
    } catch (error) {
      addTestResult('OAuth Callback', false, `OAuth callback error: ${error}`);
      return false;
    }
  };

  const testSocialPostingPlatforms = async () => {
    try {
      const response = await fetch('/api/social-posting/platforms');
      const success = response.ok;
      const message = success ? 'Social Posting Platforms responds (200)' : `Social Posting Platforms failed (${response.status})`;
      
      addTestResult('Social Posting Platforms', success, message);
      return success;
    } catch (error) {
      addTestResult('Social Posting Platforms', false, `Social Posting Platforms error: ${error}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setStatus('Running tests...');
    setError('');
    setTestResults([]);

    try {
      // Test 1: Environment Variables (server-side check)
      const envOk = await testEnvironmentVariables();
      if (!envOk) {
        setError('Environment variables are missing');
        setStatus('Tests completed with errors');
        return;
      }

      // Test 2: OAuth URL Generation
      testOAuthUrlGeneration();

      // Test 3: OAuth Callback (without actual OAuth)
      await testOAuthCallback();

      // Test 4: Social Posting Platforms API
      await testSocialPostingPlatforms();

      setStatus('All tests completed!');
    } catch (error) {
      setError(`Test error: ${error}`);
      setStatus('Tests failed');
    }
  };

  useEffect(() => {
    // Check for OAuth callback parameters on client side
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (code) {
      addTestResult('OAuth Callback Received', true, 'OAuth code received successfully', { code: code.substring(0, 20) + '...' });
    } else if (error) {
      addTestResult('OAuth Callback Error', false, `OAuth error: ${error}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Simple Google OAuth Test
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This test page verifies the Google OAuth configuration without making API calls to avoid rate limiting.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Test URLs:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Real OAuth Test:</strong> <a href="/test-google-oauth" className="underline">/test-google-oauth</a></li>
                <li>• <strong>Mock Test:</strong> <a href="/test-google-oauth-mock" className="underline">/test-google-oauth-mock</a></li>
                <li>• <strong>Bypass API:</strong> <a href="/api/test-google-oauth-bypass" className="underline">/api/test-google-oauth-bypass</a></li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={runAllTests}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Run All Tests
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Status</h2>
            <p className="text-gray-700">{status}</p>
            {error && (
              <p className="text-red-600 mt-2">{error}</p>
            )}
          </div>

          {testResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{result.test}</h3>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        result.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{result.message}</p>
                    {result.data && (
                      <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 