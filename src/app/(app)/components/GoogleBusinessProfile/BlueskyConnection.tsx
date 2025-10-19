'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface BlueskyConnectionProps {
  accountId: string;
}

export default function BlueskyConnection({ accountId }: BlueskyConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection form state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social-posting/connections?accountId=${accountId}`);
      const data = await response.json();

      if (response.ok && data.connections) {
        const bluesky = data.connections.find((conn: any) => conn.platform === 'bluesky');
        if (bluesky && bluesky.status === 'active') {
          setIsConnected(true);
          setHandle(bluesky.handle);
        } else {
          setIsConnected(false);
          setHandle(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Bluesky connection:', err);
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
    if (!identifier || !appPassword) {
      setError('Please enter both username and app password');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/social-posting/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          platform: 'bluesky',
          identifier,
          appPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.connection) {
        setIsConnected(true);
        setHandle(data.connection.handle);
        setShowConnectForm(false);
        setIdentifier('');
        setAppPassword('');
      } else {
        setError(data.error || 'Failed to connect to Bluesky');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Bluesky account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/social-posting/connections?accountId=${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsConnected(false);
        setHandle(null);
      } else {
        setError('Failed to disconnect');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Icon name="FaSpinner" className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-600">Loading Bluesky connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center p-2">
            <svg
              viewBox="0 0 512 512"
              className="w-full h-full"
              role="img"
              aria-label="Bluesky"
            >
              <title>Bluesky social icon</title>
              <path
                fill="#ffffff"
                fillRule="nonzero"
                d="M110.985 30.442c58.695 44.217 121.837 133.856 145.013 181.961 23.176-48.105 86.322-137.744 145.016-181.961 42.361-31.897 110.985-56.584 110.985 21.96 0 15.681-8.962 131.776-14.223 150.628-18.272 65.516-84.873 82.228-144.112 72.116 103.55 17.68 129.889 76.238 73 134.8-108.04 111.223-155.288-27.905-167.385-63.554-3.489-10.262-2.991-10.498-6.561 0-12.098 35.649-59.342 174.777-167.382 63.554-56.89-58.562-30.551-117.12 72.999-134.8-59.239 10.112-125.84-6.6-144.112-72.116C8.962 184.178 0 68.083 0 52.402c0-78.544 68.633-53.857 110.985-21.96z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bluesky</h3>
            <p className="text-sm text-gray-600">Share your Google Business Posts on Bluesky too!</p>
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
              <span className="text-sm font-medium text-blue-900">Connected as @{handle}</span>
            </div>
            <p className="text-sm text-blue-700">
              Your Google Business posts can now be automatically shared to Bluesky when you schedule them.
            </p>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Disconnect Bluesky
          </button>
        </div>
      ) : showConnectForm ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bluesky Handle or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username.bsky.social"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Password
            </label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Create an app password in your Bluesky settings → App Passwords
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                isConnecting
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center space-x-2">
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : (
                'Connect'
              )}
            </button>
            <button
              onClick={() => {
                setShowConnectForm(false);
                setError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-700 mb-3">
              Cross-post your Google Business updates to Bluesky automatically. Just connect your account and check the box when scheduling posts.
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
                <span>Automatic content optimization</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowConnectForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Connect Bluesky Account
          </button>
        </div>
      )}
    </div>
  );
}
