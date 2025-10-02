/**
 * RecentReviewsModal Component
 *
 * Displays recent reviews in a modal with privacy protection (initials only).
 * Uses business branding and follows app modal standards with red X close button.
 * Only shows when 3+ reviews are available and feature is enabled.
 *
 * Security:
 * - Handles 403 errors when account isolation prevents access
 * - Uses apiClient for proper authentication and account header injection
 * - Shows user-friendly message when access is denied (account mismatch)
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface Review {
  initials: string;
  content: string;
  platform: string;
  date: string;
}

interface RecentReviewsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Prompt page ID to fetch reviews for */
  promptPageId: string;
  /** Business profile for branding */
  businessProfile?: {
    primary_color?: string;
    secondary_color?: string;
    primary_font?: string;
    business_name?: string;
    card_bg?: string;
  };
}

export default function RecentReviewsModal({
  isOpen,
  onClose,
  promptPageId,
  businessProfile,
}: RecentReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && promptPageId) {
      fetchReviews();
    }
  }, [isOpen, promptPageId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      // Use apiClient which automatically handles:
      // - Authentication tokens via TokenManager
      // - X-Selected-Account header injection (with fallback to token extraction)
      // - Proper credentials handling
      const data = await apiClient.get<{
        hasEnoughReviews: boolean;
        reviews?: Review[];
        message?: string;
      }>(`/recent-reviews/${promptPageId}`, {
        skipAuth: false, // Ensure auth is included if available
      });

      if (data.hasEnoughReviews) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
        setError(data.message || 'Not enough reviews available');
      }
    } catch (err: any) {
      console.error('Error fetching recent reviews:', err);

      if (err.status === 403) {
        // Account mismatch or unauthorized access
        setAccessDenied(true);
        setError('Recent reviews are not available for the selected account');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      }

      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google':
        return 'FaGoogle';
      case 'yelp':
        return 'FaYelp';
      case 'facebook':
        return 'FaFacebook';
      case 'tripadvisor':
        return 'FaTripadvisor';
      default:
        return 'FaGlobe';
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
      <div 
        className="rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden relative animate-slideup shadow-2xl border-2 border-white backdrop-blur-sm"
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
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon
              name="FaCommentDots"
              className="w-6 h-6"
              style={{ color: businessProfile?.primary_color || "#4F46E5" }}
              size={24}
            />
            <h2
              className="text-xl font-bold"
              style={{
                color: businessProfile?.primary_color || "#4F46E5",
                fontFamily: businessProfile?.primary_font || "Inter"
              }}
            >
              Recent Reviews
            </h2>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Recent reviews for {businessProfile?.business_name || "customers"}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                   style={{ borderColor: businessProfile?.primary_color || "#4F46E5" }}>
              </div>
              <span className="ml-3 text-gray-600">Loading reviews...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <Icon
                name={accessDenied ? "FaLock" : "FaExclamationTriangle"}
                className="w-8 h-8 text-gray-400 mx-auto mb-3"
                size={32}
              />
              <p className="text-gray-600">{error}</p>
              {accessDenied && (
                <p className="text-sm text-gray-500 mt-2">
                  This may occur when viewing prompt pages from a different account
                </p>
              )}
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="text-center py-8">
              <Icon name="FaCommentDots" className="w-8 h-8 text-gray-400 mx-auto mb-3" size={32} />
              <p className="text-gray-600">No recent reviews available</p>
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  {/* Review Content */}
                  <p 
                    className="text-gray-800 leading-relaxed mb-3"
                    style={{ fontFamily: businessProfile?.primary_font || "Inter" }}
                  >
                    "{review.content}"
                  </p>

                  {/* Attribution at bottom */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{review.initials} via {review.platform}</span>
                    </div>
                    <span className="text-gray-400">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
} 