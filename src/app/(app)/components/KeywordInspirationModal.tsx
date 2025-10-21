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
import { getContrastTextColor, applyCardTransparency } from "@/utils/colorUtils";

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
    card_transparency?: number;
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
        className="rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] relative animate-slideup shadow-2xl border-2 border-white backdrop-blur-sm"
        style={{
          backgroundColor: applyCardTransparency(
            businessProfile?.card_bg || "#FFFFFF",
            businessProfile?.card_transparency ?? 0.95
          )
        }}
      >
        {/* Standardized red X close button */}
        <button
          className="absolute -top-3 -right-3 border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
          style={{
            width: 48,
            height: 48,
            backgroundColor: applyCardTransparency(
              businessProfile?.card_bg || "#FFFFFF",
              businessProfile?.card_transparency ?? 0.95
            )
          }}
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
              name="FaSparkles"
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
              Keyword inspiration
            </h2>
          </div>
          <p className="text-sm mt-2" style={{
            color: businessProfile?.card_text || "#6B7280",
            fontFamily: businessProfile?.primary_font || "Inter"
          }}>
            Click any keyword phrase below to copy it and use it in your review. This will help us get found online!
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] rounded-b-2xl">
          {keywords.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FaSparkles" className="w-8 h-8 text-gray-400 mx-auto mb-3" size={32} />
              <p className="text-gray-600" style={{ fontFamily: businessProfile?.primary_font || "Inter" }}>No keywords available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="rounded-lg p-3 border-2 flex items-center justify-between transition-colors"
                  style={{
                    borderColor: businessProfile?.secondary_color || "#4F46E5",
                  }}
                >
                  {/* Keyword Text */}
                  <span
                    className="font-medium flex-1 text-sm"
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
                    className="ml-3 px-2.5 py-1.5 rounded-md border-2 font-medium text-xs transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:shadow-md"
                    style={{
                      borderColor: copiedIndex === index ? "#6EE7B7" : secondaryColor,
                      backgroundColor: copiedIndex === index ? "#6EE7B7" : "transparent",
                      color: copiedIndex === index ? "#065F46" : secondaryColor,
                      fontFamily: businessProfile?.primary_font || "Inter",
                    }}
                    aria-label={`Copy ${keyword}`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
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
