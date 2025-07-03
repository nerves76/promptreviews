"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function DebugReset() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const gatherDebugInfo = async () => {
      // Get current URL and all parameters
      const url = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Convert URLSearchParams to objects for display
      const searchParams: { [key: string]: string } = {};
      const hashParamsObj: { [key: string]: string } = {};
      
      urlParams.forEach((value, key) => {
        searchParams[key] = value;
      });
      
      hashParams.forEach((value, key) => {
        hashParamsObj[key] = value;
      });
      
      // Check current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setSession(currentSession);
      setDebugInfo({
        currentUrl: url,
        searchParams,
        hashParams: hashParamsObj,
        hasSession: !!currentSession,
        sessionUser: currentSession?.user?.email || null,
        sessionError: error?.message || null,
        userError: userError?.message || null,
        supabaseConfig: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        timestamp: new Date().toISOString(),
      });
    };
    
    gatherDebugInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Supabase Password Reset Debug Tool
          </h1>
          
          <div className="grid gap-6">
            {/* URL Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">URL Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Full URL:</strong>
                  <code className="block bg-white p-2 rounded mt-1 break-all">
                    {debugInfo.currentUrl}
                  </code>
                </div>
                
                <div>
                  <strong>Search Parameters (?param=value):</strong>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
                    {JSON.stringify(debugInfo.searchParams, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <strong>Hash Parameters (#param=value):</strong>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
                    {JSON.stringify(debugInfo.hashParams, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Session Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-3">Session Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Has Active Session:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    debugInfo.hasSession 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {debugInfo.hasSession ? 'YES' : 'NO'}
                  </span>
                </div>
                
                {debugInfo.sessionUser && (
                  <div>
                    <strong>Session User Email:</strong>
                    <code className="ml-2 bg-white px-2 py-1 rounded">
                      {debugInfo.sessionUser}
                    </code>
                  </div>
                )}
                
                {debugInfo.sessionError && (
                  <div>
                    <strong>Session Error:</strong>
                    <code className="ml-2 bg-red-100 px-2 py-1 rounded text-red-700">
                      {debugInfo.sessionError}
                    </code>
                  </div>
                )}
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Full Session Object</summary>
                  <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto max-h-64">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">Configuration</h2>
              <pre className="bg-white p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.supabaseConfig, null, 2)}
              </pre>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Use This Debug Tool</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Request a password reset from your sign-in page</li>
                <li>Check your email (or Inbucket at localhost:54324)</li>
                <li>Click the reset link in the email</li>
                <li>If it doesn't redirect here automatically, manually change the URL from <code>/reset-password</code> to <code>/debug-reset</code></li>
                <li>Analyze the parameters and session information above</li>
                <li>Use this information to determine the correct implementation approach</li>
              </ol>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <a 
                href="/auth/sign-in" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Sign In
              </a>
              <a 
                href="/reset-password" 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Reset Password
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Debug Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}