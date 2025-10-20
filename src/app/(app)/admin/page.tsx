/**
 * Admin User Management Page
 * 
 * This page provides comprehensive user management capabilities for administrators,
 * including user search, deletion with complete data cleanup, and user-account
 * relationship repair functionality.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { isAdmin } from "@/utils/admin";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/(app)/components/AppLoader";
import Icon from "@/components/Icon";

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface AdminAnalytics {
  totalUsers: number;
  totalAccounts: number;
  totalBusinesses: number;
  totalReviews: number;
  totalPromptPages: number;
  totalWidgets?: number;
  totalGbpLocations?: number;
  totalGbpPosts?: number;
  reviewsThisMonth: number;
  reviewsThisWeek: number;
  newUsersThisMonth: number;
  newAccountsThisMonth: number;
  newBusinessesThisMonth: number;
  accountsActive?: number;
  accountsTrial?: number;
  accountsPaid?: number;
  reviewsByPlatform?: Record<string, number>;
}

interface DeleteResult {
  success: boolean;
  message: string;
  details?: {
    [tableName: string]: {
      deleted: number;
      error?: string;
    };
  };
}

interface RepairResult {
  success: boolean;
  message: string;
  results: {
    checked: number;
    broken: number;
    repaired: number;
    errors: string[];
    details: Array<{
      userId: string;
      email: string;
      broken: boolean;
      repaired: boolean;
      error: string | null;
      issues: string[];
      fixes: string[];
    }>;
  };
}

export default function AdminPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);
  
  // Repair functionality state
  const [repairEmail, setRepairEmail] = useState('');
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [repairMode, setRepairMode] = useState<'check' | 'repair'>('check');

  // Account Cleanup state
  const [showAccountCleanup, setShowAccountCleanup] = useState(false);
  const [cleanupData, setCleanupData] = useState<any | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any | null>(null);
  const [isLoadingCleanup, setIsLoadingCleanup] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error } = await getUserOrMock(supabase);
        
        if (error || !user) {
          router.push("/auth/sign-in");
          return;
        }

        setUser(user);
        
        const adminStatus = await isAdmin(user.id, supabase);
        setIsAdminUser(adminStatus);
        
        if (!adminStatus) {
          router.push("/dashboard");
          return;
        }
        
        setLoading(false);
        loadAnalytics(); // Load analytics after admin check passes
      } catch (error) {
        console.error("Admin access check error:", error);
        router.push("/dashboard");
      }
    };

    checkAdminAccess();
  }, [router]);

  /**
   * Load admin analytics data
   */
  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAnalyticsLoading(false);
        return;
      }

      // Get session only when needed for the token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAnalyticsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to load analytics:', await response.text());
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /**
   * Search for a user by email address
   */
  const searchUser = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setError(null);
    setUserInfo(null);
    setDeleteResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No active session');
        return;
      }

      // Check admin status
      const adminStatus = await isAdmin(user.id, supabase);
      if (!adminStatus) {
        setError('Admin privileges required');
        return;
      }

      // For now, we'll use a simple approach to get user info
      // In a real implementation, you'd want a proper API endpoint
      const userInfo: UserInfo = {
        id: 'temp-id-' + Date.now(),
        email: email,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString()
      };

      setUserInfo(userInfo);
    } catch (error) {
      setError('Error searching for user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  /**
   * Delete user and all associated data
   */
  const deleteUser = async () => {
    if (!userInfo) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userInfo.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setDeleteResult(result);
        setUserInfo(null); // Clear user info after successful deletion
      } else {
        setError(result.error || 'Failed to delete user');
      }

    } catch (error) {
      setError('Error deleting user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  /**
   * Repair user-account relationships
   */
  const repairUsers = async () => {
    if (!repairEmail.trim() && repairMode === 'check') {
      setError('Please enter an email address or select "Check All Users"');
      return;
    }

    setIsRepairing(true);
    setError(null);
    setRepairResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      const response = await fetch('/api/admin/repair-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: repairEmail.trim() || undefined,
          repair: repairMode === 'repair',
          checkAll: repairEmail.trim() === ''
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setRepairResult(result);
      } else {
        setError(result.error || 'Failed to repair users');
      }

    } catch (error) {
      setError('Error repairing users: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRepairing(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Account Cleanup functions
  const checkEligibleAccounts = async () => {
    setIsLoadingCleanup(true);
    setError(null);
    setCleanupData(null);
    setCleanupResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

             const response = await fetch('/api/admin/account-cleanup', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${session.access_token}`,
           'Content-Type': 'application/json',
         },
       });

      const result = await response.json();

      if (response.ok) {
        setCleanupData(result);
      } else {
        setError(result.error || 'Failed to check eligible accounts');
      }

    } catch (error) {
      setError('Error checking eligible accounts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoadingCleanup(false);
    }
  };

  const performCleanup = async (dryRun: boolean) => {
    setIsLoadingCleanup(true);
    setError(null);
    setCleanupResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

             const response = await fetch('/api/admin/account-cleanup', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${session.access_token}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ confirm: !dryRun, dryRun }),
       });

      const result = await response.json();

      if (response.ok) {
        setCleanupResult(result);
      } else {
        setError(result.error || 'Failed to perform cleanup');
      }

    } catch (error) {
      setError('Error performing cleanup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoadingCleanup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 text-lg">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => router.push("/dashboard/help-content")}
          className="ml-auto px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors text-sm font-medium"
        >
          Help Docs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaUsers" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analyticsLoading ? '...' : analytics?.totalUsers || 0}
          </p>
          <p className="text-sm text-gray-600">Total registered users</p>
          {analytics && !analyticsLoading && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.newUsersThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaBuilding" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Accounts</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analyticsLoading ? '...' : analytics?.totalAccounts || 0}
          </p>
          <p className="text-sm text-gray-600">Total accounts</p>
          {analytics && !analyticsLoading && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.newAccountsThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaSentimentAnalyzer" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analyticsLoading ? '...' : analytics?.totalReviews || 0}
          </p>
          <p className="text-sm text-gray-600">Total reviews submitted</p>
          {analytics && !analyticsLoading && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.reviewsThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Prompt Pages</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analyticsLoading ? '...' : analytics?.totalPromptPages || 0}
          </p>
          <p className="text-sm text-gray-600">Total prompt pages created</p>
        </div>
      </div>

      {/* Platform Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaChartLine" className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-medium text-gray-700">Widgets Created</h4>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {analyticsLoading ? '...' : analytics?.totalWidgets?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaGoogle" className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-medium text-gray-700">GBP Locations</h4>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {analyticsLoading ? '...' : analytics?.totalGbpLocations?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Google Business connected</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaGoogle" className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-medium text-gray-700">GBP Posts</h4>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {analyticsLoading ? '...' : analytics?.totalGbpPosts?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Published to Google</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaUsers" className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-medium text-gray-700">Active Accounts</h4>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {analyticsLoading ? '...' : analytics?.accountsActive?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {analytics && !analyticsLoading && (
                <>
                  Trial: {analytics?.accountsTrial || 0} • Paid: {analytics?.accountsPaid || 0}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Platform Distribution */}
        {analytics?.reviewsByPlatform && Object.keys(analytics.reviewsByPlatform).length > 0 && (
          <div className="mt-6 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/40">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Reviews by Platform</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(analytics.reviewsByPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <div key={platform} className="text-center">
                    <p className="text-lg font-bold text-gray-900">{count.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 capitalize">{platform}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/admin/announcements")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage announcements</h4>
            <p className="text-sm text-gray-600">Create and manage banner notifications</p>
          </button>

          <button
            onClick={() => router.push("/admin/quotes")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage quotes</h4>
            <p className="text-sm text-gray-600">Create and manage dashboard quotes</p>
          </button>

          <button
            onClick={() => router.push("/admin/feedback")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage feedback</h4>
            <p className="text-sm text-gray-600">View and manage user feedback</p>
          </button>

          <button
            onClick={() => router.push("/admin/analytics")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Analytics</h4>
            <p className="text-sm text-gray-600">View system-wide analytics</p>
          </button>

          <button
            onClick={() => router.push("/admin/email-templates")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Email templates</h4>
            <p className="text-sm text-gray-600">Edit welcome emails, review notifications, and more</p>
          </button>

          <button
            onClick={() => setShowAccountCleanup(true)}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Account cleanup</h4>
            <p className="text-sm text-gray-600">Manage 90-day retention policy for cancelled accounts</p>
          </button>

          <button
            onClick={() => router.push("/admin/free-accounts")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Free accounts</h4>
            <p className="text-sm text-gray-600">Create and manage free accounts with specific plan levels</p>
          </button>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin user management</h1>
            <p className="mt-2 text-gray-600">
              Search and manage users with comprehensive data cleanup and repair capabilities
            </p>
          </div>

          {/* Repair Users Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Repair user-account relationships</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check and repair broken user-account relationships that cause "Database error granting user" authentication issues.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="repairEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address (optional - leave empty to check all users)
                  </label>
                  <input
                    type="email"
                    id="repairEmail"
                    value={repairEmail}
                    onChange={(e) => setRepairEmail(e.target.value)}
                    placeholder="Enter specific email or leave empty for all users"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="check"
                      checked={repairMode === 'check'}
                      onChange={(e) => setRepairMode(e.target.value as 'check' | 'repair')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Check only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="repair"
                      checked={repairMode === 'repair'}
                      onChange={(e) => setRepairMode(e.target.value as 'check' | 'repair')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Check & repair</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={repairUsers}
                  disabled={isRepairing}
                  className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRepairing ? 'Processing...' : repairMode === 'repair' ? 'Check & repair' : 'Check users'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Repair Results */}
          {repairResult && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Repair results</h2>
              
              <div className={`p-4 rounded-md mb-4 ${
                repairResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  repairResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {repairResult.message}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="text-2xl font-bold text-gray-900">{repairResult.results.checked}</div>
                  <div className="text-sm text-gray-600">Users checked</div>
                </div>
                <div className="bg-yellow-50 rounded-md p-4">
                  <div className="text-2xl font-bold text-yellow-800">{repairResult.results.broken}</div>
                  <div className="text-sm text-yellow-600">Broken relationships</div>
                </div>
                <div className="bg-green-50 rounded-md p-4">
                  <div className="text-2xl font-bold text-green-800">{repairResult.results.repaired}</div>
                  <div className="text-sm text-green-600">Repaired</div>
                </div>
              </div>

              {repairResult.results.details.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">User details</h3>
                  <div className="space-y-3">
                    {repairResult.results.details.map((detail, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{detail.email}</p>
                            <p className="text-sm text-gray-500 font-mono">{detail.userId}</p>
                          </div>
                          <div className="flex gap-2">
                            {detail.broken && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Broken
                              </span>
                            )}
                            {detail.repaired && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Repaired
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {detail.issues.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-red-700 mb-1">Issues Found:</p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {detail.issues.map((issue, i) => (
                                <li key={i}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {detail.fixes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-1">Fixes Applied:</p>
                            <ul className="text-sm text-green-600 space-y-1">
                              {detail.fixes.map((fix, i) => (
                                <li key={i}>• {fix}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {detail.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">{detail.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search user</h2>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter user email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                  onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={searchUser}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* User Information */}
          {userInfo && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{userInfo.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created at</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(userInfo.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last sign in</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userInfo.last_sign_in_at ? formatDate(userInfo.last_sign_in_at) : 'Never'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete user & all data
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm deletion</h3>
                <p className="text-gray-600 mb-6">
                  This action will permanently delete the user <strong>{userInfo?.email}</strong> and ALL associated data including:
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-1">
                  <li>• User account and authentication</li>
                  <li>• All widgets and prompt pages</li>
                  <li>• Business profiles and contacts</li>
                  <li>• Review submissions and analytics</li>
                  <li>• AI usage records</li>
                  <li>• All related database records</li>
                </ul>
                <p className="text-red-600 font-semibold mb-6">
                  This action cannot be undone!
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteUser}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete permanently'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Results */}
          {deleteResult && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deletion results</h2>
              
              <div className={`p-4 rounded-md mb-4 ${
                deleteResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  deleteResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {deleteResult.message}
                </p>
              </div>

              {deleteResult.details && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Cleanup details</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(deleteResult.details).map(([table, result]) => (
                        <div key={table} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {table.replace('_', ' ')}:
                          </span>
                          <span className={`text-sm ${
                            result.error ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {result.error ? 'Error' : 'Cleaned'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Cleanup Modal */}
          {showAccountCleanup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Account cleanup - 90 day retention</h2>
                    <button
                      onClick={() => {
                        setShowAccountCleanup(false);
                        setCleanupData(null);
                        setCleanupResult(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Retention policy</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Accounts that have been cancelled for more than 90 days can be permanently deleted. 
                      This removes all user data, businesses, widgets, and associated records.
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Permanent deletion warning
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>This action cannot be undone. All data will be permanently removed.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={checkEligibleAccounts}
                        disabled={isLoadingCleanup}
                        className="bg-slate-blue hover:bg-slate-blue/90 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {isLoadingCleanup ? 'Checking...' : 'Check eligible accounts'}
                      </button>
                      
                      {cleanupData && cleanupData.count > 0 && (
                        <>
                          <button
                            onClick={() => performCleanup(true)}
                            disabled={isLoadingCleanup}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {isLoadingCleanup ? 'Previewing...' : 'Preview deletion'}
                          </button>
                          
                          <button
                            onClick={() => performCleanup(false)}
                            disabled={isLoadingCleanup}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {isLoadingCleanup ? 'Deleting...' : 'Delete permanently'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Results Display */}
                  {cleanupData && (
                    <div className="mb-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Accounts Eligible for Deletion: {cleanupData.count}
                        </h4>
                        
                        {cleanupData.count === 0 ? (
                          <p className="text-sm text-gray-600">No accounts are currently eligible for permanent deletion.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-3">
                              The following accounts have been cancelled for more than 90 days:
                            </p>
                            
                            <div className="max-h-60 overflow-y-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Email</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Deleted</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Days Ago</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Businesses</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Users</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {cleanupData.accounts.map((account: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-900">{account.email}</td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {new Date(account.deleted_at).toLocaleDateString()}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">{account.days_since_deletion}</td>
                                      <td className="px-3 py-2 text-gray-600">{account.business_count}</td>
                                      <td className="px-3 py-2 text-gray-600">{account.user_count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cleanup Results */}
                  {cleanupResult && (
                    <div className="mb-6">
                      <div className={`border rounded-lg p-4 ${
                        cleanupResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <h4 className={`font-medium mb-2 ${
                          cleanupResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {cleanupResult.dryRun ? 'Preview results' : 'Deletion results'}
                        </h4>
                        
                        <p className={`text-sm mb-3 ${
                          cleanupResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {cleanupResult.message}
                        </p>

                        {cleanupResult.results && cleanupResult.results.length > 0 && (
                          <div className="max-h-40 overflow-y-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="px-3 py-1 text-left font-medium">Email</th>
                                  <th className="px-3 py-1 text-left font-medium">Status</th>
                                  <th className="px-3 py-1 text-left font-medium">Message</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {cleanupResult.results.map((result: any, index: number) => (
                                  <tr key={index}>
                                    <td className="px-3 py-1">{result.email}</td>
                                    <td className="px-3 py-1">
                                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                        result.success 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {result.success ? 'Success' : 'Error'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1 text-gray-600">{result.message}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
