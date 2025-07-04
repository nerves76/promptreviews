/**
 * Admin User Management Page
 * 
 * This page provides comprehensive user management capabilities for administrators,
 * including user search, deletion with complete data cleanup, and user-account
 * relationship repair functionality.
 */

"use client";

import { useState, useEffect } from 'react';
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import { isAdmin } from "@/utils/admin";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
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
      } catch (error) {
        console.error("Admin access check error:", error);
        router.push("/dashboard");
      }
    };

    checkAdminAccess();
  }, [router]);

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
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
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
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Users</h3>
          <p className="text-3xl font-bold text-slate-blue">-</p>
          <p className="text-sm text-gray-600">Total registered users</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Businesses</h3>
          <p className="text-3xl font-bold text-slate-blue">-</p>
          <p className="text-sm text-gray-600">Total businesses</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Widgets</h3>
          <p className="text-3xl font-bold text-slate-blue">-</p>
          <p className="text-sm text-gray-600">Total widgets created</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/admin/announcements")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage Announcements</h4>
            <p className="text-sm text-gray-600">Create and manage banner notifications</p>
          </button>

          <button
            onClick={() => router.push("/admin/quotes")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage Quotes</h4>
            <p className="text-sm text-gray-600">Create and manage dashboard quotes</p>
          </button>

          <button
            onClick={() => router.push("/admin/feedback")}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Manage Feedback</h4>
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
            <h4 className="font-medium text-gray-900">Email Templates</h4>
            <p className="text-sm text-gray-600">Edit welcome emails, review notifications, and more</p>
          </button>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin User Management</h1>
            <p className="mt-2 text-gray-600">
              Search and manage users with comprehensive data cleanup and repair capabilities
            </p>
          </div>

          {/* Repair Users Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Repair User-Account Relationships</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check and repair broken user-account relationships that cause "Database error granting user" authentication issues.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="repairEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address (optional - leave empty to check all users)
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
                    <span className="text-sm text-gray-700">Check Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="repair"
                      checked={repairMode === 'repair'}
                      onChange={(e) => setRepairMode(e.target.value as 'check' | 'repair')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Check & Repair</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={repairUsers}
                  disabled={isRepairing}
                  className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRepairing ? 'Processing...' : repairMode === 'repair' ? 'Check & Repair' : 'Check Users'}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Repair Results</h2>
              
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
                  <div className="text-sm text-gray-600">Users Checked</div>
                </div>
                <div className="bg-yellow-50 rounded-md p-4">
                  <div className="text-2xl font-bold text-yellow-800">{repairResult.results.broken}</div>
                  <div className="text-sm text-yellow-600">Broken Relationships</div>
                </div>
                <div className="bg-green-50 rounded-md p-4">
                  <div className="text-2xl font-bold text-green-800">{repairResult.results.repaired}</div>
                  <div className="text-sm text-green-600">Repaired</div>
                </div>
              </div>

              {repairResult.results.details.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">User Details</h3>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search User</h2>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
              
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
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(userInfo.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
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
                  Delete User & All Data
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
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
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Results */}
          {deleteResult && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deletion Results</h2>
              
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Cleanup Details</h3>
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
        </div>
      </div>
    </div>
  );
}
