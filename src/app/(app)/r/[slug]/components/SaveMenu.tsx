/**
 * SaveMenu Component
 * 
 * Provides save for later functionality with various options.
 * This component is extracted from the main prompt page to improve maintainability.
 */

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { getAccessibleColor } from '@/utils/colorUtils';

interface BusinessProfile {
  business_name?: string;
  primary_color?: string;
  card_bg?: string;
}

interface AvailableFeatures {
  share: boolean;
  notifications: boolean;
  clipboard: boolean;
  bookmarks: boolean;
}

interface SaveMenuProps {
  businessProfile: BusinessProfile;
  showBanner: boolean;
  showOnlyHeart: boolean;
  availableFeatures: AvailableFeatures;
  onSaveOption: (option: string) => void;
}

export default function SaveMenu({ 
  businessProfile, 
  showBanner, 
  showOnlyHeart, 
  availableFeatures,
  onSaveOption 
}: SaveMenuProps) {
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setShowSaveMenu(false);
      }
    }

    if (showSaveMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSaveMenu]);

  const handleSaveOptionClick = (option: string) => {
    onSaveOption(option);
    setShowSaveMenu(false);
  };

  return (
    <div
              className={`fixed right-4 z-40 transition-all duration-300 ${showBanner ? "top-28 sm:top-24" : "top-4"}`}
      ref={saveMenuRef}
    >
      <button
        onClick={() => setShowSaveMenu(!showSaveMenu)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group"
        style={{
          background: businessProfile?.card_bg || "#FFFFFF",
          color: getAccessibleColor(businessProfile?.primary_color || "#4F46E5"),
          border: "1px solid #E5E7EB"
        }}
      >
        <Icon name="FaHeart" className="w-5 h-5 transition-colors group-hover:text-red-500" />
        <span className={`hidden sm:inline${showOnlyHeart ? " sm:hidden" : ""}`}>
          {showOnlyHeart ? "" : "Save for Later"}
        </span>
        <span className={`inline sm:hidden${showOnlyHeart ? " hidden" : ""}`}>
          {showOnlyHeart ? "" : "Save"}
        </span>
      </button>

      {showSaveMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 animate-fadein">
          <button
            onClick={() => handleSaveOptionClick("calendar")}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            style={{ color: businessProfile?.primary_color || "#4F46E5" }}
          >
            <Icon name="FaCalendarAlt" className="w-4 h-4" />
            Add to Calendar
          </button>
          
          <button
            onClick={() => handleSaveOptionClick("email")}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            style={{ color: businessProfile?.primary_color || "#4F46E5" }}
          >
            <Icon name="FaEnvelope" className="w-4 h-4" />
            Email to Self
          </button>
          
          <button
            onClick={() => handleSaveOptionClick("home-screen")}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            style={{ color: businessProfile?.primary_color || "#4F46E5" }}
          >
            <Icon name="FaHome" className="w-4 h-4" />
            Add to Home Screen
          </button>
          
          {availableFeatures.clipboard && (
            <button
              onClick={() => handleSaveOptionClick("copy-link")}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              style={{ color: businessProfile?.primary_color || "#4F46E5" }}
            >
              <Icon name="FaLink" className="w-4 h-4" />
              Copy Link
            </button>
          )}
          
          {availableFeatures.share && (
            <button
              onClick={() => handleSaveOptionClick("reading-list")}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              style={{ color: businessProfile?.primary_color || "#4F46E5" }}
            >
              <Icon name="FaBookmark" className="w-4 h-4" />
              Add to Reading List
            </button>
          )}
          
          <button
            onClick={() => handleSaveOptionClick("pocket")}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            style={{ color: businessProfile?.primary_color || "#4F46E5" }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z" />
            </svg>
            Save to Pocket
          </button>
          
          <button
            onClick={() => handleSaveOptionClick("instapaper")}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            style={{ color: businessProfile?.primary_color || "#4F46E5" }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z" />
            </svg>
            Save to Instapaper
          </button>
          
          {availableFeatures.bookmarks && (
            <button
              onClick={() => handleSaveOptionClick("favorites")}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              style={{ color: businessProfile?.primary_color || "#4F46E5" }}
            >
              <Icon name="FaFavorites" className="w-4 h-4" />
              Bookmark in Browser
            </button>
          )}
        </div>
      )}
    </div>
  );
} 