"use client";

import React from "react";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";

// Notification type from the database
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onDismiss: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  onMarkAllRead?: () => void;
}

// Map notification types to icons and colors
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: IconName; color: string; bgColor: string }> = {
  gbp_change_detected: { icon: "FaShieldAlt", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  new_review_received: { icon: "FaStar", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  review_auto_verified: { icon: "FaCheckCircle", color: "text-green-400", bgColor: "bg-green-500/20" },
  team_invitation: { icon: "FaUsers", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  subscription_update: { icon: "FaCreditCard", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  system_announcement: { icon: "FaBell", color: "text-pink-400", bgColor: "bg-pink-500/20" },
  credit_warning_upcoming: { icon: "FaExclamationTriangle", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  credit_check_skipped: { icon: "FaTimes", color: "text-red-400", bgColor: "bg-red-500/20" },
  // Default fallback
  default: { icon: "FaBell", color: "text-white", bgColor: "bg-white/20" },
};

// Helper to get relative time string
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

// Helper to group notifications by time period
function groupNotificationsByTime(notifications: Notification[]): {
  today: Notification[];
  yesterday: Notification[];
  earlier: Notification[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const groups = {
    today: [] as Notification[],
    yesterday: [] as Notification[],
    earlier: [] as Notification[],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.created_at);
    if (notifDate >= todayStart) {
      groups.today.push(notification);
    } else if (notifDate >= yesterdayStart) {
      groups.yesterday.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

// Single notification item component
function NotificationItem({
  notification,
  onDismiss,
  onClose,
}: {
  notification: Notification;
  onDismiss: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.default;
  const timeString = getRelativeTimeString(new Date(notification.created_at));

  return (
    <div
      className={`relative group p-3 rounded-lg border transition-all duration-200 ${
        notification.read
          ? "bg-white/5 border-white/10 hover:bg-white/10"
          : "bg-white/15 border-white/30 hover:bg-white/20"
      }`}
    >
      <Link
        href={notification.action_url || "#"}
        onClick={onClose}
        className="flex gap-3"
      >
        {/* Type Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon name={config.icon} className={`w-4 h-4 ${config.color}`} size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <p className={`text-sm font-medium ${notification.read ? "text-white/80" : "text-white"}`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">
            {timeString}
          </p>
        </div>
      </Link>

      {/* Dismiss Button */}
      <button
        onClick={(e) => onDismiss(notification.id, e)}
        className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
        aria-label="Dismiss notification"
      >
        <Icon name="FaTimes" className="w-3 h-3 text-gray-400 hover:text-white" size={12} />
      </button>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 right-8 w-2 h-2 rounded-full bg-pink-400" />
      )}
    </div>
  );
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-1 py-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

export default function NotificationDropdown({
  notifications,
  loading,
  unreadCount,
  onDismiss,
  onClose,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const groups = groupNotificationsByTime(notifications);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto" />
        </div>
      ) : !hasNotifications ? (
        /* Empty State */
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <Icon name="FaBell" className="w-6 h-6 text-white/50" size={24} />
          </div>
          <p className="text-white font-medium">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        /* Grouped Notifications */
        <div className="space-y-1">
          {/* Today */}
          {groups.today.length > 0 && (
            <div>
              <SectionHeader title="Today" />
              <div className="space-y-2">
                {groups.today.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groups.yesterday.length > 0 && (
            <div className={groups.today.length > 0 ? "mt-4" : ""}>
              <SectionHeader title="Yesterday" />
              <div className="space-y-2">
                {groups.yesterday.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {groups.earlier.length > 0 && (
            <div className={(groups.today.length > 0 || groups.yesterday.length > 0) ? "mt-4" : ""}>
              <SectionHeader title="Earlier" />
              <div className="space-y-2">
                {groups.earlier.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View All Link */}
      {hasNotifications && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon name="FaBars" className="w-4 h-4" size={16} />
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
