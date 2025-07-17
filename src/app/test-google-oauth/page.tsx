/**
 * Test page for Google OAuth integration
 * This page allows testing the OAuth flow without authentication issues
 * Updated to use correct Google Business Profile API scopes
 */

'use client';

import { useState, useEffect } from 'react';

export default function TestGoogleOAuth() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');
  const [oauthResult, setOauthResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Check for OAuth callback parameters on client side
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (code) {
      setStatus(`OAuth code received: ${code.substring(0, 20)}...`);
      setOauthResult({ code, state });
      
      // Test the token exchange
      testTokenExchange(code);
    } else if (error) {
      setError(`OAuth error: ${error}`);
    }
  }, []);

  const testTokenExchange = async (code: string) => {
    setStatus('Testing token exchange...');
    
    try {
      const response = await fetch(`/api/test-google-oauth?code=${encodeURIComponent(code)}`);
      const result = await response.json();
      
      setTestResult(result);
      
      if (result.success) {
        setStatus('OAuth test completed successfully!');
      } else {
        setError(`Token exchange failed: ${result.error}`);
        setStatus('OAuth test failed');
      }
    } catch (err) {
      setError(`API call failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('OAuth test failed');
    }
  };

  const testGoogleOAuth = async () => {
    setStatus('Testing Google OAuth...');
    setError('');
    setTestResult(null);

    try {
      // Test the OAuth URL generation
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        setError('Missing environment variables: GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI');
        return;
      }

      const state = JSON.stringify({
        platform: 'google-business-profile',
        returnUrl: '/test-google-oauth'
      });

      // Updated to use correct Google Business Profile scopes
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/plus.business.manage openid userinfo.email userinfo.profile')}` +
        `&state=${encodeURIComponent(state)}` +
        `&access_type=offline` +
        `&prompt=consent`;

      setStatus('Redirecting to Google OAuth...');
      window.location.href = authUrl;

    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('Test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Google OAuth Test Page
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

            {/* OAuth Result */}
            {oauthResult && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-green-900 mb-2">OAuth Result</h2>
                <pre className="text-sm text-green-800 overflow-auto">
                  {JSON.stringify(oauthResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Test Result */}
            {testResult && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-purple-900 mb-2">Test Result</h2>
                <pre className="text-sm text-purple-800 overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Test Button */}
            <div className="flex justify-center">
              <button
                onClick={testGoogleOAuth}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Google OAuth Flow
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click "Test Google OAuth Flow" to start the OAuth process</li>
                <li>You'll be redirected to Google's consent screen</li>
                <li>Grant permissions to your Google Business Profile</li>
                <li>You'll be redirected back to this page with a code</li>
                <li>The page will automatically test the token exchange</li>
                <li>Check the results below for success or errors</li>
              </ol>
            </div>

            {/* Environment Variables Check */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">Environment Check</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>GOOGLE_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
                </div>
                <div>
                  <strong>GOOGLE_REDIRECT_URI:</strong> {process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Missing'}
                </div>
                <div>
                  <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 