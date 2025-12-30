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
import { createClient } from "@/auth/providers/supabase";

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
    <div className={`max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-3 mb-6 shadow-md ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className="flex-shrink-0">
            <Icon name="FaExclamationTriangle" className="h-5 w-5 text-blue-600 animate-pulse" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-900 text-sm font-medium">
              <span className="font-bold">Complete your business profile</span> to get the most out of Prompt Reviews.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/dashboard/business-profile"
            className="inline-flex items-center gap-1.5 bg-slate-blue text-white hover:bg-slate-blue/90 font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-sm whitespace-nowrap text-sm"
          >
            Complete profile
            <Icon name="FaArrowRight" className="h-3 w-3" size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
} 