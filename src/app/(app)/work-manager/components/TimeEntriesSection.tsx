"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { WMTimeEntry, formatTimeEstimate } from "@/types/workManager";

interface TimeEntriesSectionProps {
  entries: WMTimeEntry[];
  taskId: string;
  onEntriesChanged: () => void;
  readOnly?: boolean;
  totalOnly?: boolean;
  currentUserId?: string;
}

export default function TimeEntriesSection({
  entries,
  taskId,
  onEntriesChanged,
  readOnly = false,
  totalOnly = false,
  currentUserId,
}: TimeEntriesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);

  const handleAdd = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalDuration = h * 60 + m;

    if (totalDuration <= 0) {
      setError("Duration must be greater than 0");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post("/work-manager/time-entries", {
        task_id: taskId,
        duration_minutes: totalDuration,
        entry_date: entryDate,
        note: note.trim() || undefined,
      });

      setHours("");
      setMinutes("");
      setNote("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setIsAdding(false);
      onEntriesChanged();
    } catch (err: any) {
      console.error("Failed to add time entry:", err);
      setError(err.message || "Failed to add time entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await apiClient.delete(`/work-manager/time-entries?entryId=${entryId}`);
      onEntriesChanged();
    } catch (err: any) {
      console.error("Failed to delete time entry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setHours("");
    setMinutes("");
    setNote("");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setIsAdding(false);
    setError(null);
  };

  // Total-only mode: just show the aggregate
  if (totalOnly) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="FaClock" size={14} className="text-gray-500" />
          Time spent
        </h4>
        {totalMinutes > 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Icon name="FaCheck" size={12} />
            <span className="font-medium">{formatTimeEstimate(totalMinutes)}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time logged</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="FaClock" size={14} className="text-gray-500" />
          Time spent
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
              {formatTimeEstimate(totalMinutes)}
            </span>
          )}
        </h4>
        {!readOnly && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-slate-blue hover:text-slate-blue/80 font-medium flex items-center gap-1"
          >
            <Icon name="FaPlus" size={12} />
            Log time
          </button>
        )}
      </div>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const creatorName = entry.creator
              ? `${entry.creator.first_name || ""} ${entry.creator.last_name || ""}`.trim() || entry.creator.email
              : null;
            const canDelete = currentUserId && entry.created_by === currentUserId;

            return (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded-lg group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">
                      {formatTimeEstimate(entry.duration_minutes)}
                    </span>
                    <span className="text-gray-500">
                      {format(new Date(entry.entry_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{entry.note}</p>
                  )}
                  {creatorName && (
                    <p className="text-xs text-gray-500 mt-0.5">{creatorName}</p>
                  )}
                </div>
                {!readOnly && canDelete && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label="Delete time entry"
                  >
                    {deletingId === entry.id ? (
                      <Icon name="FaSpinner" size={14} className="animate-spin" />
                    ) : (
                      <Icon name="FaTimes" size={14} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div className="space-y-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={99}
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                className="w-14 px-2 py-2 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-slate-blue"
                aria-label="Hours"
                autoFocus
              />
              <span className="text-sm text-gray-500">h</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                className="w-14 px-2 py-2 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-slate-blue"
                aria-label="Minutes"
              />
              <span className="text-sm text-gray-500">m</span>
            </div>
          </div>

          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            aria-label="Entry date"
          />

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue"
            aria-label="Note"
          />

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <Icon name="FaExclamationTriangle" size={12} />
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSaving && <Icon name="FaSpinner" size={12} className="animate-spin" />}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 italic">No time logged yet</p>
      )}
    </div>
  );
}
