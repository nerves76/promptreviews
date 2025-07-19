/**
 * StepNavigation component
 * 
 * Handles navigation and save buttons for the product form.
 * Simplified to single-step since all modules are now on one page.
 */

"use client";
import React, { useRef } from "react";

interface StepNavigationProps {
  mode: "create" | "edit";
  isSaving?: boolean;
  onSave?: () => void;
}

// Top Navigation - Normal positioned button in top right of form area
export const TopNavigation = React.memo(({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) => {
  const lastClickRef = useRef<number>(0);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Throttle clicks - prevent clicks within 2 seconds of each other
    const now = Date.now();
    if (now - lastClickRef.current < 2000) {
      console.log("TopNavigation: Click throttled - too soon after last click");
      return;
    }
    lastClickRef.current = now;
    
    if (isSaving) {
      console.log("TopNavigation: Save already in progress, ignoring click");
      return;
    }
    
    console.log("TopNavigation: Triggering save operation");
    onSave?.();
  };

  return (
    <div className="absolute top-4 right-4">
      <button
        type="button"
        className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${
          isSaving 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-slate-blue hover:bg-slate-blue/90'
        }`}
        onClick={handleClick}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save & Publish"}
      </button>
    </div>
  );
});

TopNavigation.displayName = 'TopNavigation';

// Bottom Navigation - Simple save button at bottom right
export const BottomNavigation = React.memo(({ 
  mode, 
  isSaving, 
  onSave
}: StepNavigationProps) => {
  const lastClickRef = useRef<number>(0);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Throttle clicks - prevent clicks within 2 seconds of each other
    const now = Date.now();
    if (now - lastClickRef.current < 2000) {
      console.log("BottomNavigation: Click throttled - too soon after last click");
      return;
    }
    lastClickRef.current = now;
    
    if (isSaving) {
      console.log("BottomNavigation: Save already in progress, ignoring click");
      return;
    }
    
    console.log("BottomNavigation: Triggering save operation");
    onSave?.();
  };

  return (
    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
      <button
        type="button"
        className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${
          isSaving 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-slate-blue hover:bg-slate-blue/90'
        }`}
        onClick={handleClick}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save & Publish"}
      </button>
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

// Default export for backwards compatibility
export default function StepNavigation(props: StepNavigationProps) {
  return (
    <>
      <TopNavigation {...props} />
      <BottomNavigation {...props} />
    </>
  );
} 