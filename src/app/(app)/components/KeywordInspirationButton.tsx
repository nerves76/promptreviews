/**
 * KeywordInspirationButton Component
 *
 * Button that appears on public prompt pages on the left side of the hero area.
 * Only shows when the Keyword Inspiration feature is enabled AND there are keywords selected.
 * Opens the KeywordInspirationModal when clicked.
 */

"use client";
import React from "react";
import Icon from "@/components/Icon";
import { getContrastTextColor } from "@/utils/colorUtils";

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
  const secondaryColor = businessProfile?.secondary_color || "#2E4A7D";
  const hoverTextColor = getContrastTextColor(secondaryColor);

  // Don't render if feature is disabled or no keywords selected
  if (!enabled || !hasKeywords) {
    return null;
  }

  return (
    <div className="flex justify-start">
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 font-medium text-xs sm:text-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style={{
          borderColor: secondaryColor,
          color: secondaryColor,
          backgroundColor: "transparent",
          fontFamily: businessProfile?.primary_font || "Inter",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = secondaryColor;
          e.currentTarget.style.color = hoverTextColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = secondaryColor;
        }}
        aria-label="View keyword inspiration"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Suggested phrases</span>
      </button>
    </div>
  );
}
