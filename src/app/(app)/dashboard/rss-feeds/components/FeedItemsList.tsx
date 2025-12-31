"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { RssFeedItem, FeedDetailResponse } from "@/features/rss-feeds/types";

interface FeedItemsListProps {
  feedId: string;
}

export default function FeedItemsList({ feedId }: FeedItemsListProps) {
  const [items, setItems] = useState<RssFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [unschedulingId, setUnschedulingId] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Scheduling state
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [intervalDays, setIntervalDays] = useState(7);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<FeedDetailResponse>(
        `/rss-feeds/${feedId}`
      );
      if (response.success) {
        setItems(response.recentItems || []);
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Failed to load feed items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [feedId]);

  // Available items that can be scheduled
  const availableItems = useMemo(
    () => items.filter((i) => i.status === "initial_sync"),
    [items]
  );

  const handleClearFailed = async () => {
    setClearing(true);
    setClearMessage(null);
    try {
      const result = await apiClient.delete<{
        success: boolean;
        clearedCount: number;
        totalFailed: number;
      }>(`/rss-feeds/${feedId}/clear-failed`);
      const msg =
        result.clearedCount === result.totalFailed
          ? `Cleared ${result.clearedCount} failed items`
          : `Cleared ${result.clearedCount} of ${result.totalFailed} failed items`;
      setClearMessage(msg);
      await fetchItems();
      setTimeout(() => setClearMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to clear failed items:", err);
      setClearMessage(`Error: ${err.message || "Failed to clear items"}`);
    } finally {
      setClearing(false);
    }
  };

  const handleUnschedule = async (itemId: string) => {
    if (!confirm("Unschedule this item? The scheduled post will be deleted.")) {
      return;
    }

    setUnschedulingId(itemId);
    try {
      await apiClient.post(`/rss-feeds/${feedId}/unschedule-item`, { itemId });
      await fetchItems();
    } catch (err: any) {
      console.error("Failed to unschedule item:", err);
      alert(err.message || "Failed to unschedule item");
    } finally {
      setUnschedulingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map((i) => i.id)));
    }
  };

  const handleScheduleSelected = async () => {
    if (selectedIds.size === 0) return;

    const selectedItems = items.filter((i) => selectedIds.has(i.id));

    setScheduling(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";

      await apiClient.post(`/rss-feeds/${feedId}/schedule-items`, {
        items: selectedItems.map((item) => ({
          guid: item.itemGuid,
          title: item.title || "",
          description: item.description || "",
          link: item.itemUrl || "",
          imageUrl: item.imageUrl,
        })),
        startDate: scheduleDate,
        intervalDays,
        timezone,
      });

      setSelectedIds(new Set());
      setClearMessage(`Scheduled ${selectedItems.length} posts`);
      setTimeout(() => setClearMessage(null), 3000);
      await fetchItems();
    } catch (err: any) {
      console.error("Failed to schedule items:", err);
      alert(err.message || "Failed to schedule items");
    } finally {
      setScheduling(false);
    }
  };

  const failedCount = items.filter((i) => i.status === "failed").length;

  const getStatusBadge = (status: RssFeedItem["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Scheduled
          </span>
        );
      case "skipped":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Skipped
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Failed
          </span>
        );
      case "initial_sync":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Available
          </span>
        );
      case "pending":
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            Pending
          </span>
        );
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icon name="FaSpinner" className="animate-spin text-slate-blue" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <Icon name="FaExclamationTriangle" size={16} className="inline mr-2" />
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Icon name="FaFileAlt" size={24} className="mx-auto mb-2 text-gray-300" />
        <p>No items discovered yet</p>
        <p className="text-sm mt-1">Items will appear here after the feed is polled</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          Items ({items.length})
        </h4>
        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <button
              onClick={handleClearFailed}
              disabled={clearing}
              className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {clearing ? (
                <>
                  <Icon name="FaSpinner" size={10} className="inline mr-1 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>Clear {failedCount} failed</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Schedule controls - show when items are available */}
      {availableItems.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.size === availableItems.length && availableItems.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              />
              <span className="text-gray-700">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : `Select all (${availableItems.length})`}
              </span>
            </label>

            {selectedIds.size > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Start:</span>
                  <input
                    type="date"
                    value={scheduleDate}
                    min={minDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="border border-gray-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Every:</span>
                  <select
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(parseInt(e.target.value))}
                    className="border border-gray-300 px-2 py-1 rounded text-sm"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                  </select>
                </div>
                <button
                  onClick={handleScheduleSelected}
                  disabled={scheduling}
                  className="px-3 py-1 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
                >
                  {scheduling ? (
                    <>
                      <Icon name="FaSpinner" size={12} className="inline mr-1 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>Schedule {selectedIds.size} post{selectedIds.size !== 1 ? "s" : ""}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {clearMessage && (
        <div
          className={`mb-3 px-3 py-2 text-sm rounded-lg ${
            clearMessage.startsWith("Error")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {clearMessage}
        </div>
      )}

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium w-8"></th>
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Published</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.has(item.id) ? "bg-blue-50" : ""}`}>
                <td className="py-3 pr-2">
                  {item.status === "initial_sync" && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                    />
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-2">
                    {item.imageUrl && (
                      <Icon name="FaImage" size={12} className="text-gray-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {item.title || "Untitled"}
                      </p>
                      {item.itemUrl && (
                        <a
                          href={item.itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-blue hover:underline"
                        >
                          View original
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600">{formatDate(item.publishedAt)}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(item.status)}
                    {item.skipReason && item.skipReason !== "first_sync" && item.skipReason !== "reset_sync" && (
                      <span className="text-xs text-gray-500">{item.skipReason.replace(/_/g, " ")}</span>
                    )}
                    {item.errorMessage && (
                      <span className="text-xs text-red-500">{item.errorMessage}</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  {item.status === "scheduled" && (
                    <button
                      onClick={() => handleUnschedule(item.id)}
                      disabled={unschedulingId === item.id}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Unschedule this item"
                    >
                      {unschedulingId === item.id ? (
                        <Icon name="FaSpinner" size={12} className="animate-spin" />
                      ) : (
                        "Unschedule"
                      )}
                    </button>
                  )}
                  {item.scheduledPostId && (
                    <a
                      href="/dashboard/social-posting/scheduled"
                      className="block text-xs text-slate-blue hover:underline"
                    >
                      View post
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
