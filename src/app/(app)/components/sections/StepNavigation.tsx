/**
 * StepNavigation component
 * 
 * Handles navigation and save buttons for the product form.
 * Simplified to single-step since all modules are now on one page.
 */

"use client";
import React from "react";

interface StepNavigationProps {
  mode: "create" | "edit";
  isSaving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

// Top Navigation - Positioned higher within the page card like other site buttons
export const TopNavigation = React.memo(function TopNavigation({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) {
  const handleClick = () => {
    if (isSaving) {
      return;
    }
    onSave?.();
  };

  return (
    <div className="flex-shrink-0">
      <button
        type="button"
        disabled={isSaving}
        onClick={handleClick}
        className={`inline-flex items-center justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 transition-all duration-200 ${
          isSaving
            ? "bg-slate-blue/70 cursor-not-allowed"
            : "bg-slate-blue hover:bg-slate-blue/90"
        }`}
      >
        {isSaving && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isSaving ? "Saving . . ." : "Save & Publish"}
      </button>
    </div>
  );
});

// Bottom Navigation - Cancel button on left, Save button on right
export const BottomNavigation = React.memo(function BottomNavigation({ 
  mode, 
  isSaving, 
  onSave,
  onCancel
}: StepNavigationProps) {
  const handleSave = () => {
    if (isSaving) {
      return;
    }
    onSave?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="flex justify-between pt-6">
      {/* Cancel Button */}
      <button
        type="button"
        onClick={handleCancel}
        className="inline-flex items-center justify-center rounded-md border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 transition-all duration-200"
      >
        Cancel
      </button>

      {/* Save Button */}
      <button
        type="button"
        disabled={isSaving}
        onClick={handleSave}
        className={`inline-flex items-center justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 transition-all duration-200 ${
          isSaving
            ? "bg-slate-blue/70 cursor-not-allowed"
            : "bg-slate-blue hover:bg-slate-blue/90"
        }`}
      >
        {isSaving && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isSaving ? "Saving . . ." : "Save & Publish"}
      </button>
    </div>
  );
});

// Default export for backwards compatibility
export default function StepNavigation(props: StepNavigationProps) {
  return (
    <>
      <TopNavigation {...props} />
      <BottomNavigation {...props} />
    </>
  );
} 