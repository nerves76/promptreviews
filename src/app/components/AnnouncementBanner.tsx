/**
 * Announcement Banner Component
 * Displays active announcements to all users at the top of the page
 */

'use client';

import { useState, useEffect } from 'react';
import { getActiveAnnouncement } from '../../utils/admin';

interface AnnouncementBannerProps {
  className?: string;
}

export default function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      const activeAnnouncement = await getActiveAnnouncement();
      setAnnouncement(activeAnnouncement);
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
    <div className={`bg-slateblue text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {announcement}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center p-1.5 rounded-md text-white hover:bg-slateblue/80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slateblue"
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