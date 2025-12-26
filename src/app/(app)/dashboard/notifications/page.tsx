"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { useAuth } from "@/auth";

// Notification type from the database
interface Notification {
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

// Notification type filter options
const NOTIFICATION_TYPES = [
  { value: "", label: "All types" },
  { value: "gbp_change_detected", label: "GBP changes" },
  { value: "new_review_received", label: "New reviews" },
  { value: "review_auto_verified", label: "Verified reviews" },
  { value: "team_invitation", label: "Team invites" },
  { value: "subscription_update", label: "Subscription" },
  { value: "credit_warning_upcoming", label: "Credit warnings" },
  { value: "credit_check_skipped", label: "Skipped checks" },
  { value: "system_announcement", label: "Announcements" },
];

// Map notification types to icons and colors
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: IconName; color: string; bgColor: string; label: string }> = {
  gbp_change_detected: { icon: "FaShieldAlt", color: "text-orange-400", bgColor: "bg-orange-500/20", label: "GBP change" },
  new_review_received: { icon: "FaStar", color: "text-yellow-400", bgColor: "bg-yellow-500/20", label: "New review" },
  review_auto_verified: { icon: "FaCheckCircle", color: "text-green-400", bgColor: "bg-green-500/20", label: "Verified" },
  team_invitation: { icon: "FaUsers", color: "text-blue-400", bgColor: "bg-blue-500/20", label: "Team" },
  subscription_update: { icon: "FaCreditCard", color: "text-purple-400", bgColor: "bg-purple-500/20", label: "Subscription" },
  system_announcement: { icon: "FaBell", color: "text-pink-400", bgColor: "bg-pink-500/20", label: "Announcement" },
  credit_warning_upcoming: { icon: "FaExclamationTriangle", color: "text-amber-400", bgColor: "bg-amber-500/20", label: "Credit warning" },
  credit_check_skipped: { icon: "FaTimes", color: "text-red-400", bgColor: "bg-red-500/20", label: "Skipped" },
  default: { icon: "FaBell", color: "text-white", bgColor: "bg-white/20", label: "Notification" },
};

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Group notifications by date
function groupByDate(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    let key: string;

    if (date >= todayStart) {
      key = "Today";
    } else if (date >= yesterdayStart) {
      key = "Yesterday";
    } else if (date >= weekStart) {
      key = "This week";
    } else {
      key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(notification);
  });

  return groups;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { selectedAccountId } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100"); // Fetch more for client-side filtering

      const response = await apiClient.get(`/notifications?${params.toString()}`) as {
        notifications: Notification[];
        unreadCount: number;
      };
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchNotifications();
    }
  }, [selectedAccountId]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Type filter
      if (typeFilter && n.type !== typeFilter) return false;

      // Read filter
      if (readFilter === "unread" && n.read) return false;
      if (readFilter === "read" && !n.read) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !n.title.toLowerCase().includes(query) &&
          !n.message.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, typeFilter, readFilter, searchQuery]);

  // Paginated notifications
  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, page]);

  // Grouped notifications
  const groupedNotifications = useMemo(() => {
    return groupByDate(paginatedNotifications);
  }, [paginatedNotifications]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Actions
  const markAllRead = async () => {
    try {
      await apiClient.post("/notifications", { action: "mark_all_read" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await apiClient.post("/notifications", {
        action: "dismiss",
        notificationIds: [id],
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.post("/notifications", {
        action: "mark_read",
        notificationIds: [id],
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-white/60 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Icon
                name="FaSearch"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4"
                size={16}
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer min-w-[140px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='white'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
                paddingRight: "2.5rem",
              }}
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type.value} value={type.value} className="bg-slate-800">
                  {type.label}
                </option>
              ))}
            </select>

            {/* Read/Unread Filter */}
            <div className="flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
              {(["all", "unread", "read"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setReadFilter(filter);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    readFilter === filter
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
              <p className="text-white/60 mt-4">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <Icon name="FaExclamationTriangle" className="w-12 h-12 text-red-400 mx-auto mb-4" size={48} />
              <p className="text-white font-medium">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="FaBell" className="w-8 h-8 text-white/40" size={32} />
              </div>
              <p className="text-white font-medium text-lg">No notifications found</p>
              <p className="text-white/60 mt-2">
                {searchQuery || typeFilter || readFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedNotifications.entries()).map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  {/* Date Group Header */}
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 px-1">
                    {dateGroup}
                  </h2>

                  {/* Notifications List */}
                  <div className="space-y-2">
                    {items.map((notification) => {
                      const config =
                        NOTIFICATION_TYPE_CONFIG[notification.type] ||
                        NOTIFICATION_TYPE_CONFIG.default;

                      return (
                        <div
                          key={notification.id}
                          className={`relative group p-4 rounded-xl border transition-all duration-200 ${
                            notification.read
                              ? "bg-white/5 border-white/10 hover:bg-white/10"
                              : "bg-white/10 border-white/20 hover:bg-white/15"
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Type Icon */}
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                            >
                              <Icon
                                name={config.icon}
                                className={`w-5 h-5 ${config.color}`}
                                size={20}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
                                    >
                                      {config.label}
                                    </span>
                                    {!notification.read && (
                                      <span className="w-2 h-2 rounded-full bg-pink-400" />
                                    )}
                                  </div>
                                  <h3
                                    className={`font-medium ${
                                      notification.read ? "text-white/80" : "text-white"
                                    }`}
                                  >
                                    {notification.title}
                                  </h3>
                                  <p className="text-sm text-white/60 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-white/40 mt-2">
                                    {formatDate(notification.created_at)}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {notification.action_url && (
                                    <Link
                                      href={notification.action_url}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                                    >
                                      {notification.action_label || "View"}
                                    </Link>
                                  )}
                                  {!notification.read && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Mark as read"
                                    >
                                      <Icon
                                        name="FaCheck"
                                        className="w-4 h-4 text-white/60"
                                        size={16}
                                      />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => dismissNotification(notification.id)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Dismiss"
                                  >
                                    <Icon
                                      name="FaTimes"
                                      className="w-4 h-4 text-white/60"
                                      size={16}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60">
                    Showing {(page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, filteredNotifications.length)} of{" "}
                    {filteredNotifications.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification Settings Link */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/account"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              <Icon name="FaCog" className="w-4 h-4 inline mr-2" size={16} />
              Manage notification preferences
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
