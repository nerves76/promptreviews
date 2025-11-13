import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { StatusLabels } from "@/hooks/useStatusLabels";

interface StatusLabelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLabels: StatusLabels;
  onSave: (labels: StatusLabels) => Promise<boolean>;
}

const MAX_LABEL_LENGTH = 20;

const STATUS_INFO = {
  draft: {
    key: "draft" as const,
    defaultLabel: "Draft",
    description: "Pages that are being created or edited",
  },
  in_queue: {
    key: "in_queue" as const,
    defaultLabel: "In queue",
    description: "Pages ready to be sent to customers",
  },
  sent: {
    key: "sent" as const,
    defaultLabel: "Sent",
    description: "Review requests that have been sent",
  },
  follow_up: {
    key: "follow_up" as const,
    defaultLabel: "Follow up",
    description: "Pages that need a follow-up reminder",
  },
  complete: {
    key: "complete" as const,
    defaultLabel: "Complete",
    description: "Reviews that have been completed",
  },
};

export default function StatusLabelEditor({
  isOpen,
  onClose,
  currentLabels,
  onSave,
}: StatusLabelEditorProps) {
  const [labels, setLabels] = useState<StatusLabels>(currentLabels);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabels(currentLabels);
      setError(null);
    }
  }, [isOpen, currentLabels]);

  const handleLabelChange = (status: keyof StatusLabels, value: string) => {
    setLabels((prev) => ({ ...prev, [status]: value }));
    setError(null);
  };

  const handleSave = async () => {
    // Validate labels
    for (const [key, label] of Object.entries(labels)) {
      if (!label || label.trim().length === 0) {
        setError(`Label for ${STATUS_INFO[key as keyof StatusLabels].defaultLabel} cannot be empty`);
        return;
      }
      if (label.length > MAX_LABEL_LENGTH) {
        setError(
          `Label for ${STATUS_INFO[key as keyof StatusLabels].defaultLabel} is too long (max ${MAX_LABEL_LENGTH} characters)`
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
    const defaultLabels: StatusLabels = {
      draft: "Draft",
      in_queue: "In queue",
      sent: "Sent",
      follow_up: "Follow up",
      complete: "Complete",
    };
    setLabels(defaultLabels);
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
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <Icon name="FaTimes" size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {Object.entries(STATUS_INFO).map(([key, info]) => {
            const typedKey = key as keyof StatusLabels;
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
                  maxLength={MAX_LABEL_LENGTH + 5} // Allow typing a bit over to show error
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
