'use client';

import Icon from '@/components/Icon';
import PhotoManagement from '@/app/(app)/components/PhotoManagement';
import type { GoogleBusinessLocation } from '../../types/google-business';

interface PhotosTabProps {
  isConnected: boolean;
  isLoading: boolean;
  scopedLocations: GoogleBusinessLocation[];
  onConnect: () => void;
}

export function PhotosTab({
  isConnected,
  isLoading,
  scopedLocations,
  onConnect,
}: PhotosTabProps) {
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Icon name="FaImage" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Business Profile to manage photos for your business locations.
        </p>
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
        >
          {isLoading ? (
            <>
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Icon name="FaGoogle" className="w-4 h-4" />
              <span>Connect Google Business</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          <Icon name="FaCalendarAlt" size={14} className="inline mr-2" />
          Want to schedule photo uploads in advance?
        </p>
        <a
          href="/dashboard/social-posting"
          className="text-sm font-medium text-slate-blue hover:underline"
        >
          Go to Post Scheduling →
        </a>
      </div>
      <PhotoManagement
        locations={scopedLocations}
        isConnected={isConnected}
      />
    </div>
  );
}
