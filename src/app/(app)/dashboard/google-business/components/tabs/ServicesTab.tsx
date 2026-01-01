'use client';

import Icon from '@/components/Icon';
import ButtonSpinner from '@/components/ButtonSpinner';
import ServicesEditor from '@/app/(app)/components/ServicesEditor';
import type { GoogleBusinessLocation } from '../../types/google-business';

interface ServicesTabProps {
  isConnected: boolean;
  isLoading: boolean;
  scopedLocations: GoogleBusinessLocation[];
  onConnect: () => void;
}

export function ServicesTab({
  isConnected,
  isLoading,
  scopedLocations,
  onConnect,
}: ServicesTabProps) {
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Icon name="FaHandshake" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Business Profile to manage categories and services.
        </p>
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
        >
          {isLoading ? (
            <>
              <ButtonSpinner />
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
      <ServicesEditor
        key="services-editor"
        locations={scopedLocations}
        isConnected={isConnected}
      />
    </div>
  );
}
