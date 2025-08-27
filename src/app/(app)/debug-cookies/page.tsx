"use client";

import { useState, useEffect } from "react";

export default function DebugCookies() {
  const [cookies, setCookies] = useState<string>("");
  const [parsedCookies, setParsedCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const allCookies = document.cookie;
      setCookies(allCookies);
      
      // Parse cookies
      const parsed: Record<string, string> = {};
      allCookies.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          parsed[name] = value;
        }
      });
      setParsedCookies(parsed);
    }
  }, []);

  const clearAllCookies = () => {
    if (typeof window !== "undefined") {
      // Get all cookies and clear them
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Refresh the page to show updated state
      window.location.reload();
    }
  };

  const testDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🍪 Cookie Debug Tool</h1>
        
        <div className="grid gap-6">
          {/* Cookie Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookie Status</h2>
            
            <div className="space-y-3">
              <div>
                <strong>Supabase Auth Token:</strong>
                <span className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {Object.keys(parsedCookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token')) ? '✅ Present' : '❌ Missing'}
                </span>
              </div>
              
              <div>
                <strong>Authentication Status:</strong>
                <span className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {Object.keys(parsedCookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token')) ? 
                    '✅ Should be authenticated' : 
                    '❌ Not authenticated'}
                </span>
              </div>
            </div>
          </div>

          {/* All Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">All Cookies</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto">
              {cookies || "No cookies found"}
            </div>
          </div>

          {/* Parsed Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Parsed Cookies</h2>
            <div className="space-y-2">
              {Object.entries(parsedCookies).map(([name, value]) => (
                <div key={name} className="flex">
                  <strong className="w-48">{name}:</strong>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">
                    {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                  </span>
                </div>
              ))}
              {Object.keys(parsedCookies).length === 0 && (
                <p className="text-gray-500">No cookies parsed</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button
                onClick={testDashboard}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🏠 Test Dashboard Access
              </button>
              
              <button
                onClick={clearAllCookies}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🧹 Clear All Cookies
              </button>
              
              <button
                onClick={() => window.location.href = "/auth/sign-in"}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🔑 Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 