"use client";

import { useState, useEffect } from "react";

export default function AuthTest() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Starting up...");

  useEffect(() => {
    console.log("🚀 AuthTest component mounted");
    setMessage("Component mounted, checking auth...");
    
    // Add a small delay to ensure we can see the loading state change
    setTimeout(() => {
      checkAuth();
    }, 500);
  }, []);

  const checkAuth = async () => {
    console.log("🔍 Starting auth check...");
    setMessage("Importing Supabase client...");
    
    try {
      // Dynamic import to avoid any potential SSR issues
      const { supabase } = await import("@/utils/supabaseClient");
      console.log("📱 Supabase client imported successfully");
      setMessage("Supabase client loaded, checking session...");
      
      if (!supabase) {
        throw new Error("Supabase client not available after import");
      }
      
      console.log("🔍 Calling getSession...");
      const result = await supabase.auth.getSession();
      console.log("📦 getSession result:", result);
      
      const { data: { session }, error } = result;
      
      if (error) {
        console.error("❌ Session error:", error);
        setMessage(`Session error: ${error.message}`);
      } else {
        console.log("✅ Session check complete:", session ? "Active" : "None");
        setMessage(session ? "Session found!" : "No active session");
      }
      
      setSession(session);
      setUser(session?.user || null);
    } catch (err) {
      console.error("💥 Auth check exception:", err);
      setMessage(`Auth check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      console.log("🏁 Auth check complete, setting loading to false");
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!testEmail || !password) {
      setMessage("Please enter both email and password");
      return;
    }

    try {
      setMessage("Attempting sign in...");
      
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: password,
      });

      if (error) {
        setMessage(`Sign in error: ${error.message}`);
        return;
      }

      if (data.user && data.session) {
        setMessage("Sign in successful!");
        setUser(data.user);
        setSession(data.session);
        
        // Session is now handled automatically by Supabase
      }
    } catch (err) {
      setMessage(`Exception: ${err}`);
    }
  };

  const testSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setMessage("Signed out successfully");
      
      // Session cleanup is now handled automatically by Supabase
    } catch (err) {
      setMessage(`Sign out error: ${err}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading auth test...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Current State</h2>
            <p><strong>User:</strong> {user ? user.email : "Not signed in"}</p>
            <p><strong>Session:</strong> {session ? "Active" : "None"}</p>
            {session && (
              <p><strong>Expires:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Test Sign In</h2>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <label className="w-20">Email:</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="border p-2 rounded flex-1"
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="w-20">Password:</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-2 rounded flex-1"
                />
              </div>
              <button
                onClick={testSignIn}
                disabled={!testEmail || !password}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={testSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button
              onClick={checkAuth}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
            >
              Refresh Auth State
            </button>
          </div>

          {message && (
            <div className="p-4 bg-gray-100 rounded">
              <strong>Message:</strong> {message}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold">Session Details</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ user, session }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 