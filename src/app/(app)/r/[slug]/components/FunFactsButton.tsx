/**
 * FunFactsButton Component
 *
 * Button that appears on public prompt pages in the hero card.
 * Only shows when fun facts are enabled AND there is at least 1 fact to display.
 * Opens the FunFactsModal when clicked.
 */

"use client";
import React from "react";
import Icon from "@/components/Icon";
import { getContrastTextColor } from "@/utils/colorUtils";
import { FunFact } from "@/types/funFacts";

interface FunFactsButtonProps {
  /** Array of fun facts to display */
  facts: FunFact[];
  /** Whether the fun facts feature is enabled */
  enabled: boolean;
  /** Business profile for styling */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
  };
  /** Callback when button is clicked */
  onOpenModal: () => void;
}

export default function FunFactsButton({
  facts,
  enabled,
  businessProfile,
  onOpenModal,
}: FunFactsButtonProps) {
  const secondaryColor = businessProfile?.secondary_color || "#2E4A7D";
  const hoverTextColor = getContrastTextColor(secondaryColor);

  // Don't render if feature is disabled or no facts available
  if (!enabled || !facts || facts.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-start">
      <button
        onClick={onOpenModal}
        className="px-3 py-1 border rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-1.5 transition-all duration-200"
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
        aria-label="View fun facts"
      >
        <Icon name="FaLightbulb" size={12} />
        <span>Fun facts</span>
      </button>
    </div>
  );
}
