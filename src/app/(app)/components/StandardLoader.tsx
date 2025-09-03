"use client";

/**
 * StandardLoader Component
 * 
 * Centralized loading component that standardizes all loading states across the app.
 * Single source of truth for all page loading states.
 * 
 * Features:
 * - Always shows FiveStarSpinner
 * - Always positions 250px from top (accounting for nav height)
 * - Always uses white "Loading..." text
 * - Supports full-page and inline modes
 * - Prevents multiple spinners on same page
 * - Consistent styling across app
 * 
 * @param isLoading - Boolean to show/hide the loader
 * @param mode - "fullPage" for fixed positioning with gradient background, "inline" for relative positioning
 */

import FiveStarSpinner from "./FiveStarSpinner";

interface StandardLoaderProps {
  isLoading: boolean;
  mode?: "fullPage" | "inline";
}

export default function StandardLoader({ 
  isLoading, 
  mode = "fullPage" 
}: StandardLoaderProps) {
  if (!isLoading) {
    return null;
  }

  if (mode === "inline") {
    return (
      <div className="relative flex flex-col items-center justify-center" style={{ paddingTop: "250px" }}>
        <FiveStarSpinner size={18} />
        <div className="mt-4 text-base text-white font-medium">Loading...</div>
      </div>
    );
  }

  // Full-page mode
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-gradient-to-br from-blue-600 to-indigo-800"
      style={{ paddingTop: "250px" }}
    >
      <FiveStarSpinner size={18} />
      <div className="mt-4 text-base text-white font-medium">Loading...</div>
    </div>
  );
}