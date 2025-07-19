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

export default function StepNavigation({ 
  mode, 
  step, 
  isSaving, 
  formData,
  onSave,
  onStepChange,
  onStep1Continue
}: StepNavigationProps) {

  return (
    <>
      {/* Top right buttons - ONLY for create mode */}
      {mode === "create" && step === 1 && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
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

      {/* Top right button for Save & Publish (create step 2 only) */}
      {mode === "create" && step === 2 && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & publish"}
          </button>
        </div>
      )}

      {/* Bottom navigation for step 1 */}
      {(mode === "create" && step === 1) && (
        <div className="w-full flex justify-end gap-2 mt-8">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={onStep1Continue}
            disabled={isSaving}
          >
            Save & Continue
          </button>
        </div>
      )}

      {/* Bottom navigation for step 2 */}
      {(mode === "create" && step === 2) && (
        <div className="w-full flex justify-between items-center pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
          {/* Bottom left Back button */}
          <div>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-slate-blue shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              onClick={() => onStepChange?.(1)}
              disabled={isSaving}
            >
              Back
            </button>
          </div>
          {/* Bottom right Save & Publish button (removed View button) */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isSaving}
            >
              {isSaving ? "Publishing..." : "Save & publish"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom navigation for edit mode - ONLY bottom right button */}
      {mode === "edit" && (
        <div className="w-full flex justify-end items-center pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
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