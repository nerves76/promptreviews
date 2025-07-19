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
  isSaving: boolean;
  formData: any;
  onSave?: () => void;
}

// Top Navigation - Normal positioned button in top right of form area
export function TopNavigation({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) {
  return (
    <div className="absolute top-4 right-4">
      <button
        type="button"
        className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : mode === "create" ? "Save & Continue" : "Save & Continue"}
      </button>
    </div>
  );
}

// Bottom Navigation - Simple save button at bottom right
export function BottomNavigation({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) {
  return (
    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
      <button
        type="button"
        className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : mode === "create" ? "Save & Continue" : "Save & Continue"}
      </button>
    </div>
  );
}

// Default export for backwards compatibility
export default function StepNavigation(props: StepNavigationProps) {
  return (
    <>
      <TopNavigation {...props} />
      <BottomNavigation {...props} />
    </>
  );
} 