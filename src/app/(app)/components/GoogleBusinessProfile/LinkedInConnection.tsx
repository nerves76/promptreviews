'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface LinkedInConnectionProps {
  accountId: string;
}

export default function LinkedInConnection({ accountId }: LinkedInConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnectionStatus = async () => {
    try {
      setIsLoading(true);
      // Use apiClient - accountId sent via X-Selected-Account header
      const data = await apiClient.get<{
        connections: Array<{ platform: string; status: string; handle: string | null }>;
      }>('/social-posting/connections');

      if (data.connections) {
        const linkedin = data.connections.find((conn) => conn.platform === 'linkedin');
        if (linkedin && linkedin.status === 'active') {
          setIsConnected(true);
          setProfileName(linkedin.handle);
        } else {
          setIsConnected(false);
          setProfileName(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn connection:', err);
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
      // Call auth endpoint to get OAuth URL
      const data = await apiClient.get<{ authUrl: string }>('/social-posting/linkedin/auth');
      // Redirect to LinkedIn OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setError('Failed to initiate LinkedIn connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      return;
    }

    try {
      // Use apiClient - accountId sent via X-Selected-Account header
      await apiClient.delete('/social-posting/connections?platform=linkedin');
      setIsConnected(false);
      setProfileName(null);
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Icon name="FaSpinner" className="w-5 h-5 text-gray-500 animate-spin" />
          <span className="text-sm text-gray-600">Loading LinkedIn connection...</span>
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
            style={{ backgroundColor: '#0A66C2' }}
          >
            <Icon name="FaLinkedin" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">LinkedIn</h3>
            <p className="text-sm text-gray-600">Share your Google Business posts on LinkedIn too!</p>
          </div>
        </div>
        {isConnected && (
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

      {isConnected ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="FaCheck" className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Connected{profileName ? ` as ${profileName}` : ''}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Your Google Business posts can now be automatically shared to LinkedIn when you schedule them.
            </p>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Disconnect LinkedIn
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-700 mb-3">
              Cross-post your Google Business updates to LinkedIn automatically. Just connect your account and check the box when scheduling posts.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Compose once, post to both platforms</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Schedule posts in advance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="FaCheck" className="w-3 h-3 text-green-500" />
                <span>Reach your professional network</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center space-x-2 ${
              isConnecting ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#0A66C2] hover:bg-[#094d92]'
            }`}
          >
            {isConnecting ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Icon name="FaLinkedin" className="w-4 h-4" />
                <span>Connect LinkedIn</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
