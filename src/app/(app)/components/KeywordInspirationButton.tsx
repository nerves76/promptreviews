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
  const secondaryColor = businessProfile?.secondary_color || "#4F46E5";
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
        <Icon name="FaLightbulb" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={16} />
        <span>Inspiration</span>
      </button>
    </div>
  );
}
