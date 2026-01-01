"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface BulkSchedulerProps {
  selectedCount: number;
  selectedIds: string[];
  onScheduleComplete: () => void;
  onError: (message: string) => void;
}

interface ScheduleAssignment {
  postId: string;
  assignedDate: string;
  skippedDates?: string[];
}

interface BulkScheduleResponse {
  success: boolean;
  data?: {
    scheduledCount: number;
    assignments: ScheduleAssignment[];
    creditsUsed: number;
  };
  error?: string;
}

const INTERVAL_OPTIONS = [
  { value: 1, label: "Every day" },
  { value: 2, label: "Every 2 days" },
  { value: 3, label: "Every 3 days" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Every 2 weeks" },
];

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BulkScheduler({
  selectedCount,
  selectedIds,
  onScheduleComplete,
  onError,
}: BulkSchedulerProps) {
  const [startDate, setStartDate] = useState(getTodayString());
  const [intervalDays, setIntervalDays] = useState(7);
  const [isScheduling, setIsScheduling] = useState(false);
  const [previewDates, setPreviewDates] = useState<string[]>([]);

  // Update preview dates when selection or settings change
  useEffect(() => {
    const dates: string[] = [];
    let currentDate = startDate;

    for (let i = 0; i < selectedCount; i++) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, intervalDays);
    }

    setPreviewDates(dates);
  }, [selectedCount, startDate, intervalDays]);

  const handleSchedule = async () => {
    if (selectedIds.length === 0) {
      onError("No items selected");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await apiClient.post<BulkScheduleResponse>(
        "/social-posting/scheduled/bulk-schedule",
        {
          postIds: selectedIds,
          startDate,
          intervalDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          skipConflicts: true,
        }
      );

      if (response.success && response.data) {
        onScheduleComplete();
      } else {
        onError(response.error || "Failed to schedule posts");
      }
    } catch (err) {
      console.error("Failed to bulk schedule:", err);
      onError("Failed to schedule posts");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="font-medium text-gray-900 mb-4">
        Schedule {selectedCount} selected {selectedCount === 1 ? "post" : "posts"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Start date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            min={getTodayString()}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-blue focus:border-slate-blue text-sm"
          />
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interval
          </label>
          <select
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-blue focus:border-slate-blue text-sm"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Schedule button */}
        <div className="flex items-end">
          <button
            onClick={handleSchedule}
            disabled={isScheduling || selectedIds.length === 0}
            className="w-full px-4 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isScheduling ? (
              <>
                <Icon name="FaSpinner" size={14} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Icon name="FaCalendarAlt" size={14} />
                Schedule {selectedCount}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Preview: </span>
        {previewDates.slice(0, 5).map((date, index) => (
          <span key={date}>
            {index > 0 && ", "}
            {formatDate(date)}
          </span>
        ))}
        {previewDates.length > 5 && (
          <span className="text-gray-500">
            {" "}
            +{previewDates.length - 5} more
          </span>
        )}
      </div>

      {/* Credit cost notice */}
      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
        <Icon name="FaCoins" size={12} />
        {selectedCount} credit{selectedCount !== 1 ? "s" : ""} will be used
      </div>
    </div>
  );
}
