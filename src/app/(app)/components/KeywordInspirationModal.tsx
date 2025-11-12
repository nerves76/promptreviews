/**
 * KeywordInspirationModal Component
 *
 * Displays keyword inspiration in a draggable modal with copy buttons.
 * Uses business branding and follows app modal standards with red X close button.
 * Shows up to 10 keywords with individual copy functionality.
 * The modal can be moved by clicking and dragging the header.
 */

"use client";
import React, { useState } from "react";
import Icon from "@/components/Icon";
import { getContrastTextColor, applyCardTransparency } from "@/utils/colorUtils";
import { DraggableModal } from "@/app/(app)/dashboard/widget/components/DraggableModal";

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

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <Icon name="mushroom" className="w-5 h-5 text-slate-300" size={20} />
          <span>Keyword Power-ups</span>
        </div>
      }
      maxWidth="max-w-lg"
      opaqueBody={true}
      lightBackdrop={true}
    >
      {/* Subheader */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Power-up your review with keywords
        </h3>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Help {businessProfile?.business_name || 'us'} show up online by including one or more of these suggested keyword phrases. You can also edit them once they have been added below.
        </p>
      </div>

      {/* Modal Content */}
      <div className="overflow-y-auto max-h-[60vh]">
        {keywords.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="mushroom" className="w-8 h-8 text-gray-400 mx-auto mb-3" size={32} />
            <p className="text-gray-700">No keywords available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keywords.map((keyword, index) => (
              <div
                key={index}
                className="rounded-lg p-3 border flex items-center justify-between transition-colors bg-white"
                style={{
                  borderColor: businessProfile?.secondary_color || "#4F46E5",
                }}
              >
                {/* Keyword Text */}
                <span
                  className="font-medium flex-1 text-sm text-gray-800"
                  style={{
                    fontFamily: businessProfile?.primary_font || "Inter",
                  }}
                >
                  {keyword}
                </span>

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(keyword, index)}
                  className="ml-3 px-2.5 py-1.5 rounded-md border font-medium text-xs transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:shadow-md"
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
    </DraggableModal>
  );
}
