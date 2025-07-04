/**
 * Team Management Page
 * 
 * This page allows account owners to manage team members and invitations.
 * It combines member management and invitation system in one interface.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon, UserIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch team data
  const fetchTeamData = async () => {
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
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

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
      fetchTeamData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
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
      fetchTeamData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">Failed to load team data</p>
        </div>
      </div>
    );
  }

  const { members, invitations, account, current_user_role } = teamData;
  const isOwner = current_user_role === 'owner';

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
            <p className="text-sm text-gray-500">
              {account.current_users} of {account.max_users} users
            </p>
            <p className="text-sm text-gray-500 capitalize">
              {account.plan} plan
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
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
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