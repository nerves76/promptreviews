"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { WMStatusLabels, DEFAULT_WM_STATUS_LABELS } from "@/types/workManager";

interface WMStatusLabelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLabels: WMStatusLabels;
  onSave: (labels: WMStatusLabels) => Promise<boolean>;
}

const MAX_LABEL_LENGTH = 20;

const STATUS_INFO = {
  backlog: {
    key: "backlog" as const,
    defaultLabel: "Backlog",
    description: "Tasks that are planned but not yet started",
  },
  todo: {
    key: "todo" as const,
    defaultLabel: "To Do",
    description: "Tasks ready to be worked on",
  },
  in_progress: {
    key: "in_progress" as const,
    defaultLabel: "In Progress",
    description: "Tasks currently being worked on",
  },
  review: {
    key: "review" as const,
    defaultLabel: "Review",
    description: "Tasks awaiting review or approval",
  },
  done: {
    key: "done" as const,
    defaultLabel: "Done",
    description: "Completed tasks",
  },
};

export default function WMStatusLabelEditor({
  isOpen,
  onClose,
  currentLabels,
  onSave,
}: WMStatusLabelEditorProps) {
  const [labels, setLabels] = useState<WMStatusLabels>(currentLabels);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabels(currentLabels);
      setError(null);
    }
  }, [isOpen, currentLabels]);

  const handleLabelChange = (status: keyof WMStatusLabels, value: string) => {
    setLabels((prev) => ({ ...prev, [status]: value }));
    setError(null);
  };

  const handleSave = async () => {
    // Validate labels
    for (const [key, label] of Object.entries(labels)) {
      if (!label || label.trim().length === 0) {
        setError(`Label for ${STATUS_INFO[key as keyof WMStatusLabels].defaultLabel} cannot be empty`);
        return;
      }
      if (label.length > MAX_LABEL_LENGTH) {
        setError(
          `Label for ${STATUS_INFO[key as keyof WMStatusLabels].defaultLabel} is too long (max ${MAX_LABEL_LENGTH} characters)`
        );
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    const success = await onSave(labels);

    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError("Failed to save labels. Please try again.");
    }
  };

  const handleReset = () => {
    setLabels(DEFAULT_WM_STATUS_LABELS);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-blue">
                Customize Status Labels
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Rename the status columns to match your workflow
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <Icon name="FaTimes" size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {Object.entries(STATUS_INFO).map(([key, info]) => {
            const typedKey = key as keyof WMStatusLabels;
            const currentValue = labels[typedKey] || "";
            const charCount = currentValue.length;
            const isOverLimit = charCount > MAX_LABEL_LENGTH;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={`label-${key}`} className="text-sm font-medium text-gray-700">
                    {info.defaultLabel}
                  </label>
                  <span
                    className={`text-xs ${
                      isOverLimit ? "text-red-600 font-medium" : "text-gray-500"
                    }`}
                  >
                    {charCount}/{MAX_LABEL_LENGTH}
                  </span>
                </div>
                <input
                  id={`label-${key}`}
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleLabelChange(typedKey, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue ${
                    isOverLimit ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={info.defaultLabel}
                  maxLength={MAX_LABEL_LENGTH + 5}
                />
                <p className="text-xs text-gray-500">{info.description}</p>
              </div>
            );
          })}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <Icon name="FaExclamationTriangle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              {isSaving && (
                <Icon name="FaSpinner" size={16} className="animate-spin" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
