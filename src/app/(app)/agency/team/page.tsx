"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/auth";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LoadingSpinner } from "@/app/(app)/components/ui/loading-spinner";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";

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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
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

export default function AgencyTeamPage() {
  const { account, user } = useAuth();
  const { selectedAccountId } = useAccountData();
  const router = useRouter();

  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Support section
  const [addingChris, setAddingChris] = useState(false);

  const fetchingRef = useRef(false);

  const fetchTeamData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const accountId = selectedAccountId || user?.id;
      const membersUrl = accountId ? `/team/members?account_id=${accountId}` : '/team/members';
      const membersData = await apiClient.get<Omit<TeamData, 'invitations'>>(membersUrl);

      let invitationsData: { invitations: Invitation[] } = { invitations: [] };
      if (membersData.current_user_role === 'owner') {
        try {
          invitationsData = await apiClient.get<{ invitations: Invitation[] }>('/team/invitations');
        } catch (err) {
          console.warn('Failed to fetch invitations:', err);
        }
      }

      // Fetch notifications
      try {
        const notifData = await apiClient.get<{ notifications: Notification[] }>('/notifications?limit=5');
        setNotifications(notifData.notifications || []);
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
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
  }, [selectedAccountId, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchTeamData();
    }
  }, [user?.id, selectedAccountId, fetchTeamData]);

  const setActionLoadingState = (action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: isLoading }));
  };

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      await apiClient.post('/team/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setSuccess(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteModal(false);
      await fetchTeamData();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    try {
      setActionLoadingState(`cancel-${invitationId}`, true);
      await apiClient.delete(`/team/invitations?id=${invitationId}`);
      setSuccess(`Invitation to ${email} cancelled.`);
      await fetchTeamData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invitation');
    } finally {
      setActionLoadingState(`cancel-${invitationId}`, false);
    }
  };

  const resendInvitation = async (invitationId: string, email: string) => {
    try {
      setActionLoadingState(`resend-${invitationId}`, true);
      await apiClient.post('/team/invitations/resend', {
        invitation_id: invitationId
      });
      setSuccess(`Invitation resent to ${email}!`);
      await fetchTeamData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    } finally {
      setActionLoadingState(`resend-${invitationId}`, false);
    }
  };

  const removeMember = async (memberUserId: string, memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from your team?`)) return;

    try {
      await apiClient.delete(`/team/members?user_id=${memberUserId}`);
      setSuccess(`${memberEmail} has been removed.`);
      await fetchTeamData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove team member');
    }
  };

  const addChris = async () => {
    try {
      setAddingChris(true);
      setError(null);

      const data = await apiClient.post<{ already_member?: boolean; success?: boolean }>('/team/add-chris', {
        account_id: selectedAccountId || teamData?.account?.id
      });

      if (data.already_member) {
        setSuccess('Chris is already a member of this account!');
      } else {
        setSuccess('Chris has been added for support!');
      }
      await fetchTeamData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add Chris');
    } finally {
      setAddingChris(false);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}`, { is_read: true });
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" className="text-white" />
        </div>
      </div>
    );
  }

  if (error && !teamData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <Icon name="FaExclamationTriangle" className="text-red-400 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchTeamData}
            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!teamData) return null;

  const { members, invitations, account: teamAccount, current_user_role } = teamData;
  const isOwner = current_user_role === 'owner';
  const supportMembers = members.filter(m => m.role === 'support');
  const regularMembers = members.filter(m => m.role !== 'support');

  const hasChris = members.some(member =>
    member.email === 'chris@diviner.agency' ||
    member.email === 'nerves76@gmail.com'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-white/70 mt-1">
            Manage your agency team members
          </p>
        </div>
        {isOwner && teamAccount?.can_add_more && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition-colors whitespace-nowrap"
          >
            <Icon name="FaPlus" size={14} />
            Invite member
          </button>
        )}
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <Icon name="FaCheckCircle" className="text-green-400 flex-shrink-0" size={18} />
          <p className="text-green-400">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-300"
            aria-label="Dismiss"
          >
            <Icon name="FaTimes" size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <Icon name="FaExclamationTriangle" className="text-red-400 flex-shrink-0" size={18} />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
            aria-label="Dismiss"
          >
            <Icon name="FaTimes" size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team members */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                Team members ({regularMembers.length})
              </h2>
              {teamAccount && (
                <span className="text-sm text-white/60">
                  {teamAccount.current_users} of {teamAccount.max_users || '∞'} seats
                </span>
              )}
            </div>

            <div className="divide-y divide-white/10">
              {regularMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <Icon name="FaUser" className="text-white/60" size={18} />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {member.first_name || member.last_name
                          ? `${member.first_name} ${member.last_name}`.trim()
                          : 'Team member'}
                        {member.is_current_user && (
                          <span className="ml-2 text-white/50 text-sm">(You)</span>
                        )}
                      </p>
                      <p className="text-white/60 text-sm">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      member.role === 'owner'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {member.role}
                    </span>

                    {isOwner && !member.is_current_user && member.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(member.user_id, member.email)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        aria-label="Remove member"
                      >
                        <Icon name="FaTimes" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {regularMembers.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-white/60 text-sm">No team members yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending invitations */}
          {isOwner && invitations.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  Pending invitations ({invitations.length})
                </h2>
              </div>

              <div className="divide-y divide-white/10">
                {invitations.map((invitation) => {
                  const expiresAt = new Date(invitation.expires_at);
                  const now = new Date();
                  const diffHours = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffHours / 24);
                  const timeLeft = diffHours < 0 ? 'Expired' : diffDays > 1 ? `${diffDays} days left` : diffHours > 1 ? `${diffHours}h left` : 'Expires soon';

                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <Icon name="FaEnvelope" className="text-amber-400" size={18} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{invitation.email}</p>
                          <p className="text-white/60 text-sm">
                            Invited {new Date(invitation.created_at).toLocaleDateString()} • {timeLeft}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          invitation.is_expired
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {invitation.is_expired ? 'Expired' : 'Pending'}
                        </span>

                        <button
                          onClick={() => resendInvitation(invitation.id, invitation.email)}
                          disabled={loadingStates[`resend-${invitation.id}`]}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                        >
                          {loadingStates[`resend-${invitation.id}`] ? (
                            <LoadingSpinner size="xs" />
                          ) : (
                            <Icon name="FaRedo" size={12} />
                          )}
                          Resend
                        </button>

                        <button
                          onClick={() => cancelInvitation(invitation.id, invitation.email)}
                          disabled={loadingStates[`cancel-${invitation.id}`]}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          aria-label="Cancel invitation"
                        >
                          {loadingStates[`cancel-${invitation.id}`] ? (
                            <LoadingSpinner size="xs" />
                          ) : (
                            <Icon name="FaTimes" size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Support section */}
          {isOwner && (
            <div className={`rounded-lg p-6 ${
              hasChris
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${
                    hasChris ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {hasChris ? 'Support active' : 'Need help?'}
                  </h3>
                  <p className={hasChris ? 'text-green-300/80' : 'text-blue-300/80'}>
                    {hasChris
                      ? 'Chris has access for development and support assistance.'
                      : 'Add Chris for development help and technical support.'}
                  </p>
                  <p className="text-white/50 text-sm mt-2">
                    Support members don't count against your team limit.
                  </p>
                </div>

                {hasChris ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                    <Icon name="FaCheckCircle" size={16} />
                    <span className="font-medium whitespace-nowrap">Added</span>
                  </div>
                ) : (
                  <button
                    onClick={addChris}
                    disabled={addingChris}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {addingChris ? (
                      <>
                        <LoadingSpinner size="xs" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Icon name="FaPlus" size={14} />
                        Add Chris
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Support members list */}
          {supportMembers.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  Support team ({supportMembers.length})
                </h2>
              </div>

              <div className="divide-y divide-white/10">
                {supportMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Icon name="FaTools" className="text-blue-400" size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Chris @ Prompt Reviews
                        </p>
                        <p className="text-white/60 text-sm">{member.email}</p>
                      </div>
                    </div>

                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 whitespace-nowrap">
                      Support
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Recent notifications */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <button
                onClick={() => router.push('/dashboard/notifications')}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-white/10">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-white/5' : ''
                    }`}
                    onClick={() => {
                      markNotificationRead(notification.id);
                      if (notification.action_url) {
                        router.push(notification.action_url);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        markNotificationRead(notification.id);
                        if (notification.action_url) {
                          router.push(notification.action_url);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.is_read ? 'bg-blue-500/20' : 'bg-white/10'
                      }`}>
                        <Icon
                          name="FaBell"
                          className={!notification.is_read ? 'text-blue-400' : 'text-white/50'}
                          size={14}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-white' : 'text-white/80'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-white/60 text-xs mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon name="FaBell" className="text-white/40" size={20} />
                  </div>
                  <p className="text-white/60 text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">Team overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Team members</span>
                <span className="text-white font-medium">{regularMembers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Pending invites</span>
                <span className="text-white font-medium">{invitations.length}</span>
              </div>
              {teamAccount && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Available seats</span>
                  <span className="text-white font-medium">
                    {teamAccount.max_users ? teamAccount.max_users - teamAccount.current_users : '∞'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Non-owner notice */}
          {!isOwner && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="FaInfoCircle" className="text-white/50 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-white/60 text-sm">
                  Only account owners can manage team members and invitations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole('member');
        }}
        title="Invite team member"
        size="md"
      >
        <form onSubmit={sendInvitation}>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Send an invitation to join your agency team. They'll receive an email with instructions.
            </p>

            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@agency.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'owner')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              >
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Owners have full access to account settings and team management.
              </p>
            </div>
          </div>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading || !inviteEmail.trim()}>
              {actionLoading ? (
                <>
                  <LoadingSpinner size="xs" className="mr-2" />
                  Sending...
                </>
              ) : (
                'Send invitation'
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
