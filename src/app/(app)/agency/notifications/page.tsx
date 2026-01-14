"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  read: boolean;
  created_at: string;
  account_id: string;
  account_name?: string;
}

interface AccountInfo {
  id: string;
  name: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  accounts?: AccountInfo[];
  accountUnreadCounts?: Record<string, number>;
  isAgencyView?: boolean;
}

export default function AgencyNotificationsPage() {
  const { account } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [accountUnreadCounts, setAccountUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        agency_view: 'true',
        limit: '50',
      });

      if (filterAccount !== 'all') {
        params.set('filter_account', filterAccount);
      }

      if (showUnreadOnly) {
        params.set('unread', 'true');
      }

      const data = await apiClient.get<NotificationsResponse>(`/notifications?${params.toString()}`);

      setNotifications(data.notifications || []);
      setTotalUnread(data.unreadCount || 0);

      if (data.accounts) {
        setAccounts(data.accounts);
      }

      if (data.accountUnreadCounts) {
        setAccountUnreadCounts(data.accountUnreadCounts);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filterAccount, showUnreadOnly]);

  useEffect(() => {
    if (account?.id) {
      fetchNotifications();
    }
  }, [account?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.post('/notifications', {
        action: 'mark_read',
        notificationIds: [notificationId],
        agencyView: true,
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setTotalUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/notifications', {
        action: 'mark_all_read',
        agencyView: true,
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setTotalUnread(0);
      setAccountUnreadCounts({});
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/70 mt-1">
            {totalUnread > 0
              ? `${totalUnread} unread notification${totalUnread !== 1 ? 's' : ''} across all accounts`
              : 'All caught up!'}
          </p>
        </div>

        {totalUnread > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {actionLoading ? (
              <Icon name="FaSpinner" className="animate-spin" size={14} />
            ) : (
              <Icon name="FaCheck" size={14} />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Account filter */}
          <div className="flex-1">
            <label htmlFor="account-filter" className="block text-sm font-medium text-white/70 mb-1">
              Filter by account
            </label>
            <select
              id="account-filter"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            >
              <option value="all" className="bg-gray-800">All accounts ({totalUnread} unread)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-gray-800">
                  {acc.name} {accountUnreadCounts[acc.id] ? `(${accountUnreadCounts[acc.id]} unread)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Unread only toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-slate-blue focus:ring-slate-blue focus:ring-offset-0"
              />
              <span className="text-white text-sm whitespace-nowrap">Unread only</span>
            </label>
          </div>
        </div>

        {/* Quick filter buttons for accounts with unread */}
        {Object.keys(accountUnreadCounts).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">Quick filters:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAccount('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                  filterAccount === 'all'
                    ? 'bg-slate-blue text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All ({totalUnread})
              </button>
              {accounts.filter(acc => accountUnreadCounts[acc.id] > 0).map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setFilterAccount(acc.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                    filterAccount === acc.id
                      ? 'bg-slate-blue text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {acc.name} ({accountUnreadCounts[acc.id]})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Icon name="FaExclamationTriangle" className="text-red-400" size={18} />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Notifications list */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-white/10">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-white/5' : ''
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      !notification.read ? 'bg-blue-400' : 'bg-transparent'
                    }`} />
                  </div>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notification.read ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    <Icon
                      name="FaBell"
                      className={!notification.read ? 'text-blue-400' : 'text-white/50'}
                      size={18}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-medium ${
                          !notification.read ? 'text-white' : 'text-white/80'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.account_name && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded">
                            {notification.account_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/50 whitespace-nowrap flex-shrink-0">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <p className="text-blue-400 text-sm mt-2 flex items-center gap-1">
                        {notification.action_label || 'View details'}
                        <Icon name="FaChevronRight" size={10} />
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FaBell" className="text-white/40" size={28} />
            </div>
            <h3 className="text-white font-medium mb-2">
              {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-white/60 text-sm">
              {showUnreadOnly
                ? 'All notifications have been read.'
                : filterAccount !== 'all'
                ? 'No notifications for this account.'
                : 'Notifications from all your accounts will appear here.'}
            </p>
            {showUnreadOnly && (
              <button
                onClick={() => setShowUnreadOnly(false)}
                className="mt-4 text-blue-400 text-sm hover:text-blue-300"
              >
                Show all notifications
              </button>
            )}
          </div>
        )}
      </div>

      {/* Load more hint */}
      {notifications.length >= 50 && (
        <p className="text-center text-white/50 text-sm mt-4">
          Showing the 50 most recent notifications
        </p>
      )}
    </div>
  );
}
