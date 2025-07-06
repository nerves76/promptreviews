'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabaseClient';
import { User } from '@supabase/supabase-js';

export default function AuthDebugPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  const supabase = createClient();

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully');
          await checkAuthState();
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Checking authentication state...');
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check result:', { session, error: sessionError });
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User check result:', { user, error: userError });
      
      // Get cookies
      const cookieString = typeof document !== 'undefined' ? document.cookie : '';
      console.log('Current cookies:', cookieString);
      
      // Set state
      setSession(session);
      setUser(user);
      setCookies(cookieString);
      
      // Debug info
      setDebugInfo({
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        hasUser: !!user,
        userFromDirectCall: user?.id,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        cookieCount: cookieString.split(';').length,
        hasSupabaseCookies: cookieString.includes('sb-'),
        timestamp: new Date().toISOString()
      });
      
      if (sessionError) {
        setError(`Session Error: ${sessionError.message}`);
      } else if (userError) {
        setError(`User Error: ${userError.message}`);
      }
      
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧪 Testing sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nerves76@gmail.com',
        password: 'testpassword' // You'll need to use a real password here
      });
      
      if (error) {
        console.error('Sign in failed:', error);
        setError(`Sign in failed: ${error.message}`);
      } else {
        console.log('✅ Sign in successful:', data);
        await checkAuthState();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👋 Testing sign out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out failed:', error);
        setError(`Sign out failed: ${error.message}`);
      } else {
        console.log('✅ Sign out successful');
        await checkAuthState();
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllCookies = () => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;`;
      });
      checkAuthState();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      {loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
          <p className="text-blue-800">Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {user ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            <p><strong>Email:</strong> {user?.email || 'None'}</p>
            <p><strong>Session:</strong> {session ? '✅ Active' : '❌ None'}</p>
            <p><strong>Email Confirmed:</strong> {user?.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
        
        {/* Debug Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={checkAuthState}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Refresh Auth State
            </button>
            <button
              onClick={testSignIn}
              disabled={loading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Sign In
            </button>
            <button
              onClick={testSignOut}
              disabled={loading}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Test Sign Out
            </button>
            <button
              onClick={clearAllCookies}
              disabled={loading}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Clear All Cookies
            </button>
          </div>
        </div>
        
        {/* Cookies */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
            {cookies ? cookies.split(';').map((cookie, i) => (
              <div key={i} className="mb-1">
                <code>{cookie.trim()}</code>
              </div>
            )) : 'No cookies found'}
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Test Links:</h3>
        <div className="space-y-2">
          <a href="/auth/sign-in" className="text-blue-600 hover:underline block">
            → Sign In Page
          </a>
          <a href="/auth/sign-up" className="text-blue-600 hover:underline block">
            → Sign Up Page
          </a>
          <a href="/dashboard" className="text-blue-600 hover:underline block">
            → Dashboard (protected)
          </a>
          <a href="/api/debug-session" className="text-blue-600 hover:underline block">
            → Debug Session API
          </a>
        </div>
      </div>
    </div>
  );
} 