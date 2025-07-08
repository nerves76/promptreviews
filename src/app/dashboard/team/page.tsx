/**
 * Team Management Page
 * 
 * This page allows account owners to manage team members and invitations.
 * It combines member management and invitation system in one interface.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon, UserIcon, EnvelopeIcon, ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

interface TeamMember {
  user_id: string;
  role: 'owner' | 'member';
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
  role: 'owner' | 'member';
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
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRoleTooltip, setShowRoleTooltip] = useState(false);
  
  // Prevent multiple simultaneous calls
  const fetchingRef = useRef(false);

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

      // Fetch members
      const membersResponse = await fetch('/api/team/members');
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch team members');
      }
      const membersData = await membersResponse.json();

      // Fetch invitations (only if user is owner)
      let invitationsData = { invitations: [] };
      if (membersData.current_user_role === 'owner') {
        const invitationsResponse = await fetch('/api/team/invitations');
        if (invitationsResponse.ok) {
          invitationsData = await invitationsResponse.json();
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
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Single useEffect for initial data loading
  useEffect(() => {
    let isMounted = true;
    
    // Only fetch team data if user is authenticated and not already loading
    if (user?.id && !authLoading && !fetchingRef.current) {
      fetchTeamData().catch(console.error);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]); // Removed fetchTeamData from dependencies to prevent re-renders

  // Send invitation
  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setInviteRole('member');
      await fetchTeamData(); // Refresh data
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
          } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
        setError(errorMessage);
        // Clear error message after 5 seconds
        setTimeout(() => setError(null), 5000);
      } finally {
        setInviting(false);
      }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations?id=${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      setSuccess('Invitation cancelled successfully!');
      await fetchTeamData(); // Refresh data
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      setError(errorMessage);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Show loading spinner while auth is loading or team data is loading
  if (authLoading || loading || !user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <FiveStarSpinner />
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">Failed to load team data</p>
          <button 
            onClick={fetchTeamData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { members, invitations, account, current_user_role } = teamData;
  const isOwner = current_user_role === 'owner';
  
  // Additional safety check for account data
  if (!account) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">Account data not available</p>
          <button 
            onClick={fetchTeamData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
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

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Invite Form (Owners Only) */}
      {isOwner && (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!account.can_add_more || inviting || !inviteEmail.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {inviting ? (
                    'Sending...'
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

      {/* Team Members */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Team Members ({members.length})
        </h2>
        
        {members.length === 0 ? (
          <p className="text-gray-500">No team members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
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
                      {member.first_name} {member.last_name}
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
                
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.role === 'owner' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                  
                  {isOwner && !member.is_current_user && (
                    <button
                      onClick={() => {
                        // TODO: Implement role change/remove functionality
                        alert('Role management coming soon!');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations (Owners Only) */}
      {isOwner && invitations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Invitations ({invitations.length})
          </h2>
          
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
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invitation.role}
                  </span>
                  
                  {invitation.is_expired && (
                    <span className="text-xs text-red-600 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      Expired
                    </span>
                  )}
                  
                  <button
                    onClick={() => cancelInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Cancel invitation"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-owner message */}
      {!isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            Only account owners can manage team members and invitations. 
            Contact your account owner to add or remove team members.
          </p>
        </div>
      )}
    </div>
  );
} 