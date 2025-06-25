/**
 * Announcement Banner Component
 * Displays active announcements to all users at the top of the page
 * Supports announcements with optional buttons/links
 */

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getActiveAnnouncement } from '../../utils/admin';

// Use the same Supabase client pattern as other components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface AnnouncementBannerProps {
  className?: string;
}

interface AnnouncementData {
  message: string;
  button_text?: string;
  button_url?: string;
}

export default function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      const activeAnnouncement = await getActiveAnnouncement(supabase);
      if (activeAnnouncement) {
        // Parse the announcement data (message and optional button info)
        try {
          const parsed = JSON.parse(activeAnnouncement);
          setAnnouncement(parsed);
        } catch {
          // If not JSON, treat as plain message
          setAnnouncement({ message: activeAnnouncement });
        }
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render if no announcement or user dismissed it
  if (loading || !announcement || !isVisible) {
    return null;
  }

  return (
    <div className={`bg-slate-blue text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center flex-1 max-w-[750px]">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  fillRule="evenodd" 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium max-w-[750px] text-center">
                {announcement.message}
              </p>
              {announcement.button_text && announcement.button_url && (
                <a
                  href={announcement.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-white text-slate-blue text-xs font-medium rounded hover:bg-gray-100 transition-colors"
                >
                  {announcement.button_text}
                </a>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center p-1.5 rounded-md text-white hover:bg-slate-blue/80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-blue"
            >
              <span className="sr-only">Dismiss</span>
              <svg 
                className="h-4 w-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 