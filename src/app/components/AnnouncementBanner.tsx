/**
 * Announcement Banner Component
 * Displays active announcements to all users at the top of the page
 * Supports announcements with optional buttons/links
 */

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { getUserOrMock } from "@/utils/supabase";
import { useAdmin } from "@/contexts/AdminContext";

// Use the singleton Supabase client instead of creating a new instance
// This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    // Show banner for admin users
    if (isAdminUser) {
      setIsVisible(true);
    }
  }, [isAdminUser]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100">
              <svg
                className="h-5 w-5 text-yellow-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium text-sm text-yellow-800">
              <span className="md:hidden">Admin mode active</span>
              <span className="hidden md:inline">
                You are currently in admin mode. You can access admin features and see additional controls.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={() => setIsVisible(false)}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 