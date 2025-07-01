/**
 * Announcement Banner Component
 * Displays active announcements to all users at the top of the page
 * Supports announcements with optional buttons/links
 */

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { getActiveAnnouncement } from "@/utils/admin";

interface Announcement {
  id: string;
  message: string;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveAnnouncement();
  }, []);

  const loadActiveAnnouncement = async () => {
    try {
      setIsLoading(true);
      
      // Get the most recent active announcement
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching active announcement:', error);
      }

      if (announcements) {
        setAnnouncement(announcements);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in session storage to prevent showing again this session
    if (announcement) {
      sessionStorage.setItem(`announcement-dismissed-${announcement.id}`, 'true');
    }
  };

  // Check if this announcement was dismissed
  useEffect(() => {
    if (announcement && sessionStorage.getItem(`announcement-dismissed-${announcement.id}`) === 'true') {
      setIsVisible(false);
    }
  }, [announcement]);

  if (isLoading || !isVisible || !announcement) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-blue-100">
              <svg
                className="h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                {announcement.message}
              </p>
              {announcement.button_text && announcement.button_url && (
                <a
                  href={announcement.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-500 underline mt-1 inline-block"
                >
                  {announcement.button_text}
                </a>
              )}
            </div>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleDismiss}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-800 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 