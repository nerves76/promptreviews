"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { BrowseFeedItem } from "@/app/(app)/api/rss-feeds/[id]/browse/route";

interface BrowseFeedModalProps {
  feedId: string;
  feedName: string;
  onClose: () => void;
  onScheduled: () => void;
}

interface BrowseResponse {
  success: boolean;
  feedName: string;
  items: BrowseFeedItem[];
}

interface ScheduleResponse {
  success: boolean;
  scheduledCount: number;
  posts: Array<{ guid: string; postId: string; scheduledDate: string }>;
  errors?: Array<{ guid: string; error: string }>;
}

export default function BrowseFeedModal({
  feedId,
  feedName,
  onClose,
  onScheduled,
}: BrowseFeedModalProps) {
  // Items state
  const [items, setItems] = useState<BrowseFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedGuids, setSelectedGuids] = useState<Set<string>>(new Set());

  // Schedule settings
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [intervalDays, setIntervalDays] = useState(7); // Default weekly
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/Los_Angeles";
    }
  });

  // Scheduling state
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Fetch items on mount
  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await apiClient.get<BrowseResponse>(
          `/rss-feeds/${feedId}/browse`
        );
        if (response.success) {
          setItems(response.items);
        } else {
          setError("Failed to load feed items");
        }
      } catch (err) {
        console.error("Failed to fetch feed items:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load feed items"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [feedId]);

  // Calculate scheduled dates for preview
  const scheduledDates = useMemo(() => {
    const dates: string[] = [];
    const selectedItems = items.filter((item) => selectedGuids.has(item.guid));

    for (let i = 0; i < selectedItems.length; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + intervalDays * i);
      dates.push(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );
    }
    return dates;
  }, [selectedGuids, startDate, intervalDays, items]);

  // Toggle item selection
  const toggleItem = (guid: string) => {
    const newSelected = new Set(selectedGuids);
    if (newSelected.has(guid)) {
      newSelected.delete(guid);
    } else {
      newSelected.add(guid);
    }
    setSelectedGuids(newSelected);
  };

  // Select all / none
  const toggleSelectAll = () => {
    if (selectedGuids.size === items.length) {
      setSelectedGuids(new Set());
    } else {
      setSelectedGuids(new Set(items.map((item) => item.guid)));
    }
  };

  // Handle scheduling
  const handleSchedule = async () => {
    if (selectedGuids.size === 0) return;

    setScheduling(true);
    setScheduleError(null);

    try {
      const selectedItems = items.filter((item) =>
        selectedGuids.has(item.guid)
      );

      const response = await apiClient.post<ScheduleResponse>(
        `/rss-feeds/${feedId}/schedule-items`,
        {
          items: selectedItems.map((item) => ({
            guid: item.guid,
            title: item.title,
            description: item.description,
            link: item.link,
            imageUrl: item.imageUrl,
          })),
          startDate,
          intervalDays,
          timezone,
        }
      );

      if (response.success) {
        onScheduled();
        onClose();
      } else {
        setScheduleError("Failed to schedule items");
      }
    } catch (err) {
      console.error("Failed to schedule items:", err);
      setScheduleError(
        err instanceof Error ? err.message : "Failed to schedule items"
      );
    } finally {
      setScheduling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get minimum date (tomorrow)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Browse: {feedName}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Icon name="FaTimes" size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Icon
                  name="FaSpinner"
                  className="animate-spin text-slate-blue"
                  size={24}
                />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No items found in this feed
              </div>
            ) : (
              <div className="space-y-6">
                {/* Schedule Settings */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Schedule settings
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={minDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Post every
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={intervalDays}
                          onChange={(e) =>
                            setIntervalDays(parseInt(e.target.value))
                          }
                          className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        >
                          {Array.from({ length: 14 }, (_, i) => i + 1).map(
                            (days) => (
                              <option key={days} value={days}>
                                {days}
                              </option>
                            )
                          )}
                        </select>
                        <span className="text-sm text-gray-600">days</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      >
                        {[
                          "America/New_York",
                          "America/Chicago",
                          "America/Denver",
                          "America/Los_Angeles",
                          "America/Phoenix",
                          "Pacific/Honolulu",
                          "Europe/London",
                          "Europe/Paris",
                          "Asia/Tokyo",
                          "Australia/Sydney",
                        ].map((tz) => (
                          <option key={tz} value={tz}>
                            {tz.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Select All */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGuids.size === items.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                    />
                    <span className="text-sm text-gray-700">
                      Select all ({selectedGuids.size} selected)
                    </span>
                  </label>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                  {items.map((item) => (
                    <label
                      key={item.guid}
                      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedGuids.has(item.guid) ? "bg-blue-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGuids.has(item.guid)}
                        onChange={() => toggleItem(item.guid)}
                        className="mt-1 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.title || "Untitled"}
                        </p>
                        {item.description && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {item.description.substring(0, 150)}
                            {item.description.length > 150 && "..."}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{formatDate(item.publishedAt)}</span>
                          {item.imageUrl && (
                            <span className="flex items-center gap-1">
                              <Icon name="FaImage" size={10} />
                              Image
                            </span>
                          )}
                          {item.alreadyScheduled && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Icon name="FaCheck" size={10} />
                              Already posted
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Schedule Preview */}
                {selectedGuids.size > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedGuids.size}</strong> posts scheduled for:{" "}
                      {scheduledDates.slice(0, 5).join(", ")}
                      {scheduledDates.length > 5 &&
                        ` and ${scheduledDates.length - 5} more`}
                    </p>
                    <p className="text-sm text-amber-700 flex items-center">
                      <Icon name="FaCoins" size={12} className="mr-1.5" />
                      This will use <strong className="mx-1">{selectedGuids.size}</strong> credit{selectedGuids.size !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Schedule Error */}
                {scheduleError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {scheduleError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={scheduling || selectedGuids.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
            >
              {scheduling ? (
                <>
                  <Icon
                    name="FaSpinner"
                    className="inline mr-2 animate-spin"
                    size={14}
                  />
                  Scheduling...
                </>
              ) : (
                `Schedule ${selectedGuids.size} post${selectedGuids.size !== 1 ? "s" : ""} (${selectedGuids.size} credit${selectedGuids.size !== 1 ? "s" : ""})`
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
