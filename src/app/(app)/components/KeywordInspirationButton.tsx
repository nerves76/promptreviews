/**
 * KeywordInspirationButton Component
 *
 * Button that appears on public prompt pages on the left side of the hero area.
 * Only shows when the Keyword Inspiration feature is enabled AND there are keywords selected.
 * Opens the KeywordInspirationModal when clicked.
 */

"use client";
import React from "react";

interface KeywordInspirationButtonProps {
  /** Whether the Keyword Inspiration feature is enabled */
  enabled: boolean;
  /** Selected keywords to display */
  selectedKeywords?: string[];
  /** Business profile for styling */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
  };
  /** Callback when button is clicked */
  onOpenModal: () => void;
}

export default function KeywordInspirationButton({
  enabled,
  selectedKeywords = [],
  businessProfile,
  onOpenModal,
}: KeywordInspirationButtonProps) {
  const hasKeywords = selectedKeywords && selectedKeywords.length > 0;

  // Don't render if feature is disabled or no keywords selected
  if (!enabled || !hasKeywords) {
    return null;
  }

  return (
    <div className="flex justify-start">
      <button
        onClick={onOpenModal}
        className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 font-medium text-xs sm:text-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style={{
          borderColor: businessProfile?.primary_color || "#10B981",
          color: businessProfile?.primary_color || "#10B981",
          backgroundColor: "transparent",
          fontFamily: businessProfile?.primary_font || "Inter",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = businessProfile?.primary_color || "#10B981";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = businessProfile?.primary_color || "#10B981";
        }}
        aria-label="View keyword inspiration"
      >
        <span className="hidden sm:inline">Keyword inspiration</span>
        <span className="sm:hidden">Keywords</span>
      </button>
    </div>
  );
}
