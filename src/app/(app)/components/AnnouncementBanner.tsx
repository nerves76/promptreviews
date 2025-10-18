/**
 * Announcement Banner Component
 * Displays active announcements to all users at the top of the page
 * Supports announcements with optional buttons/links
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/auth/providers/supabase";
import { getActiveAnnouncement } from "@/utils/admin";
import Icon from "@/components/Icon";

interface Announcement {
  id: string;
  message: string;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
}

export default function AnnouncementBanner() {
  const supabase = createClient();

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
    <div className="relative backdrop-blur-xl bg-white/10 border-b border-white/30 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 pr-8">
            <span className="flex p-2 rounded-lg bg-white/15 backdrop-blur-md border border-white/20">
              <Icon name="FaBell" className="text-white/90" size={24} />
            </span>
            <div className="ml-3">
              <p className="text-sm font-medium text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {announcement.message}
              </p>
              {announcement.button_text && announcement.button_url && (
                <a
                  href={announcement.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/80 hover:text-white underline mt-1 inline-block transition-colors duration-200"
                >
                  {announcement.button_text}
                </a>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-white/70 hover:text-white/90 transition-all duration-200 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/15"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 