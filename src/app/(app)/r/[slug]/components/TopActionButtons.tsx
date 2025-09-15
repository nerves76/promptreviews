/**
 * TopActionButtons Component
 * 
 * Displays the style and save for later buttons at the top of the prompt page.
 * This component is extracted from the main prompt page to improve maintainability.
 */

import React from 'react';
import Icon from '@/components/Icon';
import { getAccessibleColor, applyCardTransparency, getContrastTextColor } from '@/utils/colorUtils';
import { isOffWhiteOrCream } from '../utils/helperFunctions';

interface BusinessProfile {
  card_bg?: string;
  primary_color?: string;
  secondary_color?: string;
  card_transparency?: number;
  card_border_width?: number;
  card_border_color?: string;
  card_text?: string;
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
            <Icon name="FaPalette" className="w-5 h-5 transition-colors group-hover:text-slate-blue" size={20} />
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 shadow-md"
          style={{
            backgroundColor: applyCardTransparency(businessProfile?.card_bg || '#FFFFFF', businessProfile?.card_transparency ?? 0.30),
            borderColor: businessProfile?.card_border_color || "#FFFFFF",
            borderWidth: businessProfile?.card_border_width || 1,
            color: businessProfile?.card_text || "#FFFFFF",
            backdropFilter: (businessProfile?.card_transparency ?? 1) < 1 ? 'blur(5px)' : undefined,
            WebkitBackdropFilter: (businessProfile?.card_transparency ?? 1) < 1 ? 'blur(5px)' : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Icon name="FaHeart" className="w-5 h-5" size={20} />
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
