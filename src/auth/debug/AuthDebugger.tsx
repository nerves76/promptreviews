/**
 * Authentication Debugger Component
 * Displays real-time auth state and helps diagnose issues
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { createClient } from '../providers/supabase';

export function AuthDebugger() {
  const auth = useAuth();
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [localStorage, setLocalStorage] = useState<Record<string, any>>({});
  const [cookies, setCookies] = useState<string>('');
  const [healthCheck, setHealthCheck] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Get Supabase session directly
  useEffect(() => {
    const checkSupabase = async () => {
      const client = createClient();
      const { data: { session } } = await client.auth.getSession();
      setSupabaseSession(session);
    };
    checkSupabase();
    const interval = setInterval(checkSupabase, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get localStorage data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('promptreviews') || key.includes('auth'))) {
          try {
            const value = window.localStorage.getItem(key);
            data[key] = value ? JSON.parse(value) : null;
          } catch {
            data[key] = window.localStorage.getItem(key);
          }
        }
      }
      setLocalStorage(data);
    }
  }, [auth]);

  // Get cookies
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setCookies(document.cookie);
    }
  }, [auth]);

  // Run health check
  useEffect(() => {
    const runHealthCheck = async () => {
      const checks = {
        timestamp: new Date().toISOString(),
        issues: [] as string[],
        warnings: [] as string[]
      };

      // Check for timing issues
      if (auth.isLoading && auth.isInitialized) {
        checks.issues.push('Loading stuck while initialized');
      }
      
      if (auth.adminLoading && auth.user) {
        checks.warnings.push('Admin check still loading');
      }
      
      if (auth.businessLoading && auth.user) {
        checks.warnings.push('Business check still loading');
      }
      
      if (auth.accountLoading && auth.user) {
        checks.warnings.push('Account check still loading');
      }

      // Check for state mismatches
      if (auth.user && !auth.isAuthenticated) {
        checks.issues.push('User exists but not authenticated');
      }
      
      if (!auth.user && auth.isAuthenticated) {
        checks.issues.push('Authenticated but no user');
      }
      
      if (auth.accountId && !auth.account) {
        checks.warnings.push('Account ID exists but no account data');
      }
      
      if (auth.hasBusiness && !auth.accountId) {
        checks.issues.push('Has business but no account ID');
      }

      // Check session vs auth mismatch
      if (supabaseSession && !auth.session) {
        checks.issues.push('Supabase has session but AuthContext does not');
      }
      
      if (!supabaseSession && auth.session) {
        checks.issues.push('AuthContext has session but Supabase does not');
      }

      // Check for expired session
      if (auth.sessionExpiry) {
        const now = new Date();
        if (auth.sessionExpiry < now) {
          checks.issues.push('Session expired');
        }
      }

      setHealthCheck(checks);
    };

    runHealthCheck();
    const interval = setInterval(runHealthCheck, 2000);
    return () => clearInterval(interval);
  }, [auth, supabaseSession]);

  const getStatusColor = (loading: boolean, value: any) => {
    if (loading) return 'text-yellow-500';
    if (value === null || value === false) return 'text-gray-400';
    if (value === true || value) return 'text-green-500';
    return 'text-gray-400';
  };

  const getLoadingIndicator = (loading: boolean) => {
    return loading ? '⏳' : '✓';
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 flex items-center gap-2"
        >
          🔍 Auth Debug
          {healthCheck.issues?.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {healthCheck.issues.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-2xl max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">🔍 Auth Debugger</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Health Status */}
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <div className="text-sm font-mono">
          {healthCheck.issues?.length > 0 ? (
            <div className="text-red-400">
              <div className="font-bold mb-1">⚠️ Issues Detected:</div>
              {healthCheck.issues.map((issue: string, i: number) => (
                <div key={i}>• {issue}</div>
              ))}
            </div>
          ) : (
            <div className="text-green-400">✅ No critical issues</div>
          )}
          {healthCheck.warnings?.length > 0 && (
            <div className="text-yellow-400 mt-2">
              <div className="font-bold mb-1">⚡ Warnings:</div>
              {healthCheck.warnings.map((warning: string, i: number) => (
                <div key={i}>• {warning}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Core Auth State */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-400">Core State</h4>
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>isInitialized:</span>
            <span className={getStatusColor(false, auth.isInitialized)}>
              {String(auth.isInitialized)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>isLoading:</span>
            <span className={getStatusColor(auth.isLoading, !auth.isLoading)}>
              {String(auth.isLoading)} {getLoadingIndicator(!auth.isLoading)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>isAuthenticated:</span>
            <span className={getStatusColor(false, auth.isAuthenticated)}>
              {String(auth.isAuthenticated)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>user:</span>
            <span className={getStatusColor(false, auth.user)}>
              {auth.user ? auth.user.email : 'null'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>session:</span>
            <span className={getStatusColor(false, auth.session)}>
              {auth.session ? 'active' : 'null'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading States */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-400">Loading States</h4>
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>adminLoading:</span>
            <span className={getStatusColor(auth.adminLoading, !auth.adminLoading)}>
              {String(auth.adminLoading)} {getLoadingIndicator(!auth.adminLoading)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>businessLoading:</span>
            <span className={getStatusColor(auth.businessLoading, !auth.businessLoading)}>
              {String(auth.businessLoading)} {getLoadingIndicator(!auth.businessLoading)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>accountLoading:</span>
            <span className={getStatusColor(auth.accountLoading, !auth.accountLoading)}>
              {String(auth.accountLoading)} {getLoadingIndicator(!auth.accountLoading)}
            </span>
          </div>
        </div>
      </div>

      {/* Business & Account State */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-400">Business & Account</h4>
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>isAdminUser:</span>
            <span className={getStatusColor(false, auth.isAdminUser)}>
              {String(auth.isAdminUser)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>hasBusiness:</span>
            <span className={getStatusColor(false, auth.hasBusiness)}>
              {String(auth.hasBusiness)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>accountId:</span>
            <span className={getStatusColor(false, auth.accountId)}>
              {auth.accountId ? auth.accountId.substring(0, 8) + '...' : 'null'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>account plan:</span>
            <span className={getStatusColor(false, auth.account?.plan)}>
              {auth.account?.plan || 'null'}
            </span>
          </div>
        </div>
      </div>

      {/* Session Timing */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-400">Session Timing</h4>
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>sessionExpiry:</span>
            <span className={auth.sessionExpiry ? 'text-green-500' : 'text-gray-400'}>
              {auth.sessionExpiry ? new Date(auth.sessionExpiry).toLocaleTimeString() : 'null'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>timeRemaining:</span>
            <span className={auth.sessionTimeRemaining > 300 ? 'text-green-500' : 'text-yellow-500'}>
              {Math.floor(auth.sessionTimeRemaining / 60)}m {auth.sessionTimeRemaining % 60}s
            </span>
          </div>
          <div className="flex justify-between">
            <span>isExpiringSoon:</span>
            <span className={auth.isSessionExpiringSoon ? 'text-yellow-500' : 'text-green-500'}>
              {String(auth.isSessionExpiringSoon)}
            </span>
          </div>
        </div>
      </div>

      {/* Supabase Direct Check */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-400">Supabase Direct</h4>
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span>session:</span>
            <span className={supabaseSession ? 'text-green-500' : 'text-red-500'}>
              {supabaseSession ? 'active' : 'null'}
            </span>
          </div>
          {supabaseSession && (
            <>
              <div className="flex justify-between">
                <span>user.id:</span>
                <span className="text-gray-300">
                  {supabaseSession.user?.id?.substring(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>expires_at:</span>
                <span className="text-gray-300">
                  {new Date(supabaseSession.expires_at * 1000).toLocaleTimeString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={async () => {
            await auth.refreshAuth();
            alert('Auth refreshed');
          }}
          className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs"
        >
          Refresh Auth
        </button>
        <button
          onClick={async () => {
            await auth.refreshBusinessProfile();
            alert('Business profile refreshed');
          }}
          className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs"
        >
          Refresh Business
        </button>
        <button
          onClick={async () => {
            await auth.refreshAccountDetails();
            alert('Account details refreshed');
          }}
          className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs"
        >
          Refresh Account
        </button>
        <button
          onClick={() => {
            console.log('Full Auth State:', auth);
            console.log('Supabase Session:', supabaseSession);
            console.log('LocalStorage:', localStorage);
            alert('Check console for full debug output');
          }}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
        >
          Log to Console
        </button>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.clear();
              window.location.reload();
            }
          }}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs"
        >
          Clear & Reload
        </button>
      </div>
    </div>
  );
}