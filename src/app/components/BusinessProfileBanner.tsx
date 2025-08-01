/**
 * BusinessProfileBanner Component
 * 
 * A prominent banner that appears when business profile is incomplete,
 * encouraging users to complete it first before using other features.
 */

"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { useState, useEffect } from "react";
import { fetchOnboardingTasks } from "@/utils/onboardingTasks";
import { createClient } from "@/utils/supabaseClient";

interface BusinessProfileBannerProps {
  show?: boolean; // Make optional since we'll determine it internally
  userId?: string; // Accept userId to check task status
  hasBusiness?: boolean; // Only show when business exists
  className?: string;
}

export default function BusinessProfileBanner({ 
  show, 
  userId,
  hasBusiness,
  className = "" 
}: BusinessProfileBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTaskStatus = async () => {
      if (show !== undefined) {
        // If show prop is explicitly provided, use it
        setShouldShow(show);
        setLoading(false);
        return;
      }

      if (!userId || !hasBusiness) {
        setShouldShow(false);
        setLoading(false);
        return;
      }

      try {
        const taskStatus = await fetchOnboardingTasks(userId);
        const businessProfileCompleted = taskStatus["business-profile"] || false;
        setShouldShow(!businessProfileCompleted);
      } catch (error) {
        console.error('BusinessProfileBanner: Error checking task status:', error);
        setShouldShow(false);
      } finally {
        setLoading(false);
      }
    };

    checkTaskStatus();
  }, [show, userId, hasBusiness]);

  // Listen for business profile completion events
  useEffect(() => {
    const handleBusinessProfileCompleted = () => {
      setShouldShow(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('business-profile-completed', handleBusinessProfileCompleted);
      return () => window.removeEventListener('business-profile-completed', handleBusinessProfileCompleted);
    }
  }, []);

  if (loading || !shouldShow) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4 mb-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Icon name="FaExclamationTriangle" className="h-6 w-6 text-blue-600 animate-pulse" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900">
              Complete Your Business Profile First!
            </h3>
            <p className="text-blue-800 text-sm">
              To get the most out of PromptReviews, please fill out your business information. 
              This helps us create better prompts and widgets for you.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/dashboard/business-profile"
            className="inline-flex items-center gap-2 bg-slate-blue text-white hover:bg-slate-blue/90 font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            Complete Profile
                          <Icon name="FaArrowRight" className="h-4 w-4" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
} 