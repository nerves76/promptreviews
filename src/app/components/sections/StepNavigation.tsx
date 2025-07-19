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
}

// Top Navigation - Positioned higher within the page card like other site buttons
export const TopNavigation = React.memo(({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) => {
  const handleClick = () => {
    if (isSaving) {
      console.log("🔘 TopNavigation: Save in progress, button disabled");
      return;
    }
    console.log("🔘 TopNavigation: Button clicked");
    onSave?.();
  };

  return (
    <div className="absolute top-6 right-6">
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

// Bottom Navigation - Normal positioned button in bottom right
export const BottomNavigation = React.memo(({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) => {
  const handleClick = () => {
    if (isSaving) {
      console.log("🔘 BottomNavigation: Save in progress, button disabled");
      return;
    }
    console.log("🔘 BottomNavigation: Button clicked");
    onSave?.();
  };

  return (
    <div className="flex justify-end pt-6">
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

// Default export for backwards compatibility
export default function StepNavigation(props: StepNavigationProps) {
  return (
    <>
      <TopNavigation {...props} />
      <BottomNavigation {...props} />
    </>
  );
} 