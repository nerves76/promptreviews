"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/auth";

// Helper to get selected account ID from localStorage
function getSelectedAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const userId = localStorage.getItem('promptreviews_last_user_id');
    if (!userId) return null;
    const accountKey = `promptreviews_selected_account_${userId}`;
    return localStorage.getItem(accountKey);
  } catch (error) {
    console.error('Error reading selected account:', error);
    return null;
  }
}

interface Activity {
  id: string;
  prompt_page_id: string;
  contact_id?: string;
  account_id: string;
  activity_type: "email" | "sms" | "status_change" | "note" | "manual";
  content: string;
  metadata: {
    mentions?: string[];
    status_from?: string;
    status_to?: string;
  };
  created_by: string;
  created_by_user?: {
    id: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface ActivityTimelineProps {
  promptPageId: string;
  accountId: string;
  contactId?: string;
  onRefresh?: () => void;
}

const ACTIVITY_TYPE_CONFIG = {
  email: {
    icon: "FaEnvelope",
    label: "Email",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  sms: {
    icon: "FaMobile",
    label: "SMS",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
  status_change: {
    icon: "FaExchangeAlt",
    label: "Status Change",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  note: {
    icon: "FaStickyNote",
    label: "Note",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  manual: {
    icon: "FaPencilAlt",
    label: "Activity",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
  },
};

export default function ActivityTimeline({
  promptPageId,
  accountId,
  contactId,
  onRefresh,
}: ActivityTimelineProps) {
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newActivityContent, setNewActivityContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch campaign actions
  const fetchActivities = async () => {
    // Don't fetch if not authenticated or auth not initialized
    if (!user || !isInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      const selectedAccountId = getSelectedAccountId();
      if (selectedAccountId) {
        headers["X-Selected-Account"] = selectedAccountId;
      }

      const response = await fetch(
        `/api/campaign-actions?prompt_page_id=${promptPageId}`,
        {
          headers,
          credentials: 'include' // Include cookies for auth
        }
      );

      if (!response.ok) {
        // Silently fail if fetch fails (likely auth not ready)
        setActivities([]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      // Only log errors if auth is initialized (suppress initial auth timing issues)
      if (isInitialized) {
        console.error("Error fetching campaign actions:", err);
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when auth is initialized and user is authenticated
    if (isInitialized && user && !authLoading) {
      fetchActivities();
    }
  }, [promptPageId, user, authLoading, isInitialized]);

  // Add new campaign action
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newActivityContent.trim()) {
      return;
    }

    // Don't submit if auth not ready
    if (!user || !isInitialized) {
      console.log('Auth not ready:', { user: !!user, isInitialized });
      setError("Please wait for authentication to complete");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      const selectedAccountId = getSelectedAccountId();
      if (selectedAccountId) {
        headers["X-Selected-Account"] = selectedAccountId;
      }

      console.log('Submitting campaign action:', { promptPageId, accountId, selectedAccountId });

      const response = await fetch("/api/campaign-actions", {
        method: "POST",
        headers,
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({
          promptPageId,
          contactId,
          accountId,
          activityType: "note",
          content: newActivityContent.trim(),
          metadata: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Campaign action failed:', response.status, errorData);
        throw new Error("Failed to add campaign action");
      }

      const data = await response.json();
      setActivities([data.activity, ...activities]);
      setNewActivityContent("");
      onRefresh?.();
    } catch (err) {
      console.error("Error adding campaign action:", err);
      setError(err instanceof Error ? err.message : "Failed to add campaign action");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update campaign action
  const handleUpdateActivity = async (id: string) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      const selectedAccountId = getSelectedAccountId();
      if (selectedAccountId) {
        headers["X-Selected-Account"] = selectedAccountId;
      }

      const response = await fetch("/api/campaign-actions", {
        method: "PATCH",
        headers,
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({
          id,
          content: editContent.trim(),
          metadata: {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update campaign action");
      }

      const data = await response.json();
      setActivities(
        activities.map((a) => (a.id === id ? data.activity : a))
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Error updating campaign action:", err);
      setError(err instanceof Error ? err.message : "Failed to update campaign action");
    }
  };

  // Delete campaign action
  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this action?")) {
      return;
    }

    try {
      const headers: HeadersInit = {};
      const selectedAccountId = getSelectedAccountId();
      if (selectedAccountId) {
        headers["X-Selected-Account"] = selectedAccountId;
      }

      const response = await fetch(
        `/api/campaign-actions?id=${id}`,
        {
          method: "DELETE",
          headers,
          credentials: 'include' // Include cookies for auth
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete campaign action");
      }

      setActivities(activities.filter((a) => a.id !== id));
      onRefresh?.();
    } catch (err) {
      console.error("Error deleting campaign action:", err);
      setError(err instanceof Error ? err.message : "Failed to delete campaign action");
    }
  };

  // Parse @mentions and highlight them
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-slate-blue font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-3">
      {/* Add New Activity Form */}
      <form onSubmit={handleAddActivity} className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Add update:
        </label>
        <div className="flex gap-2">
          <textarea
            value={newActivityContent}
            onChange={(e) => setNewActivityContent(e.target.value)}
            placeholder="Add a note... (use @username to mention someone)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue/50 bg-white/80 resize-none"
            rows={2}
            disabled={isSubmitting || !user || !isInitialized}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newActivityContent.trim() || !user || !isInitialized}
            className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 self-start"
          >
            {isSubmitting ? (
              <>
                <Icon name="FaSpinner" size={14} className="animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Icon name="FaPlus" size={14} />
                Add
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message - Hidden during initial auth */}
      {error && user && isInitialized && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Icon name="FaSpinner" size={20} className="animate-spin mr-2" />
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No activities yet. Add the first one above!
          </div>
        ) : (
          activities.map((activity) => {
            const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
            const isEditing = editingId === activity.id;

            return (
              <div
                key={activity.id}
                className={`p-3 border rounded-lg ${config.bgColor} ${config.borderColor}`}
              >
                {/* Activity Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      name={config.icon}
                      size={14}
                      className={config.textColor}
                    />
                    <span
                      className={`text-xs font-medium ${config.textColor}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {activity.activity_type === "note" && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(activity.id);
                          setEditContent(activity.content);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        title="Edit"
                      >
                        <Icon name="FaPencilAlt" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Icon name="FaTrash" size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Activity Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-blue/50 bg-white resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateActivity(activity.id)}
                        className="px-2 py-1 bg-slate-blue text-white rounded text-xs font-medium hover:bg-slate-blue/90"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {renderContent(activity.content)}
                  </p>
                )}

                {/* Activity Metadata */}
                {activity.created_by_user && (
                  <div className="mt-2 text-xs text-gray-500">
                    by {activity.created_by_user.email}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
