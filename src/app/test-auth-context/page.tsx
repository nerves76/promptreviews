"use client";

import { useAuth, useAuthGuard, useAdminGuard, useBusinessGuard } from '@/contexts/AuthContext';

export default function TestAuthContext() {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    isAdminUser,
    adminLoading,
    accountId,
    hasBusiness,
    businessLoading,
    sessionExpiry,
    sessionTimeRemaining,
    signIn,
    signOut,
    refreshAuth,
    refreshAdminStatus,
    refreshBusinessProfile,
    clearError,
    isSessionExpiringSoon,
  } = useAuth();

  // Test auth guard hook
  const { isAuthenticated: guardAuth, isLoading: guardLoading } = useAuthGuard();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Auth Context Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Core Authentication</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {isLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span className={isInitialized ? 'text-green-600' : 'text-red-600'}>
                  {isInitialized ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="text-gray-600 text-xs">{user?.id || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-gray-600">{user?.email || 'None'}</span>
              </div>
              {error && (
                <div className="flex justify-between">
                  <span>Error:</span>
                  <span className="text-red-600 text-xs">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Is Admin:</span>
                <span className={isAdminUser ? 'text-green-600' : 'text-gray-600'}>
                  {isAdminUser ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Admin Loading:</span>
                <span className={adminLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {adminLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <button
                onClick={() => refreshAdminStatus()}
                className="w-full mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Refresh Admin Status
              </button>
            </div>
          </div>

          {/* Business Profile */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Business Profile</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Has Business:</span>
                <span className={hasBusiness ? 'text-green-600' : 'text-gray-600'}>
                  {hasBusiness ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="text-gray-600 text-xs">{accountId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Business Loading:</span>
                <span className={businessLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {businessLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <button
                onClick={() => refreshBusinessProfile()}
                className="w-full mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Refresh Business Profile
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">Session Management</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Session Expiry:</span>
                <span className="text-gray-600 text-xs">
                  {sessionExpiry ? sessionExpiry.toLocaleString() : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="text-gray-600">
                  {sessionTimeRemaining ? `${Math.floor(sessionTimeRemaining / 1000 / 60)} min` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expiring Soon:</span>
                <span className={isSessionExpiringSoon() ? 'text-yellow-600' : 'text-green-600'}>
                  {isSessionExpiringSoon() ? '⚠️ Yes' : '✅ No'}
                </span>
              </div>
              <button
                onClick={() => refreshAuth()}
                className="w-full mt-2 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Refresh Session
              </button>
            </div>
          </div>

          {/* Auth Guard Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Auth Guard</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Guard Auth:</span>
                <span className={guardAuth ? 'text-green-600' : 'text-red-600'}>
                  {guardAuth ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Guard Loading:</span>
                <span className={guardLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {guardLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This hook automatically redirects unauthenticated users to sign-in.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Actions</h2>
            <div className="space-y-2">
              {error && (
                <button
                  onClick={clearError}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Clear Error
                </button>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => signOut()}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => signIn('test@example.com', 'password')}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Test Sign In (will fail)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">Performance & Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="text-gray-600">Single Auth Context</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-gray-600">Cached Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-gray-600">No Re-render Loops</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            This centralized auth context eliminates multiple competing auth systems, 
            reduces database calls through intelligent caching, and prevents the 
            re-rendering loops that were causing performance issues.
          </p>
        </div>
      </div>
    </div>
  );
} 