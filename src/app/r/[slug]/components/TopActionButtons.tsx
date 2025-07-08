/**
 * TopActionButtons Component
 * 
 * Displays the style and save for later buttons at the top of the prompt page.
 * This component is extracted from the main prompt page to improve maintainability.
 */

import React from 'react';
import { FaPalette, FaHeart } from 'react-icons/fa';
import { getAccessibleColor } from '@/utils/colorUtils';
import { isOffWhiteOrCream } from '../utils/helperFunctions';

interface BusinessProfile {
  card_bg?: string;
  primary_color?: string;
}

interface TopActionButtonsProps {
  businessProfile: BusinessProfile;
  showBanner: boolean;
  isOwner: boolean;
  userLoading: boolean;
  showOnlyHeart: boolean;
  onStyleClick: () => void;
  onSaveClick: () => void;
}

export default function TopActionButtons({
  businessProfile,
  showBanner,
  isOwner,
  userLoading,
  showOnlyHeart,
  onStyleClick,
  onSaveClick,
}: TopActionButtonsProps) {
  const buttonStyle = {
    background: isOffWhiteOrCream(businessProfile?.card_bg || "#FFFFFF")
      ? businessProfile?.card_bg || "#FFFFFF"
      : "#FFFFFF",
    color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
    border: "1px solid #E5E7EB"
  };

  return (
    <>
      {/* Style Button - Only visible to page owners */}
      {!userLoading && isOwner && (
        <div
          className={`fixed left-4 z-40 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
        >
          <button
            onClick={onStyleClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group"
            style={buttonStyle}
            title="Style your prompt pages"
          >
            <FaPalette className="w-5 h-5 transition-colors group-hover:text-slate-blue" />
            <span className="hidden sm:inline">Style</span>
          </button>
        </div>
      )}

      {/* Save for Later Button */}
      <div
        className={`fixed right-4 z-40 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
      >
        <button
          onClick={onSaveClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group"
          style={buttonStyle}
        >
          <FaHeart className="w-5 h-5 transition-colors group-hover:text-red-500" />
          <span className={`hidden sm:inline${showOnlyHeart ? " sm:hidden" : ""}`}>
            {showOnlyHeart ? "" : "Save for Later"}
          </span>
          <span className={`inline sm:hidden${showOnlyHeart ? " hidden" : ""}`}>
            {showOnlyHeart ? "" : "Save"}
          </span>
        </button>
      </div>
    </>
  );
} 