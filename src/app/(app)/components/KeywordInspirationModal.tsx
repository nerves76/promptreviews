/**
 * KeywordInspirationModal Component
 *
 * Displays keyword inspiration in a modal with copy buttons.
 * Uses business branding and follows app modal standards with red X close button.
 * Shows up to 10 keywords with individual copy functionality.
 */

"use client";
import React, { useState } from "react";
import Icon from "@/components/Icon";
import { getContrastTextColor } from "@/utils/colorUtils";

interface KeywordInspirationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Selected keywords to display */
  keywords: string[];
  /** Business profile for branding */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
    business_name?: string;
    card_bg?: string;
    card_text?: string;
  };
}

export default function KeywordInspirationModal({
  isOpen,
  onClose,
  keywords,
  businessProfile,
}: KeywordInspirationModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const secondaryColor = businessProfile?.secondary_color || "#4F46E5";
  const hoverTextColor = getContrastTextColor(secondaryColor);

  // Copy keyword to clipboard
  const copyToClipboard = async (keyword: string, index: number) => {
    try {
      await navigator.clipboard.writeText(keyword);
      setCopiedIndex(index);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy keyword:', err);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
      <div
        className="rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] relative animate-slideup shadow-2xl border-2 border-white backdrop-blur-sm"
        style={{ backgroundColor: businessProfile?.card_bg ? `${businessProfile.card_bg}90` : "rgba(255, 255, 255, 0.9)" }}
      >
        {/* Standardized red X close button */}
        <button
          className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
          style={{ width: 48, height: 48 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-200 rounded-t-2xl overflow-hidden">
          <div className="flex items-center space-x-3">
            <Icon
              name="FaLightbulb"
              className="w-6 h-6"
              style={{ color: businessProfile?.primary_color || "#10B981" }}
              size={24}
            />
            <h2
              className="text-xl font-bold"
              style={{
                color: businessProfile?.primary_color || "#10B981",
                fontFamily: businessProfile?.primary_font || "Inter"
              }}
            >
              Keyword Inspiration
            </h2>
          </div>
          <p className="text-sm mt-2" style={{ color: businessProfile?.card_text || "#6B7280" }}>
            Click any keyword below to copy it and use it in your review
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] rounded-b-2xl">
          {keywords.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FaLightbulb" className="w-8 h-8 text-gray-400 mx-auto mb-3" size={32} />
              <p className="text-gray-600">No keywords available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4 border-2 flex items-center justify-between transition-colors"
                  style={{
                    borderColor: businessProfile?.secondary_color || "#4F46E5",
                  }}
                >
                  {/* Keyword Text */}
                  <span
                    className="font-medium flex-1"
                    style={{
                      fontFamily: businessProfile?.primary_font || "Inter",
                      color: businessProfile?.card_text || "#1F2937"
                    }}
                  >
                    {keyword}
                  </span>

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(keyword, index)}
                    className="ml-4 px-3 py-1.5 rounded-md border-2 font-medium text-sm transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:shadow-md"
                    style={{
                      borderColor: copiedIndex === index ? "#10B981" : secondaryColor,
                      backgroundColor: copiedIndex === index ? "#10B981" : "transparent",
                      color: copiedIndex === index ? "#FFFFFF" : secondaryColor,
                      fontFamily: businessProfile?.primary_font || "Inter",
                    }}
                    onMouseEnter={(e) => {
                      if (copiedIndex !== index) {
                        e.currentTarget.style.backgroundColor = secondaryColor;
                        e.currentTarget.style.color = hoverTextColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copiedIndex !== index) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = secondaryColor;
                      }
                    }}
                    aria-label={`Copy ${keyword}`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Icon name="FaCheck" size={16} color="#FFFFFF" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Icon name="FaCopy" size={16} color={secondaryColor} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
