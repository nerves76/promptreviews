'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface GoogleBusinessConnectionProps {
  accountId: string;
}

interface GBPStatus {
  connected: boolean;
  email?: string;
  locationCount?: number;
}

export default function GoogleBusinessConnection({ accountId }: GoogleBusinessConnectionProps) {
  const [status, setStatus] = useState<GBPStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<{
        platforms: Array<{
          id: string;
          connected: boolean;
          connectedEmail?: string;
          locations?: Array<{ id: string }>;
        }>;
      }>('/social-posting/platforms');

      const gbp = data.platforms?.find((p) => p.id === 'google-business-profile');
      if (gbp) {
        setStatus({
          connected: gbp.connected,
          email: gbp.connectedEmail,
          locationCount: gbp.locations?.length || 0,
        });
      } else {
        setStatus({ connected: false });
      }
    } catch (err) {
      console.error('Failed to fetch GBP connection:', err);
      setStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchConnectionStatus();
    }
  }, [accountId]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get Google OAuth credentials from environment
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        setError('Missing Google OAuth configuration. Please contact support.');
        setIsConnecting(false);
        return;
      }

      // Required scope for Google Business Profile API
      const scope = 'https://www.googleapis.com/auth/business.manage openid email profile';
      const encodedScope = encodeURIComponent(scope);
      const responseType = 'code';

      // State contains return URL and account context
      const statePayload = {
        platform: 'google-business-profile',
        returnUrl: '/dashboard/integrations',
        accountId: accountId,
      };
      const state = encodeURIComponent(JSON.stringify(statePayload));

      // Construct Google OAuth URL
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodedScope}&response_type=${responseType}&state=${state}&access_type=offline&prompt=select_account%20consent&include_granted_scopes=false`;

      // Small delay to ensure state is ready
      setTimeout(() => {
        window.location.href = googleAuthUrl;
      }, 100);
    } catch (err) {
      setError('Failed to initiate Google connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Business Profile?')) {
      return;
    }

    try {
      await apiClient.post('/social-posting/platforms/google-business-profile/disconnect', {});
      setStatus({ connected: false });
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Icon name="FaSpinner" className="w-5 h-5 text-gray-500 animate-spin" />
          <span className="text-sm text-gray-600">Loading Google Business Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#4285F4' }}
          >
            <Icon name="FaGoogle" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Business Profile</h3>
            <p className="text-sm text-gray-600">Post updates to your business listing on Google</p>
          </div>
        </div>
        {status?.connected && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Icon name="FaCheck" className="w-3 h-3 mr-1" />
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
          <Icon name="FaExclamationTriangle" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="FaCheck" className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Connected{status.email ? ` as ${status.email}` : ''}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {status.locationCount
                ? `${status.locationCount} location${status.locationCount > 1 ? 's' : ''} available`
                : 'No locations selected'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/dashboard/google-business"
              className="px-4 py-2 text-sm font-medium text-slate-blue border border-slate-blue rounded-md hover:bg-slate-blue/5 transition-colors"
            >
              Manage locations
            </a>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-700 mb-3">
              Connect your Google Business Profile to post updates directly to your Google listing.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Post updates to Google Search and Maps</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Upload photos to your business gallery</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Schedule posts in advance</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center space-x-2 ${
              isConnecting ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#4285F4] hover:bg-[#3367D6]'
            }`}
          >
            {isConnecting ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Icon name="FaGoogle" className="w-4 h-4" />
                <span>Connect Google Business Profile</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
