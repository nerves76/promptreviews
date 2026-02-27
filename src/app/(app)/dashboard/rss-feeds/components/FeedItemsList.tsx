"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import { Badge } from "@/app/(app)/components/ui/badge";
import { LoadingSpinner } from "@/app/(app)/components/ui/loading-spinner";
import { apiClient } from "@/utils/apiClient";
import { RssFeedItem, FeedDetailResponse } from "@/features/rss-feeds/types";

type SortField = "title" | "publishedAt" | "scheduledDate" | "status";
type SortDirection = "asc" | "desc";

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

  // Inline scheduling state
  const [schedulingItemId, setSchedulingItemId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  const [publishingItemId, setPublishingItemId] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort state - default to most recent first
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Add to queue state
  const [addingToQueue, setAddingToQueue] = useState(false);

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

  // Sorted items for display
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "publishedAt":
          cmp = new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
          break;
        case "scheduledDate":
          cmp = new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [items, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "publishedAt" ? "desc" : "asc");
    }
  };

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

  const handleScheduleSingle = async (itemId: string) => {
    if (!scheduleDate) return;

    setSchedulingInProgress(true);
    try {
      const result = await apiClient.post<{ success: boolean; error?: string }>(
        `/rss-feeds/${feedId}/schedule-single-item`,
        {
          itemId,
          scheduledDate: scheduleDate,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      );

      if (result.success) {
        setSchedulingItemId(null);
        setScheduleDate("");
        setClearMessage("Post scheduled");
        setTimeout(() => setClearMessage(null), 3000);
        await fetchItems();
      } else {
        alert(result.error || "Failed to schedule post");
      }
    } catch (err: any) {
      console.error("Failed to schedule item:", err);
      alert(err.message || "Failed to schedule post");
    } finally {
      setSchedulingInProgress(false);
    }
  };

  const openSchedulePicker = (itemId: string) => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
    setSchedulingItemId(itemId);
  };

  const handlePublishNow = async (itemId: string) => {
    setPublishingItemId(itemId);
    try {
      // Step 1: Schedule for today
      const today = new Date().toISOString().split("T")[0];
      const scheduleResult = await apiClient.post<{
        success: boolean;
        postId?: string;
        error?: string;
      }>(`/rss-feeds/${feedId}/schedule-single-item`, {
        itemId,
        scheduledDate: today,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (!scheduleResult.success || !scheduleResult.postId) {
        alert(scheduleResult.error || "Failed to create post");
        return;
      }

      // Step 2: Trigger immediate processing
      const processResult = await apiClient.post<{
        success: boolean;
        postStatus?: string;
        error?: string;
      }>("/social-posting/process-now", {
        postId: scheduleResult.postId,
      });

      if (processResult.success) {
        const status = processResult.postStatus;
        if (status === "completed") {
          setClearMessage("Post published successfully");
        } else if (status === "failed") {
          setClearMessage("Error: Post failed to publish. Check your GBP connection.");
        } else {
          setClearMessage(`Post status: ${status}`);
        }
      } else {
        setClearMessage(`Error: ${processResult.error || "Failed to publish"}`);
      }
      setTimeout(() => setClearMessage(null), 5000);
      await fetchItems();
    } catch (err: any) {
      console.error("Failed to publish item:", err);
      alert(err.message || "Failed to publish post");
    } finally {
      setPublishingItemId(null);
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

  const handleAddToQueue = async () => {
    if (selectedIds.size === 0) return;

    setAddingToQueue(true);
    try {
      const result = await apiClient.post<{
        success: boolean;
        data?: {
          addedCount: number;
          skippedCount: number;
          failedCount: number;
        };
        error?: string;
      }>("/social-posting/queue/add-from-rss", {
        feedId,
        items: Array.from(selectedIds).map((id) => ({ itemId: id })),
      });

      if (result.success && result.data) {
        setSelectedIds(new Set());
        const { addedCount, skippedCount } = result.data;
        if (skippedCount > 0) {
          setClearMessage(`Added ${addedCount} to queue (${skippedCount} already in queue)`);
        } else {
          setClearMessage(`Added ${addedCount} to queue`);
        }
        setTimeout(() => setClearMessage(null), 3000);
        await fetchItems();
      } else {
        alert(result.error || "Failed to add to queue");
      }
    } catch (err: any) {
      console.error("Failed to add to queue:", err);
      alert(err.message || "Failed to add to queue");
    } finally {
      setAddingToQueue(false);
    }
  };

  const failedCount = items.filter((i) => i.status === "failed").length;

  const getStatusBadge = (status: RssFeedItem["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="success" size="sm">Scheduled</Badge>;
      case "queued":
        return <Badge variant="info" size="sm">In queue</Badge>;
      case "skipped":
        return <Badge variant="warning" size="sm">Skipped</Badge>;
      case "failed":
        return <Badge variant="error" size="sm">Failed</Badge>;
      case "initial_sync":
        return <Badge variant="info" size="sm">Available</Badge>;
      case "pending":
      default:
        return <Badge size="sm">Pending</Badge>;
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

  const formatScheduledDate = (date: string | null) => {
    if (!date) return "—";
    // scheduled_date is YYYY-MM-DD, parse as local date to avoid timezone shift
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" className="text-slate-blue" />
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

      {/* Add to queue controls - show when items are available */}
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
                <button
                  onClick={handleAddToQueue}
                  disabled={addingToQueue}
                  className="px-3 py-1 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
                >
                  {addingToQueue ? (
                    <>
                      <Icon name="FaSpinner" size={12} className="inline mr-1 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Icon name="FaPlus" size={12} className="inline mr-1" />
                      Add to queue
                    </>
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
              <SortableHeader field="title" label="Title" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="publishedAt" label="Published" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="scheduledDate" label="Scheduled for" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map((item) => (
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
                      <Icon name="FaImage" size={12} className="text-gray-500 mt-1 flex-shrink-0" />
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
                <td className="py-3 pr-4 text-gray-600">
                  {item.scheduledDate ? formatScheduledDate(item.scheduledDate) : "—"}
                </td>
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
                  {/* Inline date picker when scheduling */}
                  {schedulingItemId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
                      />
                      <button
                        onClick={() => handleScheduleSingle(item.id)}
                        disabled={schedulingInProgress || !scheduleDate}
                        className="px-2 py-1 text-xs font-medium text-white bg-slate-blue rounded hover:bg-slate-blue/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {schedulingInProgress ? (
                          <Icon name="FaSpinner" size={10} className="animate-spin" />
                        ) : (
                          <Icon name="FaCheck" size={10} />
                        )}
                      </button>
                      <button
                        onClick={() => { setSchedulingItemId(null); setScheduleDate(""); }}
                        className="px-1 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Icon name="FaTimes" size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {/* Action buttons for available/queued items */}
                      {(item.status === "initial_sync" || item.status === "queued") && (
                        <>
                          <button
                            onClick={() => handlePublishNow(item.id)}
                            disabled={publishingItemId === item.id}
                            className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {publishingItemId === item.id ? (
                              <>
                                <Icon name="FaSpinner" size={10} className="inline mr-1 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <Icon name="FaRocket" size={10} className="inline mr-1" />
                                Publish now
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openSchedulePicker(item.id)}
                            disabled={publishingItemId === item.id}
                            className="px-2 py-1 text-xs font-medium text-slate-blue border border-slate-blue/30 hover:bg-slate-blue/10 rounded transition-colors whitespace-nowrap"
                          >
                            <Icon name="FaCalendarAlt" size={10} className="inline mr-1" />
                            Schedule
                          </button>
                        </>
                      )}
                      {/* Unschedule/remove for scheduled/queued items */}
                      {(item.status === "scheduled" || item.status === "queued") && (
                        <button
                          onClick={() => handleUnschedule(item.id)}
                          disabled={unschedulingId === item.id}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                          title={item.status === "queued" ? "Remove from queue" : "Unschedule this item"}
                        >
                          {unschedulingId === item.id ? (
                            <Icon name="FaSpinner" size={12} className="animate-spin" />
                          ) : item.status === "queued" ? (
                            "Remove"
                          ) : (
                            "Unschedule"
                          )}
                        </button>
                      )}
                      {/* View link for scheduled items */}
                      {item.scheduledPostId && item.status === "scheduled" && (
                        <a
                          href="/dashboard/social-posting"
                          className="text-xs text-slate-blue hover:underline whitespace-nowrap"
                        >
                          View in queue
                        </a>
                      )}
                    </div>
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

function SortableHeader({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <th className="pb-2 font-medium">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span className="inline-flex flex-col text-[8px] leading-none">
          <Icon
            name="FaChevronUp"
            size={8}
            className={isActive && sortDirection === "asc" ? "text-slate-blue" : "text-gray-300"}
          />
          <Icon
            name="FaChevronDown"
            size={8}
            className={isActive && sortDirection === "desc" ? "text-slate-blue" : "text-gray-300"}
          />
        </span>
      </button>
    </th>
  );
}
