/**
 * StepNavigation component
 * 
 * Handles step navigation and save/continue buttons for the product form.
 * Supports different modes (create/edit) and steps (1/2) with appropriate button layouts.
 */

"use client";
import React from "react";

interface StepNavigationProps {
  mode: "create" | "edit";
  step: number;
  isSaving: boolean;
  formData: any;
  onSave?: () => void;
  onStepChange?: (step: number) => void;
  onStep1Continue?: () => void;
}

// Top Navigation - Fixed positioned buttons
export function TopNavigation({ 
  mode, 
  step, 
  isSaving, 
  onSave,
  onStep1Continue
}: StepNavigationProps) {
  return (
    <>
      {/* Top right button for create mode step 1 */}
      {mode === "create" && step === 1 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={onStep1Continue}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      )}

      {/* Top right button for create mode step 2 */}
      {mode === "create" && step === 2 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & publish"}
          </button>
        </div>
      )}

      {/* Top right button for edit mode */}
      {mode === "edit" && (
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      )}
    </>
  );
}

// Bottom Navigation - Content flow buttons  
export function BottomNavigation({ 
  mode, 
  step, 
  isSaving, 
  onSave,
  onStepChange,
  onStep1Continue
}: StepNavigationProps) {
  return (
    <>
      {/* Bottom navigation for create mode step 1 */}
      {mode === "create" && step === 1 && (
        <div className="w-full flex justify-end mt-8 pt-4">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={onStep1Continue}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      )}

      {/* Bottom navigation for create mode step 2 */}
      {mode === "create" && step === 2 && (
        <div className="w-full flex justify-between items-center mt-8 pt-4">
          {/* Back button */}
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-slate-blue shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={() => onStepChange?.(1)}
            disabled={isSaving}
          >
            Back
          </button>
          {/* Save & Publish button */}
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & publish"}
          </button>
        </div>
      )}

      {/* Bottom navigation for edit mode - only bottom right button */}
      {mode === "edit" && (
        <div className="w-full flex justify-end mt-8 pt-4">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      )}
    </>
  );
}

// Original combined component for backward compatibility
export default function StepNavigation(props: StepNavigationProps) {
  return (
    <>
      <TopNavigation {...props} />
      <BottomNavigation {...props} />
    </>
  );
} 