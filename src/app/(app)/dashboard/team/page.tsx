/**
 * Team Management Page
 * 
 * This page allows account owners to manage team members and invitations.
 * It combines member management and invitation system in one interface.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon, UserIcon, EnvelopeIcon, ClockIcon, QuestionMarkCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/auth';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
// Page-level loading uses the global overlay
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import { apiClient } from '@/utils/apiClient';

interface TeamMember {
  user_id: string;
  role: 'owner' | 'member' | 'support';
  email: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  created_at: string;
  is_current_user: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'member' | 'support';
  created_at: string;
  expires_at: string;
  invited_by: string;
  is_expired: boolean;
}

interface Account {
  id: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  plan: string;
  max_users: number;
  current_users: number;
  can_add_more: boolean;
}

interface TeamData {
  members: TeamMember[];
  invitations: Invitation[];
  account: Account;
  current_user_role: 'owner' | 'member';
}

export default function TeamPage() {
  const router = useRouter();
  const { user, isAdminUser, isLoading: authLoading } = useAuth();
  const { selectedAccountId } = useAccountData();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const loader = useGlobalLoader();
  // Storage keys for form data persistence
  const inviteFormStorageKey = 'teamInviteForm';
  const bulkInviteStorageKey = 'teamBulkInviteForm';
  
  const [inviteEmail, setInviteEmail] = useState(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(inviteFormStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.email || '';
        } catch (e) {
          console.error('Failed to parse saved invite form data:', e);
        }
      }
    }
    return '';
  });
  
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(inviteFormStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.role || 'member';
        } catch (e) {
          // Ignore
        }
      }
    }
    return 'member';
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showRoleTooltip, setShowRoleTooltip] = useState(false);
  const [addingChris, setAddingChris] = useState(false);
  
  // State for bulk invitations
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [bulkEmails, setBulkEmails] = useState(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(bulkInviteStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.emails || '';
        } catch (e) {
          console.error('Failed to parse saved bulk invite form data:', e);
        }
      }
    }
    return '';
  });
  const [bulkRole, setBulkRole] = useState<'member' | 'owner'>('member');
  const [bulkInviting, setBulkInviting] = useState(false);
  
  // Prevent multiple simultaneous calls
  const fetchingRef = useRef(false);
  
  // Auto-save invite form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && (inviteEmail || inviteRole !== 'member')) {
        localStorage.setItem(inviteFormStorageKey, JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }));
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [inviteEmail, inviteRole, inviteFormStorageKey]);
  
  // Auto-save bulk invite form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && (bulkEmails || bulkRole !== 'member')) {
        localStorage.setItem(bulkInviteStorageKey, JSON.stringify({
          emails: bulkEmails,
          role: bulkRole
        }));
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [bulkEmails, bulkRole, bulkInviteStorageKey]);
  

  // Auth guard - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }
  }, [authLoading, user, router]);

  // Helper function to safely format plan name
  const formatPlanName = (plan: string | null | undefined): string => {
    if (!plan) return 'Unknown';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Fetch team data - wrapped in useCallback to prevent infinite re-renders
  const fetchTeamData = useCallback(async () => {
    
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch members - pass selected account if available
      const accountId = selectedAccountId || user?.id;
      const membersUrl = accountId ? `/team/members?account_id=${accountId}` : '/team/members';
      const membersData = await apiClient.get(membersUrl);

      // Fetch invitations (only if user is owner)
      let invitationsData = { invitations: [] };
      if (membersData.current_user_role === 'owner') {
        try {
          invitationsData = await apiClient.get('/team/invitations');
        } catch (err) {
          console.warn('Failed to fetch invitations:', err);
        }
      }

      
      setTeamData({
        ...membersData,
        invitations: invitationsData.invitations
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [selectedAccountId, user?.id]); // Dependencies for account selection

  // Single useEffect for initial data loading
  useEffect(() => {
    // Fetch team data once authentication state and account selection are ready
    if (user?.id && !authLoading && !fetchingRef.current) {
      fetchTeamData();
    }
  }, [user?.id, authLoading, selectedAccountId, fetchTeamData]);

  // Helper function to set loading state for specific actions
  const setActionLoading = (action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [action]: isLoading
    }));
  };

  // Enhanced loading state helper with user feedback
  const withLoadingState = async <T,>(
    action: string, 
    asyncFn: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setActionLoading(action, true);
      setError(null);
      const result = await asyncFn();
      
      if (successMessage) {
        setSuccess(successMessage);
        setTimeout(() => setSuccess(null), 5000);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setTimeout(() => setError(null), 8000);
      return null;
    } finally {
      setActionLoading(action, false);
    }
  };

  // Send invitation with enhanced UX
  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const result = await withLoadingState(
      'sendInvitation',
      async () => {
        try {
          const data = await apiClient.post('/team/invite', {
            email: inviteEmail.trim(),
            role: inviteRole,
          });

          // Show warnings if present
          if (data.warnings && data.warnings.length > 0) {
            console.warn('Invitation warnings:', data.warnings);
          }

          return data;
        } catch (error: any) {
          // Enhanced error handling with specific suggestions
          if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment before sending another invitation.');
          }
          if (error.status === 409) {
            throw new Error(error.message || 'This email address already has a pending invitation.');
          }
          if (error.details && Array.isArray(error.details)) {
            throw new Error(`Email validation failed: ${error.details.join(', ')}`);
          }
          if (error.suggestions && Array.isArray(error.suggestions)) {
            throw new Error(`${error.message || 'Email validation failed'}. ${error.suggestions.join(' ')}`);
          }
          throw new Error(error.message || 'Failed to send invitation');
        }
      },
      `Invitation sent successfully to ${inviteEmail}! They'll receive an email with instructions to join your team.`
    );

    if (result) {
      setInviteEmail('');
      setInviteRole('member');
      // Clear saved form data on successful invite
      if (typeof window !== 'undefined') {
        localStorage.removeItem(inviteFormStorageKey);
      }
      await fetchTeamData();
    }
  };

  // Send multiple invitations
  const sendBulkInvitations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEmails.trim()) return;

    try {
      setBulkInviting(true);
      setError(null);
      setSuccess(null);

      // Parse emails (split by comma, newline, or semicolon)
      const emailList = bulkEmails
        .split(/[,;\n]/)
        .map((email: string) => email.trim())
        .filter((email: string) => email && email.includes('@'));

      if (emailList.length === 0) {
        throw new Error('No valid email addresses found');
      }

      if (emailList.length > 10) {
        throw new Error('Maximum 10 team member invitations at once');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Send invitations one by one
      for (const email of emailList) {
        try {
          await apiClient.post('/team/invite', {
            email: email,
            role: bulkRole,
          });
          successCount++;

          // Small delay between invitations
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          errorCount++;
          errors.push(`${email}: ${error.message || 'Failed to send'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        setSuccess(`Successfully sent ${successCount} invitation${successCount !== 1 ? 's' : ''}!`);
      }
      
      if (errorCount > 0) {
        setError(`${errorCount} invitation${errorCount !== 1 ? 's' : ''} failed: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }

      if (successCount > 0) {
        setBulkEmails('');
        setBulkRole('member');
        setShowBulkInvite(false);
        // Clear saved form data on successful bulk invite
        if (typeof window !== 'undefined') {
          localStorage.removeItem(bulkInviteStorageKey);
        }
        await fetchTeamData(); // Refresh data
      }
      
      // Clear messages after 7 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 7000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send team member invitations';
      setError(errorMessage);
      setTimeout(() => setError(null), 7000);
    } finally {
      setBulkInviting(false);
    }
  };

  // Cancel invitation with enhanced UX
  const cancelInvitation = async (invitationId: string, email: string) => {
    const result = await withLoadingState(
      `cancel-${invitationId}`,
      async () => {
        return await apiClient.delete(`/team/invitations?id=${invitationId}`);
      },
      `Invitation to ${email} has been cancelled.`
    );

    if (result) {
      await fetchTeamData();
    }
  };

  // Resend invitation with enhanced UX
  const resendInvitation = async (invitationId: string, email: string) => {
    const result = await withLoadingState(
      `resend-${invitationId}`,
      async () => {
        try {
          return await apiClient.post('/team/invitations/resend', {
            invitation_id: invitationId
          });
        } catch (error: any) {
          if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please wait before resending.');
          }
          if (error.status === 401) {
            console.error('🔒 Resend failed - Authentication error:', {
              status: error.status,
              error: error.message
            });
            throw new Error(`Authentication failed: ${error.message}. Please refresh the page and try again.`);
          }
          throw new Error(error.message || 'Failed to resend invitation');
        }
      },
      `Invitation resent to ${email}! They'll receive a fresh email with updated expiration.`
    );

    if (result) {
      await fetchTeamData();
    }
  };

  // Remove team member
  const removeMember = async (memberUserId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from your team? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/team/members?user_id=${memberUserId}`);

      setSuccess(`${memberEmail} has been removed from your team.`);
      await fetchTeamData(); // Refresh data

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove team member';
      setError(errorMessage);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Change member role
  const changeMemberRole = async (memberUserId: string, memberEmail: string, newRole: string) => {
    try {
      await apiClient.patch('/team/members', {
        user_id: memberUserId,
        role: newRole
      });

      setSuccess(`${memberEmail}'s role has been updated to ${newRole}.`);
      await fetchTeamData(); // Refresh data

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to change member role';
      setError(errorMessage);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Add Chris for support
  const addChris = async () => {
    try {
      setAddingChris(true);
      setError(null);
      setSuccess(null);

      const data = await apiClient.post('/team/add-chris', {
        account_id: selectedAccountId || teamData?.account?.id
      });

      if (data.already_member) {
        setSuccess('Chris is already a member of this account! 👍');
      } else {
        setSuccess('Chris has been added for development and support assistance! 🎉');
      }
      await fetchTeamData(); // Refresh data

      // Clear success message after 8 seconds
      setTimeout(() => setSuccess(null), 8000);
    } catch (error: any) {
      console.error('Error in addChris:', error);
      const errorMessage = error.message || 'Failed to add Chris';
      setError(errorMessage);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setAddingChris(false);
    }
  };

  // Add safety timeout for stuck loading states
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Team Page - Loading timeout reached, forcing complete');
        setLoading(false);
        if (!teamData) {
          setError('Failed to load team data. Please refresh the page.');
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [loading, teamData]);

  // Use global overlay for page-level loading; render nothing
  useEffect(() => {
    const pageLoading = authLoading || loading || !user;
    if (pageLoading) loader.show('team'); else loader.hide('team');
    return () => loader.hide('team');
  }, [authLoading, loading, user, loader]);

  if (authLoading || loading || !user) {
    return null;
  }

  if (!teamData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Failed to load team data</p>
          <button 
            onClick={fetchTeamData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { members, invitations, account, current_user_role } = teamData;
  const isOwner = current_user_role === 'owner';
  
  // Separate support members from regular team members
  const supportMembers = members.filter(m => m.role === 'support');
  const regularMembers = members.filter(m => m.role !== 'support');
  
  // Additional safety check for account data
  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Account data not available</p>
          <button 
            onClick={fetchTeamData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Team management</h1>
          <p className="text-white mt-1">
            Manage your team members and invitations
          </p>
        </div>
        {isOwner && (
          <div className="text-right">
            <p className="text-sm text-white">
              {account.current_users} of {account.max_users || '?'} on {formatPlanName(account.plan)}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {account.can_add_more ? 'Can add more team members' : 'User limit reached'}
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <div className="flex-shrink-0">
            <XMarkIcon className="w-5 h-5 text-red-400 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="flex-shrink-0 text-green-400 hover:text-green-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite Form (Owners Only) */}
      {isOwner && account.can_add_more && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invite Team Member
          </h2>
          
          {!account.can_add_more && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                You've reached your user limit ({account.max_users} users). 
                <button 
                  onClick={() => router.push('/dashboard/plan')}
                  className="ml-2 text-yellow-900 underline hover:no-underline"
                >
                  Upgrade your plan
                </button>
                {' '}to add more team members.
              </p>
            </div>
          )}

          <form onSubmit={sendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!account.can_add_more || inviting}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="relative ml-2">
                    <button
                      type="button"
                      onMouseEnter={() => setShowRoleTooltip(true)}
                      onMouseLeave={() => setShowRoleTooltip(false)}
                      onClick={() => setShowRoleTooltip(!showRoleTooltip)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label="Role information"
                    >
                      <QuestionMarkCircleIcon className="w-4 h-4" />
                    </button>
                    {showRoleTooltip && (
                      <div className="absolute z-10 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg left-0 top-6">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-2">Role Permissions:</div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-purple-800">Owner:</span>
                              <span className="text-gray-700 ml-1">Full access to account settings, billing, team management, and all businesses</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-800">Member:</span>
                              <span className="text-gray-700 ml-1">Can view and contribute to businesses, but cannot manage account settings or team members</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'owner')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={inviting}
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  disabled={!account.can_add_more || loadingStates['sendInvitation'] || !inviteEmail.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[40px]"
                >
                  {loadingStates['sendInvitation'] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending invitation...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Multiple Invitations Form (Maven Accounts Only) */}
      {isOwner && account.can_add_more && account.plan === 'maven' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invite Multiple Team Members
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Invite several colleagues at once by entering their email addresses below.
          </p>
          
          {!account.can_add_more && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                You've reached your user limit ({account.max_users} users). 
                <button 
                  onClick={() => router.push('/dashboard/plan')}
                  className="ml-2 text-yellow-900 underline hover:no-underline"
                >
                  Upgrade your plan
                </button>
                {' '}to add more team members.
              </p>
            </div>
          )}

          <form onSubmit={sendBulkInvitations} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label htmlFor="bulkEmails" className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member Email Addresses
                  <span className="text-xs text-gray-500 ml-1">(separate with commas or new lines)</span>
                </label>
                <textarea
                  id="bulkEmails"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder="john@company.com&#10;sarah@company.com&#10;mike@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  disabled={!account.can_add_more || bulkInviting}
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: You can paste multiple emails from a spreadsheet or document
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="bulkRole" className="block text-sm font-medium text-gray-700">
                    Role for All Members
                  </label>
                  <select
                    id="bulkRole"
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value as 'member' | 'owner')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={bulkInviting}
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!account.can_add_more || bulkInviting || !bulkEmails.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[40px]"
                >
                  {bulkInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending Invitations...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Send All Invitations
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Team Members ({regularMembers.length})
        </h2>
        
        {regularMembers.length === 0 ? (
          <p className="text-gray-500">No team members yet.</p>
        ) : (
          <div className="space-y-3">
            {regularMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.first_name || member.last_name ? (
                        `${member.first_name} ${member.last_name}`.trim()
                      ) : (
                        member.role === 'support' ? 'Chris @ Prompt Reviews' : 'Team Member'
                      )}
                      {member.is_current_user && (
                        <span className="ml-2 text-sm text-gray-500">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.business_name && (
                      <p className="text-sm text-gray-400">{member.business_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Role Display/Selector */}
                  {isOwner && !member.is_current_user && member.role !== 'owner' && member.role !== 'support' ? (
                    <select
                      value={member.role}
                      onChange={(e) => changeMemberRole(member.user_id, member.email, e.target.value)}
                      className="px-2 py-1 text-xs font-medium rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent self-start sm:self-auto"
                    >
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.role === 'owner' 
                        ? 'bg-purple-100 text-purple-800' 
                        : member.role === 'support'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role === 'support' ? '🛠️ Support' : member.role}
                    </span>
                  )}
                  
                  {/* Remove Member Button */}
                  {isOwner && !member.is_current_user && member.role !== 'owner' && member.role !== 'support' && (
                    <button
                      onClick={() => removeMember(member.user_id, member.email)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Remove team member"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support Section */}
      {supportMembers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Support
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Support team members provide technical assistance and don't count against your team member limits.
          </p>
          
          <div className="space-y-3">
            {supportMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🛠️</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Chris @ Prompt Reviews
                      {member.is_current_user && (
                        <span className="ml-2 text-sm text-gray-500">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Development & Technical Support</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    🛠️ Support Team
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations (Owners Only) */}
      {isOwner && invitations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Invitations ({invitations.length})
          </h2>
          
          {/* Expiration notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              Invitations expire after 7 days. Expired invitations can be resent with a new link.
            </p>
          </div>
          
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited by {invitation.invited_by} • {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    invitation.role === 'owner' 
                      ? 'bg-purple-100 text-purple-800' 
                      : invitation.role === 'support'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invitation.role === 'support' ? '🛠️ Support' : invitation.role}
                  </span>
                  
                  {/* Enhanced invitation status indicators */}
                  {invitation.is_expired ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                  
                  {/* Time remaining indicator */}
                  <span className="text-xs text-gray-500">
                    {(() => {
                      const expiresAt = new Date(invitation.expires_at);
                      const now = new Date();
                      const diffHours = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffHours / 24);
                      
                      if (diffHours < 0) return 'Expired';
                      if (diffDays > 1) return `${diffDays} days left`;
                      if (diffHours > 1) return `${diffHours} hours left`;
                      return 'Expires soon';
                    })()}
                  </span>
                  
                  {/* Enhanced resend button with loading states */}
                  <button
                    onClick={() => resendInvitation(invitation.id, invitation.email)}
                    disabled={loadingStates[`resend-${invitation.id}`]}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-xs px-2 py-1 rounded border border-blue-200 hover:border-blue-400"
                    title="Resend invitation email"
                  >
                    {loadingStates[`resend-${invitation.id}`] ? (
                      <>
                        <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="w-3 h-3" />
                        <span>Resend</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => cancelInvitation(invitation.id, invitation.email)}
                    disabled={loadingStates[`cancel-${invitation.id}`]}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Cancel invitation"
                  >
                    {loadingStates[`cancel-${invitation.id}`] ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <XMarkIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced no pending invitations message */}
      {isOwner && invitations.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Invitations
          </h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-sm text-gray-500 mb-6">
              When you invite team members, they'll appear here until they accept.
            </p>
            <div className="space-y-3">
              <div className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <ClockIcon className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">Invitations expire after 7 days</span>
              </div>
              <div className="inline-flex items-center px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg ml-2">
                <ArrowPathIcon className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-sm text-purple-800">You can resend expired invitations</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-owner message */}
      {!isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-blue-800">
            Only account owners can manage team members and invitations. 
            Contact your account owner to add or remove team members.
          </p>
        </div>
      )}

      {/* Development Support Section - Always visible for owners */}
      {isOwner && (
        (() => {
          const chrisMember = members.find(member => 
            member.email === 'chris@diviner.agency' || 
            member.email === 'nerves76@gmail.com'
          );
          const hasChris = !!chrisMember;
          
          return (
            <div className={`border rounded-lg p-6 mt-8 ${
              hasChris 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    hasChris ? 'text-green-900' : 'text-blue-900'
                  }`}>
                    {hasChris ? '✅ Development Support Active' : '🛠️ Need Development Support?'}
                  </h3>
                  {hasChris ? (
                    <>
                      <p className="text-green-700 mb-2">
                        Chris has been added to your team for development assistance, bug fixes, and technical support.
                      </p>
                      {chrisMember.role === 'support' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Support Role
                        </span>
                      )}
                      <p className="text-sm text-green-600 mt-2">
                        <strong>Note:</strong> Support members don't count against your team member limits.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-blue-800 mb-2">
                        Add Chris for development assistance, bug fixes, and technical support. (Also, tell him about your problem first.)
                      </p>
                      <p className="text-sm text-blue-600">
                        <strong>Note:</strong> Support members don't count against your team member limits.
                      </p>
                    </>
                  )}
                </div>
                {hasChris ? (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 px-6 py-3 rounded-lg cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <span className="text-green-600">✓</span>
                    Already Added
                  </button>
                ) : (
                  <button
                    onClick={addChris}
                    disabled={addingChris}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    {addingChris ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding Chris...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        Add Chris
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
} 
