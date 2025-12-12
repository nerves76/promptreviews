/**
 * RecentReviewsButton Component
 *
 * Button that appears on public prompt pages below the business name.
 * Only shows when the Recent Reviews feature is enabled AND there are 3+ reviews available.
 * Opens the RecentReviewsModal when clicked.
 *
 * Security:
 * - Handles 403 errors when account isolation prevents access
 * - Uses apiClient for proper authentication and account header injection
 * - Gracefully hides when access is denied (account mismatch)
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { getContrastTextColor } from "@/utils/colorUtils";

interface RecentReviewsButtonProps {
  /** Prompt page ID to check for reviews */
  promptPageId: string;
  /** Whether the Recent Reviews feature is enabled */
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

export default function RecentReviewsButton({
  promptPageId,
  enabled,
  businessProfile,
  onOpenModal,
}: RecentReviewsButtonProps) {
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasEnoughReviews, setHasEnoughReviews] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if there are enough reviews when component mounts
  useEffect(() => {
    if (enabled && promptPageId) {
      checkReviewCount();
    } else {
      setLoading(false);
      setHasEnoughReviews(false);
    }
  }, [enabled, promptPageId]);

  const checkReviewCount = async () => {
    try {
      // Use apiClient which automatically handles:
      // - Authentication tokens via TokenManager
      // - X-Selected-Account header injection (with fallback to token extraction)
      // - Proper credentials handling
      const data = await apiClient.get<{
        hasEnoughReviews: boolean;
        totalCount: number;
      }>(`/recent-reviews/${promptPageId}`, {
        skipAuth: false, // Ensure auth is included if available
      });

      setHasEnoughReviews(data.hasEnoughReviews);
      setReviewCount(data.totalCount || 0);
      setAccessDenied(false);
    } catch (error: any) {
      if (error.status === 403) {
        // Account mismatch or unauthorized access - silently hide the button
        setHasEnoughReviews(false);
        setReviewCount(0);
        setAccessDenied(true);
      } else {
        console.error('Error checking review count:', error);
        setHasEnoughReviews(false);
        setReviewCount(0);
        setAccessDenied(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const secondaryColor = businessProfile?.secondary_color || "#4F46E5";
  const hoverTextColor = getContrastTextColor(secondaryColor);

  // Don't render anything if feature is disabled, loading, not enough reviews, or access denied
  if (!enabled || loading || !hasEnoughReviews || accessDenied) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <button
        onClick={onOpenModal}
        className="px-3 py-1 border rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-1 transition-all duration-200 hover:text-white"
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
        aria-label="View recent reviews"
      >
        <span>Recent reviews</span>
      </button>
    </div>
  );
} 