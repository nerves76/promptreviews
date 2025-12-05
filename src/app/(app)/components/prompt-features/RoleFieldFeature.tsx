"use client";
import React from "react";
import Icon from "@/components/Icon";

export interface RoleFieldFeatureProps {
  /** Whether the role field is enabled */
  enabled: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function RoleFieldFeature({
  enabled,
  onEnabledChange,
  disabled = false,
  editMode = false,
}: RoleFieldFeatureProps) {
  const handleToggle = () => {
    onEnabledChange(!enabled);
  };

  return (
    <div className={`${editMode ? 'rounded-lg p-2 sm:p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 sm:px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaBriefcase" className={`${editMode ? 'w-7 h-7 text-slate-blue' : 'text-lg'}`} style={editMode ? undefined : { color: "#334D6E" }} size={editMode ? 28 : 18} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-[#1A237E]' : 'text-lg font-semibold text-gray-900'}`}>
              Role / Occupation Field
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? "bg-slate-blue" : "bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={enabled}
          disabled={disabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="text-sm text-gray-700 max-w-[85ch] px-2">
        Adds context for AI generation and saves to your account, but increases friction. Usually best for targeted outreach campaigns rather than catch-all pages.
      </div>
    </div>
  );
}
