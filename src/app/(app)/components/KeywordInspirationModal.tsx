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
  /** Current review text */
  reviewText?: string;
  /** Function to update review text */
  onAddKeyword?: (keyword: string) => void;
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
  reviewText,
  onAddKeyword,
  businessProfile,
}: KeywordInspirationModalProps) {
  const [addedIndex, setAddedIndex] = useState<number | null>(null);
  const secondaryColor = businessProfile?.secondary_color || "#2E4A7D";
  const hoverTextColor = getContrastTextColor(secondaryColor);

  // Add keyword to review or copy to clipboard as fallback
  const handleAddKeyword = async (keyword: string, index: number) => {
    // If onAddKeyword callback is provided, use it to insert
    if (onAddKeyword) {
      onAddKeyword(keyword);
      setAddedIndex(index);

      // Reset added state after 2 seconds
      setTimeout(() => {
        setAddedIndex(null);
      }, 2000);
    } else {
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(keyword);
        setAddedIndex(index);

        // Reset added state after 2 seconds
        setTimeout(() => {
          setAddedIndex(null);
        }, 2000);
      } catch (err) {
        console.error('Failed to add keyword:', err);
      }
    }
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <svg className="w-7 h-7 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Suggested Phrases Menu</span>
        </div>
      }
      maxWidth="max-w-lg"
      opaqueBody={true}
      lightBackdrop={true}
    >
      {/* Subheader */}
      <div className="mb-3">
        <h3 className="text-2xl font-semibold text-gray-900">
          Add suggested phrases to your review
        </h3>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Help {businessProfile?.business_name || 'us'} show up online by including one or more of these suggested phrases. (You can also edit them once they have been added.)
        </p>
      </div>

      {/* Modal Content */}
      <div className="overflow-y-auto max-h-[60vh]">
        {keywords.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-8 h-8 text-gray-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-700">No phrases available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keywords.map((keyword, index) => (
              <div
                key={index}
                className="rounded-lg p-3 flex items-center justify-between transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
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

                {/* Add Button */}
                <button
                  onClick={() => handleAddKeyword(keyword, index)}
                  className="ml-3 px-2.5 py-1.5 rounded-md border font-medium text-xs transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:shadow-md"
                  style={{
                    borderColor: addedIndex === index ? "#6EE7B7" : secondaryColor,
                    backgroundColor: addedIndex === index ? "#6EE7B7" : "transparent",
                    color: addedIndex === index ? "#065F46" : secondaryColor,
                    fontFamily: businessProfile?.primary_font || "Inter",
                  }}
                  aria-label={`Add ${keyword}`}
                >
                  {addedIndex === index ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span>Add</span>
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
