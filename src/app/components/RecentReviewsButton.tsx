/**
 * RecentReviewsButton Component
 * 
 * Button that appears on public prompt pages below the business name.
 * Only shows when the Recent Reviews feature is enabled AND there are 3+ reviews available.
 * Opens the RecentReviewsModal when clicked.
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";

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
  const [hasEnoughReviews, setHasEnoughReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

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
      const response = await fetch(`/api/recent-reviews/${promptPageId}`);
      const data = await response.json();

      if (response.ok) {
        setHasEnoughReviews(data.hasEnoughReviews);
        setReviewCount(data.totalCount || 0);
      } else {
        setHasEnoughReviews(false);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Error checking review count:', error);
      setHasEnoughReviews(false);
      setReviewCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if feature is disabled or not enough reviews
  if (!enabled || loading || !hasEnoughReviews) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <button
        onClick={onOpenModal}
        className="inline-flex items-center px-3 py-1.5 rounded-lg border-2 font-medium text-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style={{
          borderColor: businessProfile?.secondary_color || "#4F46E5",
          color: businessProfile?.secondary_color || "#4F46E5",
          backgroundColor: "transparent",
          fontFamily: businessProfile?.primary_font || "Inter",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#4F46E5";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = businessProfile?.secondary_color || "#4F46E5";
        }}
        aria-label="View recent reviews"
      >
        <span>Recent reviews</span>
      </button>
    </div>
  );
} 