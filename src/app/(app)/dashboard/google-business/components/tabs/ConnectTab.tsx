'use client';

import Icon from '@/components/Icon';
import type { GoogleBusinessLocation, GoogleBusinessTab } from '../../types/google-business';

interface PostResult {
  success: boolean;
  message: string;
}

interface ConnectTabProps {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  locations: GoogleBusinessLocation[];
  selectedLocations: string[];
  hasAttemptedFetch: boolean;

  // Fetching state
  fetchingLocations: string | null;
  rateLimitedUntil: number | null;
  rateLimitCountdown: number;

  // Results
  postResult: PostResult | null;

  // Handlers
  onConnect: () => void;
  onShowDisconnectConfirm: () => void;
  onFetchLocations: () => void;
  onLoadPlatforms: () => void;
  onChangeTab: (tab: GoogleBusinessTab) => void;
  onClearPostResult: () => void;
  setIsLoading: (loading: boolean) => void;
}

export function ConnectTab({
  isConnected,
  isLoading,
  locations,
  selectedLocations,
  hasAttemptedFetch,
  fetchingLocations,
  rateLimitedUntil,
  rateLimitCountdown,
  postResult,
  onConnect,
  onShowDisconnectConfirm,
  onFetchLocations,
  onLoadPlatforms,
  onChangeTab,
  onClearPostResult,
  setIsLoading,
}: ConnectTabProps) {
  const isRateLimited = Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil);
  const rateLimitSecondsRemaining = rateLimitedUntil ? Math.ceil((rateLimitedUntil - Date.now()) / 1000) : 0;

  return (
    <div className="space-y-6">
      {/* Show loading state when syncing after OAuth */}
      {isLoading && isConnected && locations.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Syncing Connection...</h4>
              <p className="text-xs text-blue-700 mt-1">
                Verifying your Google Business Profile connection. Please wait...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google Business Profile Connection Status */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="FaGoogle" className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Google Business Profile</h3>
              <p className="text-sm text-gray-600">
                Connect to post updates to your business locations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <div className="flex items-center space-x-2 text-green-600">
                  <Icon name="FaCheck" className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <button
                  onClick={onShowDisconnectConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md transition-colors text-sm flex items-center space-x-2 ${
                    isLoading
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                      : 'text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Disconnecting...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="FaTimes" className="w-4 h-4" />
                      <span>Disconnect</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={onConnect}
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
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
                <p className="text-xs text-gray-500 text-right max-w-xs">
                  Warning: Check ALL permission boxes when prompted by Google
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Show fetching progress indicator */}
        {fetchingLocations === 'google-business-profile' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center space-x-3">
              <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Fetching Business Locations...</h4>
                <p className="text-xs text-blue-700 mt-1">
                  This typically takes 1-2 minutes due to Google API rate limits. Please wait...
                </p>
              </div>
            </div>
          </div>
        )}

        {isConnected && locations.length === 0 && !fetchingLocations && (
          <div className={`border rounded-md p-4 ${hasAttemptedFetch ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start space-x-3">
              <Icon
                name={hasAttemptedFetch ? "FaExclamationTriangle" : "FaInfoCircle"}
                className={`w-5 h-5 mt-0.5 ${hasAttemptedFetch ? 'text-yellow-600' : 'text-blue-600'}`}
              />
              <div>
                <h4 className={`text-sm font-medium mb-1 ${hasAttemptedFetch ? 'text-yellow-800' : 'text-blue-800'}`}>
                  {hasAttemptedFetch ? 'No Locations Found' : 'Next Step: Fetch Your Business Locations'}
                </h4>
                <p className={`text-sm mb-3 ${hasAttemptedFetch ? 'text-yellow-700' : 'text-blue-700'}`}>
                  {hasAttemptedFetch
                    ? 'Your Google Business Profile appears to have no locations, or they couldn\'t be retrieved. You can try fetching again or check your Google Business Profile.'
                    : 'Great! Your Google Business Profile is connected. Now fetch your business locations to start creating posts and managing your online presence.'
                  }
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={onFetchLocations}
                    disabled={fetchingLocations === 'google-business-profile' || isRateLimited}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      fetchingLocations === 'google-business-profile' || isRateLimited
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-slate-600 text-white hover:bg-slate-700'
                    }`}
                  >
                    {fetchingLocations === 'google-business-profile' ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                        <span>Fetching (1-2 min)...</span>
                      </>
                    ) : isRateLimited ? (
                      <>
                        <Icon name="FaClock" className="w-4 h-4" />
                        <span>Rate limited ({rateLimitSecondsRemaining}s)</span>
                      </>
                    ) : (
                      <span>Fetch business locations</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Success & Locations */}
        {isConnected && locations.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Icon name="FaCheck" className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">
                  Setup Complete!
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  {selectedLocations.length > 0
                    ? `Managing ${selectedLocations.length} of ${locations.length} business location${locations.length !== 1 ? 's' : ''}.`
                    : `${locations.length} business location${locations.length !== 1 ? 's' : ''} available.`
                  } Your Google Business Profile is ready!
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onChangeTab('overview')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    View Overview →
                  </button>
                  <button
                    onClick={onFetchLocations}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-1"
                  >
                    <Icon name="FaCog" className="w-3 h-3" />
                    <span>Choose location(s)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Messages */}
      {postResult && postResult.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center space-x-2 text-green-800 mb-2">
            <Icon name="FaCheck" className="w-4 h-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
          <p className="text-sm text-green-700">{postResult.message}</p>
          {/* Add refresh button if connected but no locations visible */}
          {isConnected && locations.length === 0 && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  onLoadPlatforms();
                }}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              >
                Refresh Connection Status
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {postResult && !postResult.success && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 relative">
          <button
            onClick={onClearPostResult}
            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            aria-label="Dismiss"
          >
            <Icon name="FaTimes" className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <Icon name="FaExclamationTriangle" className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-red-700">{postResult.message}</p>

          {rateLimitCountdown > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
              <Icon name="FaClock" className="w-3 h-3" />
              <span>You can retry in {rateLimitCountdown} seconds</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
