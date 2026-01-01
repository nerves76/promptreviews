'use client';

import Icon from '@/components/Icon';
import BusinessInfoEditor from '@/app/(app)/components/BusinessInfoEditor';
import type { GoogleBusinessLocation } from '../../types/google-business';

interface BusinessInfoTabProps {
  isConnected: boolean;
  isLoading: boolean;
  scopedLocations: GoogleBusinessLocation[];
  onConnect: () => void;
}

export function BusinessInfoTab({
  isConnected,
  isLoading,
  scopedLocations,
  onConnect,
}: BusinessInfoTabProps) {
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Icon name="FaStore" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Business Profile to edit business information.
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
      <BusinessInfoEditor
        key="business-info-editor"
        locations={scopedLocations}
        isConnected={isConnected}
      />
    </div>
  );
}
