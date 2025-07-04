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
    <div className="bg-blue-50 border-b border-blue-200 relative">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 pr-8">
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
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 